import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
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

  async getAllDebts(): Promise<Debito[]> {
    return this.debtRepository.find({ relations: ['parcela_debito', 'status_pagamento'] });
  }

  getDebtById(id: number): Promise<Debito> {
    return this.debtRepository.findOne({ where: { debito_id: id } });
  }

  getAllDepartments(): Promise<Departamento[]> {
    return this.departamentoRepository.find();
  }

  getAllCategories(): Promise<CategoriaDebito[]> {
    return this.categoriaDebitoRepository.find();
  }

  async createDebt(debtDto: DebtsDto): Promise<Debito> {
    // 1) Busca um status de pagamento padrão (ex.: id = 1)
    const status_pagamento = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id: 1 },
    });

    if (!status_pagamento) {
      throw new Error('Status de pagamento padrão não encontrado.');
    }

    // 2) Buscar ou Criar o Departamento
    let departamento = await this.departamentoRepository.findOne({
      where: { nome: debtDto.departamento_nome },
    });

    if (!departamento) {
      departamento = this.departamentoRepository.create({ nome: debtDto.departamento_nome });
      await this.departamentoRepository.save(departamento);
    }

    // 2) Buscar ou Criar o Departamento
    let categoria = await this.categoriaDebitoRepository.findOne({
      where: { nome: debtDto.categoria_nome },
    });

    if (!categoria) {
      categoria = this.categoriaDebitoRepository.create({ nome: debtDto.categoria_nome });
      await this.categoriaDebitoRepository.save(categoria);
    }

    // 3) Se `datas_vencimento` não for fornecido, gerar automaticamente com intervalos de 30 dias
    let datasVencimento = debtDto.datas_vencimento;

    if (!datasVencimento || datasVencimento.length === 0) {
      const datasGeradas: string[] = [];
      const dataInicial = new Date(debtDto.data_criacao);

      for (let i = 0; i < debtDto.numero_parcelas; i++) {
        dataInicial.setMonth(dataInicial.getMonth() + 1);
        datasGeradas.push(dataInicial.toISOString().split('T')[0]);
      }

      datasVencimento = datasGeradas;
    }

    // 4) Criar o débito principal
    const debitoEntity = this.debtRepository.create({
      valor_total: debtDto.valor_total,
      data_criacao: debtDto.data_criacao as Date,
      numero_parcelas: debtDto.numero_parcelas,
      metodo_pagamento: debtDto.metodo_pagamento,
      data_pagamento: debtDto.data_pagamento,
      juros: debtDto.juros,
      descricao: debtDto.descricao,
      valor_parcela: Number(debtDto.valor_total / debtDto.numero_parcelas),
      status_pagamento,
      departamento,
      categoria,
    });

    // 5) Salvar o débito principal primeiro
    const savedDebt = await this.debtRepository.save(debitoEntity);

    // 6) Criar as parcelas vinculando-as ao débito
    const parcelas: ParcelaDebito[] = datasVencimento.map((dataVencimento, index) => {
      return this.parcelaRepository.create({
        numero: index + 1,
        valor: Number(debtDto.valor_total / debtDto.numero_parcelas),
        data_criacao: new Date(debtDto.data_criacao),
        data_vencimento: new Date(dataVencimento),
        status_pagamento,
        data_pagamento: debtDto.data_pagamento ? new Date(debtDto.data_pagamento) : null,
        juros: debtDto.juros || 0,
        debito: savedDebt,
      });
    });

    // 7) Salvar todas as parcelas no banco de dados
    await this.parcelaRepository.save(parcelas);

    return savedDebt;
  }

  async updateOverdueParcels(): Promise<void> {
    const hoje = new Date();

    // Busca todas as parcelas vencidas e não pagas
    const overdueParcels = await this.parcelaRepository.find({
      where: {
        data_vencimento: LessThan(hoje),
        data_pagamento: null,
      },
      relations: ['debito', 'status_pagamento'],
    });

    if (overdueParcels.length === 0) return;

    // Busca o status "Em Atraso" (ID = 3)
    const statusEmAtraso = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id: 3 },
    });

    if (!statusEmAtraso) {
      throw new Error('Status "Em Atraso" não encontrado.');
    }

    const updatedDebts = new Set<number>();

    // Atualiza o status das parcelas e dos débitos associados
    for (const parcela of overdueParcels) {
      parcela.status_pagamento = statusEmAtraso;
      updatedDebts.add(parcela.debito.debito_id);
    }

    await this.parcelaRepository.save(overdueParcels);

    // Atualiza os débitos que têm parcelas em atraso
    for (const debitoId of updatedDebts) {
      await this.debtRepository.update(debitoId, { status_pagamento: statusEmAtraso });
    }
  }
}
