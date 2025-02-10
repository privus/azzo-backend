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
    const status_pagamento_id = debtDto.data_pagamento ? 2 : 1;
    const status_pagamento = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id } });
    if (!status_pagamento) {
      throw new Error('Status de pagamento padrão não encontrado.');
    }

    let departamento = await this.departamentoRepository.findOne({ where: { nome: debtDto.departamento_nome } });
    if (!departamento && debtDto.departamento_nome) {
      departamento = this.departamentoRepository.create({ nome: debtDto.departamento_nome });
      await this.departamentoRepository.save(departamento);
    }

    let categoria = await this.categoriaDebitoRepository.findOne({ where: { nome: debtDto.categoria_nome } });
    if (!categoria && debtDto.categoria_nome) {
      categoria = this.categoriaDebitoRepository.create({ nome: debtDto.categoria_nome });
      await this.categoriaDebitoRepository.save(categoria);
    }

    const datas_vencimento = this.generateInstallmentDates(new Date(debtDto.data_vencimento), debtDto.numero_parcelas, debtDto.periodicidade || 31);

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
      status_pagamento,
      departamento,
      categoria,
      conta: debtDto.conta,
      empresa: debtDto.empresa_grupo,
      despesa_grupo: debtDto.despesa_grupo,
      datas_vencimento,
      criado_por: debtDto.criado_por,
    });

    const savedDebt = await this.debtRepository.save(debitoEntity);

    const parcelas = datas_vencimento.map((dataVencimento, index) => {
      return this.parcelaRepository.create({
        numero: index + 1,
        valor: Number(debtDto.valor_total / debtDto.numero_parcelas),
        data_criacao: new Date(),
        data_competencia: new Date(debtDto.data_competencia),
        data_vencimento: new Date(dataVencimento),
        status_pagamento,
        data_pagamento: debtDto.data_pagamento ? new Date(debtDto.data_pagamento) : null,
        juros: debtDto.juros || 0,
        debito: savedDebt,
      });
    });

    await this.parcelaRepository.save(parcelas);
    return savedDebt;
  }

  /**
   * Gera um array de datas de vencimento baseado na primeira parcela, número de parcelas e periodicidade.
   */
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

    const overdueParcels = await this.parcelaRepository.find({
      where: {
        data_vencimento: LessThan(today),
        data_pagamento: null,
      },
      relations: ['debito', 'status_pagamento'],
    });

    if (overdueParcels.length === 0) return;

    const statusEmAtraso = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 3 } });
    if (!statusEmAtraso) {
      throw new Error('Status "Em Atraso" não encontrado.');
    }

    const updatedDebts = new Set<number>();

    for (const parcela of overdueParcels) {
      parcela.status_pagamento = statusEmAtraso;
      updatedDebts.add(parcela.debito.debito_id);
    }

    await this.parcelaRepository.save(overdueParcels);

    for (const debitoId of updatedDebts) {
      await this.debtRepository.update(debitoId, { status_pagamento: statusEmAtraso });
    }
  }

  async getAllDebts(): Promise<Debito[]> {
    return this.debtRepository.find({ relations: ['parcela_debito', 'status_pagamento', 'categoria', 'departamento'] });
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
