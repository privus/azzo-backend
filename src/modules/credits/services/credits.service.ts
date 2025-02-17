import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CategoriaCredito, ParcelaCredito, StatusPagamento, Venda } from '../../../infrastructure/database/entities';
import { ICreditsRepository } from '../../../domain/repositories';
import { UpdateInstalmentDto } from '../dto';
import { CreditDto } from '../dto/credit.dto';
@Injectable()
export class CreditsService implements ICreditsRepository {
  constructor(
    @InjectRepository(ParcelaCredito) private readonly parcelaRepository: Repository<ParcelaCredito>,
    @InjectRepository(StatusPagamento) private readonly statusRepository: Repository<StatusPagamento>,
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
    @InjectRepository(CategoriaCredito) private readonly categoriaRepository: Repository<CategoriaCredito>,
  ) {}

  async getAllCredits(): Promise<ParcelaCredito[]> {
    const now = new Date();

    // Busca todas as parcelas com os relacionamentos necessários
    const credits = await this.parcelaRepository.find({
      relations: ['status_pagamento', 'venda', 'venda.cliente', 'categoria'],
    });

    // Atualiza o status de parcelas vencidas
    const statusAtraso = await this.statusRepository.findOne({ where: { status_pagamento_id: 3 } }); // "Em Atraso"

    for (const credit of credits) {
      const dataVencimento = new Date(credit.data_vencimento);
      const vencida = dataVencimento < now && !credit.data_pagamento;
      const isPendente = credit.status_pagamento.status_pagamento_id === 1; // Pendente

      if (vencida && isPendente && statusAtraso) {
        console.log(`Atualizando parcela ${credit.parcela_id} para status 'Em Atraso'.`);
        credit.status_pagamento = statusAtraso; // Atualiza a referência de status_pagamento
        await this.parcelaRepository.save(credit); // Salva a parcela com o novo status
        // Atualizar o status da venda associada
        await this.updateVendaStatus(credit.venda.venda_id);
      }
    }

    return credits;
  }

  getCreditById(id: number): Promise<ParcelaCredito> {
    return this.parcelaRepository.findOne({
      where: { parcela_id: id },
      relations: ['status_pagamento', 'venda.cliente', 'categoria'],
    });
  }

  async filterCreditsByDueDate(fromDate?: string, toDate?: string): Promise<ParcelaCredito[]> {
    const now = new Date();

    const queryBuilder = this.parcelaRepository
      .createQueryBuilder('parcela')
      .leftJoinAndSelect('parcela.status_pagamento', 'status_pagamento')
      .leftJoinAndSelect('parcela.venda', 'venda')
      .leftJoinAndSelect('venda.cliente', 'cliente');

    if (fromDate) {
      queryBuilder.andWhere('parcela.data_vencimento >= :fromDate', { fromDate });
    }

    if (toDate) {
      queryBuilder.andWhere('parcela.data_vencimento <= :toDate', { toDate });
    }

    const filteredCredits = await queryBuilder.getMany();

    // Atualizar status das parcelas vencidas
    const statusAtraso = await this.statusRepository.findOne({ where: { status_pagamento_id: 3 } }); // "Em Atraso"

    for (const credit of filteredCredits) {
      const dataVencimento = new Date(credit.data_vencimento);
      const vencida = dataVencimento < now && !credit.data_pagamento;
      const isPendente = credit.status_pagamento.status_pagamento_id === 1; // Pendente

      if (vencida && isPendente && statusAtraso) {
        console.log(`Atualizando parcela ${credit.parcela_id} para status 'Em Atraso'.`);
        credit.status_pagamento = statusAtraso; // Atualiza a referência de status_pagamento
        await this.parcelaRepository.save(credit); // Salva a parcela com o novo status

        // Atualizar o status da venda associada
        await this.updateVendaStatus(credit.venda.venda_id);
      }
    }

    return filteredCredits;
  }

  private async updateVendaStatus(vendaId: number): Promise<void> {
    const venda = await this.vendaRepository.findOne({
      where: { venda_id: vendaId },
      relations: ['parcela_credito', 'parcela_credito.status_pagamento'],
    });

    if (!venda) return;

    const todasParcelasPagas = venda.parcela_credito.every(
      (parcela) => parcela.status_pagamento.status_pagamento_id === 2, // "Pago"
    );

    const todasParcelasAtrasadas = venda.parcela_credito.every(
      (parcela) => parcela.status_pagamento.status_pagamento_id === 3, // "Em Atraso"
    );

    if (todasParcelasPagas) {
      venda.status_pagamento = await this.statusRepository.findOne({ where: { status_pagamento_id: 2 } }); // "Pago"
    } else if (todasParcelasAtrasadas) {
      venda.status_pagamento = await this.statusRepository.findOne({ where: { status_pagamento_id: 3 } }); // "Em Atraso"
    } else {
      venda.status_pagamento = await this.statusRepository.findOne({ where: { status_pagamento_id: 1 } }); // "Pendente"
    }

    await this.vendaRepository.save(venda);
    console.log(`Status da venda ${venda.codigo} atualizado para ${venda.status_pagamento.nome}`);
  }

  async updateInstalmentStatus(UpdateInstalmentDto: UpdateInstalmentDto): Promise<string> {
    const { parcela_id, status_pagamento_id, data_pagamento, juros } = UpdateInstalmentDto;

    const dataPagamentoConvertida = new Date(`${data_pagamento}T00:00:00Z`);
    const hoje = new Date();
    if (dataPagamentoConvertida > hoje) {
      throw new Error('A data de pagamento não pode ser no futuro.');
    }

    // Busca a parcela de crédito
    const parcela = await this.parcelaRepository.findOne({
      where: { parcela_id },
      relations: ['status_pagamento', 'venda'],
    });

    if (!parcela) {
      throw new Error(`Parcela com ID ${parcela_id} não encontrada.`);
    }

    // Verifica o novo status
    const novoStatus = await this.statusRepository.findOne({
      where: { status_pagamento_id },
    });

    if (!novoStatus) {
      throw new Error(`Status de pagamento com ID ${status_pagamento_id} não encontrado.`);
    }

    // Converter valores para números
    const parcelaValor = parseFloat(parcela.valor.toString());
    const jurosDecimal = parseFloat(juros.toString());

    if (isNaN(parcelaValor) || isNaN(jurosDecimal)) {
      throw new Error('Os valores de parcela ou juros são inválidos.');
    }

    // Atualiza o valor da parcela somando os juros corretamente
    parcela.valor = parseFloat((parcelaValor + jurosDecimal).toFixed(2));
    parcela.data_pagamento = dataPagamentoConvertida;
    parcela.status_pagamento = novoStatus;
    parcela.juros = jurosDecimal;

    // Atualiza o valor final da venda
    if (parcela.venda) {
      const vendaValorFinal = parseFloat(parcela.venda.valor_final.toString());
      parcela.venda.valor_final = parseFloat((vendaValorFinal + jurosDecimal).toFixed(2));
      await this.vendaRepository.save(parcela.venda); // Atualiza o valor total da venda
    }

    await this.parcelaRepository.save(parcela); // Salva a atualização da parcela

    return `Status da parcela ${parcela_id} atualizado para ${novoStatus.nome}. Juros adicionados: ${jurosDecimal.toFixed(2)}.`;
  }

  getAllCategories(): Promise<CategoriaCredito[]> {
    return this.categoriaRepository.find();
  }

  async createCredit(creditDto: CreditDto): Promise<ParcelaCredito> {
    const statusPagamentoNormal = await this.statusRepository.findOne({ where: { status_pagamento_id: 1 } });
    const statusPagamentoPago = await this.statusRepository.findOne({ where: { status_pagamento_id: 2 } });
    
    let categoria = await this.categoriaRepository.findOne({ where: { categoria_id: creditDto.categoria_id } });
    if (!categoria && creditDto.categoria_nome) {
      categoria = this.categoriaRepository.create({ nome: creditDto.categoria_nome });
      await this.categoriaRepository.save(categoria);
    }

    const creditoEntity = this.parcelaRepository.create({
      nome: creditDto.nome,
      descricao: creditDto.descricao,
      valor: creditDto.valor,
      data_criacao: new Date(),
      data_competencia: new Date(creditDto.data_competencia),
      data_vencimento: new Date(creditDto.data_vencimento),
      data_pagamento: creditDto.data_pagamento ? new Date(creditDto.data_pagamento) : null,
      status_pagamento: creditDto.data_pagamento ? statusPagamentoPago : statusPagamentoNormal,
      categoria,
      atualizado_por: creditDto.criado_por,
      conta: creditDto.conta,
    });
    return this.parcelaRepository.save(creditoEntity);
  } 
}
