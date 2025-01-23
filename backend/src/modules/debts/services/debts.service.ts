import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Debito, ParcelaDebito, StatusPagamento } from '../../../infrastructure/database/entities';
import { DebtsDto } from '../dto/debts.dto';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debito) private readonly debtRepository: Repository<Debito>,

    @InjectRepository(ParcelaDebito) private readonly parcelaRepository: Repository<ParcelaDebito>,

    @InjectRepository(StatusPagamento) private readonly statusPagamentoRepository: Repository<StatusPagamento>,
  ) {}

  async getAllDebts(): Promise<Debito[]> {
    return this.debtRepository.find();
  }

  getDebtById(id: number): Promise<Debito> {
    return this.debtRepository.findOne({ where: { debito_id: id } });
  }

  async createDebt(debtDto: DebtsDto): Promise<Debito> {
    // 1) Busca um status de pagamento default (ex.: id = 1)
    const status_pagamento = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id: 1 },
    });

    const datasVencimentoMatriz = debtDto.datas_vencimento.map((data) => [data]);

    // 2) (Opcional) Verifica se o número de datas de vencimento
    //    corresponde ao número de parcelas
    if (debtDto.datas_vencimento.length !== debtDto.numero_parcelas) {
      throw new Error('A quantidade de datas de vencimento deve ser igual ao número de parcelas.');
    }

    // 3) Criar o Debito principal
    const debitoEntity = this.debtRepository.create({
      // Mapeie os campos que estão em DebtsDto para o seu Debito entity
      valor_total: debtDto.valor_total,
      data_criacao: debtDto.data_criacao as Date,
      numero_parcelas: debtDto.numero_parcelas,
      metodo_pagamento: debtDto.metodo_pagamento,
      data_pagamento: debtDto.data_pagamento,
      juros: debtDto.juros,
      descricao: debtDto.descricao,
      datas_vencimento: datasVencimentoMatriz,
      valor_parcela: Number(debtDto.valor_total / debtDto.numero_parcelas),
    });

    const savedDebt = await this.debtRepository.save(debitoEntity);

    // 4) Criar as parcelas conforme as datas de vencimento passadas pelo usuário
    const parcelas: ParcelaDebito[] = debtDto.datas_vencimento.map((dataVencimento, index) => {
      return this.parcelaRepository.create({
        numero: index + 1, // Ex: 1ª parcela, 2ª parcela, etc.
        valor: Number(debtDto.valor_total / debtDto.numero_parcelas),
        data_criacao: new Date(debtDto.data_criacao),
        data_vencimento: new Date(dataVencimento),
        status_pagamento,
        data_pagamento: debtDto.data_pagamento ? new Date(debtDto.data_pagamento) : null,
        juros: debtDto.juros ? debtDto.juros : null,
      });
    });

    // 5) Salvar todas as parcelas
    await this.parcelaRepository.save(parcelas);

    return savedDebt;
  }
}
