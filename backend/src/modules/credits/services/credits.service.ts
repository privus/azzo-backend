import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParcelaCredito, StatusPagamento, Venda } from '../../../infrastructure/database/entities';
import { ICreditsRepository } from '../../../domain/repositories';
@Injectable()
export class CreditsService implements ICreditsRepository {
  constructor(
    @InjectRepository(ParcelaCredito) private readonly parcelaRepository: Repository<ParcelaCredito>,
    @InjectRepository(StatusPagamento) private readonly statusRepository: Repository<StatusPagamento>,
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
  ) {}

  async getAllCredits(): Promise<ParcelaCredito[]> {
    const now = new Date();

    // Busca todas as parcelas com os relacionamentos necessários
    const credits = await this.parcelaRepository.find({
      relations: ['status_pagamento', 'venda', 'venda.cliente'],
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
      relations: ['status_pagamento', 'venda.cliente'],
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
}
