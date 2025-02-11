import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, ObjectId, Repository } from 'typeorm';
import { Cargo, Cidade, Regiao } from '../../../infrastructure/database/entities';
import { ISharedRepository } from '../../../domain/repositories';

@Injectable()
export class SharedService implements ISharedRepository {
  constructor(
    @InjectRepository(Cargo) private readonly cargoRepository: Repository<Cargo>,
    @InjectRepository(Cidade) private readonly cidadeRepository: Repository<Cidade>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
  ) {}

  async getRelatedEntities(cargo_id?: number, cidade_id?: number, regiao_id?: number, isCreate = true) {
    if (isCreate) {
      const cargo = await this.cargoRepository.findOne({ where: { id: new ObjectId(cargo_id) } });
      const cidade = await this.cidadeRepository.findOne({ where: { id: new ObjectId(cidade_id) } });
      const regiao = regiao_id ? await this.regiaoRepository.findOne({ where: { id: new ObjectId(regiao_id) } }) : null;

      return { cargo, cidade, regiao };
    }
    return {
      cargo: new ObjectId(cargo_id) ? await this.cargoRepository.findOne({ where: { id: new ObjectId(cargo_id) } }) : null,
      cidade: cidade_id ? await this.cidadeRepository.findOne({ where: { id: new ObjectId(cidade_id) } }) : null,
      regiao: regiao_id ? await this.regiaoRepository.findOne({ where: { id: new ObjectId(regiao_id) } }) : null,
    };
  }

  async findAllCities() {
    return await this.cidadeRepository.find();
  }

  async findPartial(query: string) {
    return this.cidadeRepository.find({
      where: {
        nome: Like(`%${query}%`),
      },
      take: 20, // Limitar a 20 resultados
    });
  }

}
