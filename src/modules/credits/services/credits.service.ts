import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaCredito, ParcelaCredito, StatusPagamento, Venda } from '../../../infrastructure/database/entities';
import { ICreditsRepository } from '../../../domain/repositories';
import { UpdateInstalmentDto } from '../dto';
import { CreditDto } from '../dto/credit.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CreditsService implements ICreditsRepository {
  constructor(
    @InjectRepository(ParcelaCredito) private readonly parcelaRepository: Repository<ParcelaCredito>,
    @InjectRepository(StatusPagamento) private readonly statusRepository: Repository<StatusPagamento>,
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
    @InjectRepository(CategoriaCredito) private readonly categoriaRepository: Repository<CategoriaCredito>,
  ) {}

  async getAllCredits(): Promise<ParcelaCredito[]> {
    const credits = await this.parcelaRepository.find({
      relations: ['status_pagamento', 'venda.cliente', 'categoria'],
    });
    return credits;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateCreditsStatus(): Promise<void> {
    const credits = await this.parcelaRepository.find({
      relations: ['status_pagamento', 'venda.cliente', 'categoria'],
    });
    const now = new Date();
    const statusAtraso = await this.statusRepository.findOne({ where: { status_pagamento_id: 3 } }); // "Em Atraso"

    for (const credit of credits) {
      const dataVencimentoAjustada = new Date(credit.data_vencimento);
      dataVencimentoAjustada.setDate(dataVencimentoAjustada.getDate() + 1); // Adiciona um dia extra

      const vencida = dataVencimentoAjustada < now && !credit.data_pagamento;
      const isPendente = credit.status_pagamento.status_pagamento_id === 1; // Pendente

      if (vencida && isPendente) {
        console.log(`Atualizando parcela ${credit.parcela_id} para status 'Em Atraso'.`);
        credit.status_pagamento = statusAtraso; // Atualiza a referência de status_pagamento
        await this.parcelaRepository.save(credit); // Salva a parcela com o novo status
      } 
      await this.updateVendaStatus(credit.venda.venda_id);
    }
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

    const parcelasAtrasadas = venda.parcela_credito.some(
      (parcela) => parcela.status_pagamento.status_pagamento_id === 3, // "Em Atraso"
    );

    if (todasParcelasPagas) {
      venda.status_pagamento = await this.statusRepository.findOne({ where: { status_pagamento_id: 2 } }); // "Pago"
    } else if (parcelasAtrasadas) {
      venda.status_pagamento = await this.statusRepository.findOne({ where: { status_pagamento_id: 3 } }); // "Em Atraso"
    } else {
      venda.status_pagamento = await this.statusRepository.findOne({ where: { status_pagamento_id: 1 } }); // "Pendente"
    }

    await this.vendaRepository.save(venda);
    console.log(`Status da venda ${venda.codigo} atualizado para ${venda.status_pagamento.nome}`);
  }

  async updateInstalmentStatus(UpdateInstalmentDto: UpdateInstalmentDto): Promise<string> {
    const { parcela_id, status_pagamento_id, data_pagamento, valor_total, atualizado_por, data_vencimento, venda_id } = UpdateInstalmentDto;
    
    const dataPagamentoConvertida = data_pagamento ? new Date(`${data_pagamento}T00:00:00Z`) : null;
    const hoje = new Date();

    if (dataPagamentoConvertida && dataPagamentoConvertida > hoje) {
        throw new Error('A data de pagamento não pode ser no futuro.');
    }

    // Buscar a parcela
    const parcela = await this.parcelaRepository.findOne({
        where: { parcela_id },
        relations: ['status_pagamento', 'venda'],
    });

    if (!parcela) {
        throw new Error(`Parcela com ID ${parcela_id} não encontrada.`);
    }

    // Buscar novo status de pagamento
    const novoStatus = await this.statusRepository.findOne({
        where: { status_pagamento_id },
    });

    if (!novoStatus) {
        throw new Error(`Status de pagamento com ID ${status_pagamento_id} não encontrado.`);
    }
  

    // Garantir que `parcela.valor` seja um número
    const valorOriginal = parcela.valor
    const novoValorTotal =  valor_total ?? valorOriginal;

    // Atualizar a parcela com o novo valor_total
    parcela.valor = novoValorTotal ? novoValorTotal : parcela.valor;
    parcela.data_pagamento = dataPagamentoConvertida;
    parcela.status_pagamento = novoStatus;
    parcela.atualizado_por = atualizado_por;
    parcela.data_vencimento = data_vencimento ? new Date(new Date(data_vencimento).getTime() + 86400000) : parcela.data_vencimento;

    // Atualizar o valor total da venda, se existir
    if (parcela.venda && valor_total) {
        const valorFinalAtual = typeof parcela.venda.valor_final === 'string' 
            ? parseFloat(parcela.venda.valor_final) 
            : parcela.venda.valor_final ?? 0;

        const diferenca = novoValorTotal - valorOriginal;
        const novoValorFinal = valorFinalAtual + diferenca;

        parcela.venda.valor_final = parseFloat(novoValorFinal.toFixed(2)); // Garante 2 casas decimais
        await this.vendaRepository.save(parcela.venda);
    }

    await this.parcelaRepository.save(parcela);
    await this.updateVendaStatus(venda_id);

    return `Status da parcela ${parcela_id} atualizado para ${novoStatus.nome}.`;
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
      atualizado_por: creditDto.atualizado_por,
      conta: creditDto.conta,
    });
    return this.parcelaRepository.save(creditoEntity);
  } 

  async deleteCredit(parcela_id: number): Promise<string> {

    const credit = await this.parcelaRepository.findOne({ where: { parcela_id } });

    if (!credit) {
        throw new Error(`Credito com ID ${parcela_id} não encontrado.`);
    }

    // Exclui a credit diretamente (parcelas serão excluídas automaticamente pelo cascade)
    await this.parcelaRepository.remove(credit);

    return `credit com ID ${parcela_id} e suas parcelas foram excluídas com sucesso.`;
  }  
}
