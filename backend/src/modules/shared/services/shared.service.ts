import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cargo, Cidade, Regiao } from '../../../infrastructure/database/entities';
import { ISharedRepository } from '../../../domain/repositories/shared.repository.interface';

@Injectable()
export class SharedService implements ISharedRepository {
  constructor(
    @InjectRepository(Cargo) private readonly cargoRepository: Repository<Cargo>,
    @InjectRepository(Cidade) private readonly cidadeRepository: Repository<Cidade>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
  ) {}

  async getRelatedEntities(isCreate: boolean, cargo_id?: number, cidade_id?: number, regiao_id?: number) {
    if (isCreate) {
      const cargo = await this.cargoRepository.findOne({ where: { cargo_id } });
      const cidade = await this.cidadeRepository.findOne({ where: { cidade_id } });
      const regiao = regiao_id ? await this.regiaoRepository.findOne({ where: { regiao_id } }) : undefined;

      return { cargo, cidade, regiao };
    }
    return {
      cargo: cargo_id !== undefined ? await this.cargoRepository.findOne({ where: { cargo_id } }) : null,
      cidade: cidade_id !== undefined ? await this.cidadeRepository.findOne({ where: { cidade_id } }) : null,
      regiao: regiao_id !== undefined ? await this.regiaoRepository.findOne({ where: { regiao_id } }) : null,
    };
  }
}
