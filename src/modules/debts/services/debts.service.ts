import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CategoriaDebito, Debito, Departamento, ParcelaDebito, StatusPagamento } from '../../../infrastructure/database/entities';
import { DebtsDto } from '../dto/debts.dto';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debito) private readonly debtRepository: Repository<Debito>,
    @InjectRepository(ParcelaDebito) private readonly parcelaRepository: Repository<ParcelaDebito>,
    @InjectRepository(StatusPagamento) private readonly statusPagamentoRepository: Repository<StatusPagamento>,
    @InjectRepository(Departamento) private readonly departamentoRepository: Repository<Departamento>,
    @InjectRepository(CategoriaDebito) private readonly categoriaDebitoRepository: Repository<CategoriaDebito>,
  ) {}

  async createDebt(debtDto: DebtsDto): Promise<Debito> {
    const statusPagamentoPendente = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 1 } });
    const statusPagamentoPago = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 2 } });

    if (!statusPagamentoPendente || !statusPagamentoPago) {
      throw new Error('Status de pagamento padrão ou pago não encontrado.');
    }

    let departamento = await this.departamentoRepository.findOne({ where: { departamento_id: debtDto.departamento_id } });
    if (!departamento && debtDto.departamento_nome) {
      departamento = this.departamentoRepository.create({ nome: debtDto.departamento_nome });
      await this.departamentoRepository.save(departamento);
    }

    let categoria = await this.categoriaDebitoRepository.findOne({ where: { categoria_id: debtDto.categoria_id } });
    if (!categoria && debtDto.categoria_nome) {
      categoria = this.categoriaDebitoRepository.create({ nome: debtDto.categoria_nome });
      await this.categoriaDebitoRepository.save(categoria);
    }

    const datasVencimento = this.generateInstallmentDates(new Date(debtDto.data_vencimento), debtDto.numero_parcelas, debtDto.periodicidade || 31);

    const debitoEntity = this.debtRepository.create({
      nome: debtDto.nome,
      descricao: debtDto.descricao,
      valor_total: debtDto.valor_total,
      data_criacao: new Date(),
      data_competencia: new Date(debtDto.data_competencia),
      data_pagamento: debtDto.data_pagamento ? new Date(debtDto.data_pagamento) : null,
      numero_parcelas: debtDto.numero_parcelas,
      juros: debtDto.juros || 0,
      valor_parcela: Number(debtDto.valor_total / debtDto.numero_parcelas),
      status_pagamento: debtDto.data_pagamento && debtDto.numero_parcelas <= 1 ? statusPagamentoPago : statusPagamentoPendente,
      departamento,
      categoria,
      conta: debtDto.conta,
      empresa: debtDto.empresa_grupo,
      despesa_grupo: debtDto.despesa_grupo,
      datas_vencimento: datasVencimento,
      criado_por: debtDto.criado_por,
    });

    const savedDebt = await this.debtRepository.save(debitoEntity);

    const parcelas = datasVencimento.map((dataVencimento, index) => {
      return this.parcelaRepository.create({
        numero: index + 1,
        valor: Number(debtDto.valor_total / debtDto.numero_parcelas),
        data_criacao: new Date(),
        data_competencia: new Date(debtDto.data_competencia),
        data_vencimento: new Date(dataVencimento),
        status_pagamento: index === 0 && debtDto.data_pagamento ? statusPagamentoPago : statusPagamentoPendente,
        data_pagamento: index === 0 && debtDto.data_pagamento ? new Date(debtDto.data_pagamento) : null,
        juros: debtDto.juros || 0,
        debito: savedDebt,
      });
    });

    await this.parcelaRepository.save(parcelas);
    return savedDebt;
  }

  private generateInstallmentDates(startDate: Date, numberOfInstallments: number, periodicity: number): string[] {
    const dates: string[] = [];
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setDate(installmentDate.getDate() + i * periodicity);
      dates.push(installmentDate.toISOString().split('T')[0]);
    }
    return dates;
  }

  async updateOverdueParcels(): Promise<void> {
    const today = new Date();

    // Buscar todas as parcelas vencidas e não pagas
    const overdueParcels = await this.parcelaRepository.find({
        where: {
            data_vencimento: LessThan(today),
            data_pagamento: null,
        },
        relations: ['debito', 'status_pagamento'],
    });

    if (overdueParcels.length === 0) return;

    const statusEmAtraso = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 3 } });
    const statusPago = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 2 } });
    const statusPendente = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 1 } });

    if (!statusEmAtraso || !statusPago || !statusPendente) {
        throw new Error('Erro ao buscar status de pagamento.');
    }

    const updatedDebts = new Set<number>();

    for (const parcela of overdueParcels) {
        if (!parcela.data_pagamento) {
            parcela.status_pagamento = statusEmAtraso;
            updatedDebts.add(parcela.debito.debito_id);
        }
    }

    await this.parcelaRepository.save(overdueParcels);

    for (const debitoId of updatedDebts) {
        const parcelasDebito = await this.parcelaRepository.find({
            where: { debito: { debito_id: debitoId } },
            relations: ['status_pagamento'],
        });

        // **Verifica se todas as parcelas foram pagas**
        const todasPagas = parcelasDebito.every(parcela => parcela.status_pagamento?.status_pagamento_id === 2);
        const temAtraso = parcelasDebito.some(parcela => parcela.status_pagamento?.status_pagamento_id === 3);

        let novoStatus = statusPendente; // Status padrão "Pendente"

        if (todasPagas) {
            novoStatus = statusPago;
        } else if (temAtraso) {
            novoStatus = statusEmAtraso;
        }

        // **Atualiza o status da despesa no banco**
        await this.debtRepository.update(debitoId, { status_pagamento: novoStatus });
    }
  }


  async getAllDebts(): Promise<Debito[]> {
    this.updateOverdueParcels();
    return this.debtRepository.find({ relations: ['parcela_debito', 'status_pagamento', 'categoria', 'departamento', 'parcela_debito.status_pagamento'] });
  }

  getAllDepartments(): Promise<Departamento[]> {
    return this.departamentoRepository.find();
  }

  getAllCategories(): Promise<CategoriaDebito[]> {
    return this.categoriaDebitoRepository.find();
  }

  getDebtById(id: number): Promise<Debito> {
    return this.debtRepository.findOne({
      where: { debito_id: id },
      relations: ['parcela_debito.status_pagamento', 'status_pagamento', 'categoria', 'departamento'],
    });
  }
}
