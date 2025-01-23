import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParcelaCredito } from '../../../infrastructure/database/entities';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(ParcelaCredito)
    private readonly parcelaRepository: Repository<ParcelaCredito>,
  ) {}

  async getAllCredits(): Promise<ParcelaCredito[]> {
    const credits = await this.parcelaRepository.find({
      relations: ['status_pagamento', 'venda', 'venda.cliente'],
    });

    // 2) Obter data/hora atual
    const now = new Date();

    // 3) Verificar cada parcela
    for (const credit of credits) {
      const vencida = credit.data_vencimento < now && !credit.data_pagamento;
      const isPendente = credit.status_pagamento.status_pagamento_id === 1; // Pendente

      if (vencida && isPendente) {
        // 4) Mudar status para Em Atraso
        //    OBS: Se você já tem "StatusPagamento" com id=3 no BD,
        //    pode instanciar somente a referência (partial) ou buscar do repositório.
        credit.status_pagamento.status_pagamento_id = 3;

        // 5) Salvar (persiste no banco)
        await this.parcelaRepository.save(credit);
      }
    }

    return credits;
  }

  getCreditById(id: number): Promise<ParcelaCredito> {
    return this.parcelaRepository.findOne({
      where: { parcela_id: id },
    });
  }
}
