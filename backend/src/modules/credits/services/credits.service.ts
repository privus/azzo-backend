import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParcelaCredito } from '../../../infrastructure/database/entities';

@Injectable()
export class CreditsService {
  constructor(@InjectRepository(ParcelaCredito) private readonly parcelaRepository: Repository<ParcelaCredito>) {}

  async getAllCredits(): Promise<ParcelaCredito[]> {
    return this.parcelaRepository.find({ relations: ['status_pagamento', 'venda', 'venda.cliente'] });
  }

  getCreditById(id: number): Promise<ParcelaCredito> {
    return this.parcelaRepository.findOne({ where: { parcela_id: id } });
  }
}
