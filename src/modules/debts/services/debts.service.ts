import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, Between, Raw } from 'typeorm';
import { CategoriaDebito, Debito, Departamento, ParcelaDebito, StatusPagamento } from '../../../infrastructure/database/entities';
import { DebtsDto } from '../dto/debts.dto';
import { UpdateInstalmentDto } from '../dto/update-instalment.dto';
import { UpdateDebtStatusDto } from '../dto';
import { Cron, CronExpression } from '@nestjs/schedule';

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
      valor_parcela: debtDto.valor_total / debtDto.numero_parcelas,
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
    let installmentDate = new Date(startDate); 

    for (let i = 0; i < numberOfInstallments; i++) {
        if (i === 0) {
            // Garante que a primeira parcela nunca seja no dia anterior
            installmentDate.setDate(installmentDate.getDate() + 1); 
        } else {
            installmentDate = new Date(dates[i - 1]); // Usa a última data como referência
            installmentDate.setDate(installmentDate.getDate() + periodicity);
        }
        dates.push(installmentDate.toISOString().split('T')[0]); // Formato "YYYY-MM-DD"
    }
    
    return dates;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateOverdueParcels(): Promise<void> {
    const today = new Date();
    today.setDate(today.getDate() - 1);

    const statusEmAtraso = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 3 } });
    const statusPago = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 2 } });
    const statusPendente = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 1 } });

    if (!statusEmAtraso || !statusPago || !statusPendente) {
      throw new Error('Erro ao buscar status de pagamento.');
    }

    // === Step 1: Fetch and update overdue parcelas that are unpaid ===
    const overdueParcels = await this.parcelaRepository.find({
      where: {
        data_vencimento: LessThan(today),
        data_pagamento: null,
      },
      relations: ['debito', 'status_pagamento'],
    });

    for (const parcela of overdueParcels) {
      if (parcela.status_pagamento?.status_pagamento_id !== 3) {
        parcela.status_pagamento = statusEmAtraso;
      }
    }

    // === Step 2: Fetch all parcelas and update those with data_pagamento ===
    const allParcels = await this.parcelaRepository.find({
      relations: ['debito', 'status_pagamento'],
    });

    for (const parcela of allParcels) {
      if (parcela.data_pagamento && parcela.status_pagamento?.status_pagamento_id !== 2) {
        parcela.status_pagamento = statusPago;
      }
    }

    await this.parcelaRepository.save([...overdueParcels, ...allParcels]);

    // === Step 3: Group parcelas by debito ===
    const parcelsByDebt = new Map<number, typeof allParcels>();

    for (const parcela of allParcels) {
      const debitoId = parcela.debito.debito_id;
      if (!parcelsByDebt.has(debitoId)) {
        parcelsByDebt.set(debitoId, []);
      }
      parcelsByDebt.get(debitoId)!.push(parcela);
    }

    // === Step 4: Update each debito based on parcelas ===
    for (const [debitoId, parcelas] of parcelsByDebt.entries()) {
      const todasPagas = parcelas.every(p => p.status_pagamento?.status_pagamento_id === 2);
      const temAtraso = parcelas.some(p => p.status_pagamento?.status_pagamento_id === 3);

      if (todasPagas) {
        const ultima = parcelas
          .filter(p => p.data_pagamento)
          .map(p => new Date(p.data_pagamento))
          .sort((a, b) => b.getTime() - a.getTime())[0];

        await this.debtRepository.update(debitoId, {
          status_pagamento: statusPago,
          data_pagamento: ultima ?? null,
        });

      } else if (temAtraso) {
        await this.debtRepository.update(debitoId, {
          status_pagamento: statusEmAtraso,
        });

      } else {
        await this.debtRepository.update(debitoId, {
          status_pagamento: statusPendente,
        });
      }
    }
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

  async updateInstalmentStatus(UpdateInstalmentDto: UpdateInstalmentDto): Promise<string> {
    const { parcela_id, status_pagamento_id, data_pagamento, valor_total, atualizado_por, data_vencimento } = UpdateInstalmentDto;

    // Buscar a parcela
    const parcela = await this.parcelaRepository.findOne({
      where: { parcela_id },
      relations: ['status_pagamento', 'debito'],
    });

    if (!parcela) {
      throw new Error(`Parcela com ID ${parcela_id} não encontrada.`);
    }

    // Buscar novo status de pagamento
    const novoStatus = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id },
    });

    if (!novoStatus) {
      throw new Error(`Status de pagamento com ID ${status_pagamento_id} não encontrado.`);
    }

    // Assegurar que valores numéricos não sejam null/undefined
    const parcelaValor = parcela.valor ?? 0;

    let diferenca = 0;
    // Atualizar a parcela
    parcela.status_pagamento = novoStatus;
    parcela.atualizado_por = atualizado_por;
    if (valor_total) {
        parcela.valor = valor_total;
        diferenca = valor_total - parcelaValor;
    }
    if (data_pagamento) {
        parcela.data_pagamento = new Date(data_pagamento);
    }
    if (data_vencimento) {
        const novaData = new Date(data_vencimento);
        novaData.setDate(novaData.getDate() + 1);
        parcela.data_vencimento = novaData;
    }
    // Atualizar o valor total da venda, se existir
    if (parcela.debito && valor_total) {
        const debito = await this.debtRepository.findOne({
            where: { debito_id: parcela.debito.debito_id },
      });
      const debitoValorAtual = +(debito.valor_total ?? 0);
  
      debito.valor_total = +(debitoValorAtual + diferenca).toFixed(2);
  
      await this.debtRepository.save(debito);      
    }

    await this.parcelaRepository.save(parcela);

    return `Status da parcela ${parcela_id} atualizado para ${novoStatus.nome}.`;
  }

  async updateDebtStatus(updateStatus: UpdateDebtStatusDto): Promise<string> {
    const { debito_id, status_pagamento_id } = updateStatus;

    const debt = await this.debtRepository.findOne({
      where: { debito_id },
      relations: ['status_pagamento'],
    });

    if (!debt) {
      throw new Error(`Débito com ID ${debito_id} não encontrado.`);
    }

    const novoStatus = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id } });

    if (!novoStatus) {
      throw new Error(`Status de débito com o ID ${status_pagamento_id} não encontrado.`);
    }

    debt.status_pagamento = novoStatus;
    await this.debtRepository.save(debt);

    return `Status do débito ${debt.debito_id} atualizado para ${novoStatus.nome}.`;
  }

  async deleteDebt(code: number): Promise<string> {
    const debito = await this.debtRepository.findOne({ where: { debito_id: code } });

    if (!debito) {
        throw new Error(`debito com ID ${code} não encontrada.`);
    }

    // Exclui a debito diretamente (parcelas serão excluídas automaticamente pelo cascade)
    await this.debtRepository.remove(debito);

    return `Debito com ID ${code} e suas parcelas foram excluídas com sucesso.`;
  }

  async getDebtsByDate(fromDate?: string): Promise<Debito[]> {
    if (fromDate) {
      return this.debtRepository.find({
        where: {
          data_competencia: MoreThanOrEqual(new Date(fromDate)),
        },
        relations: ['parcela_debito', 'status_pagamento', 'categoria', 'departamento', 'parcela_debito.status_pagamento'],
      });
    }
    return this.debtRepository.find({
      relations: ['parcela_debito', 'status_pagamento', 'categoria', 'departamento', 'parcela_debito.status_pagamento'],
    });
  }

  async getDebtsBetweenDates(fromDate: string, toDate?: string): Promise<Debito[]> {
    if (toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
  
      return this.debtRepository.find({
        where: {
          data_competencia: Between(start, end)
        },
        relations: [
          'parcela_debito',
          'status_pagamento',
          'categoria',
          'departamento',
          'parcela_debito.status_pagamento'
        ],
      });
  
    } else {
      return this.debtRepository.find({
        where: {
          data_competencia: Raw((alias) => `DATE(${alias}) = :date`, { date: fromDate })
        },
        relations: [
          'parcela_debito',
          'status_pagamento',
          'categoria',
          'departamento',
          'parcela_debito.status_pagamento'
        ],
      });
    }
  }
  
  
}
