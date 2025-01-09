import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Regiao } from '../../../infrastructure/database/entities';

@Injectable()
export class RegionsService {
  constructor(@InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>) {}

  async getAllRegions(): Promise<Regiao[]> {
    return this.regiaoRepository.find({ relations: ['vendedores', 'clientes.cidade'] });
  }

  getRegionById(id: number): Promise<Regiao> {
    return this.regiaoRepository.findOne({ where: { regiao_id: id }, relations: ['vendedores', 'clientes.cidade'] });
  }

  async getSellsByRegion(id: number, fromDate?: string): Promise<Regiao> {
    // Monta a query com alias
    const query = this.regiaoRepository
      .createQueryBuilder('regiao')
      .leftJoinAndSelect('regiao.vendas', 'venda')
      .where('regiao.regiao_id = :id', { id });

    // Se o parâmetro fromDate existir, adiciona o filtro
    if (fromDate) {
      query.andWhere('venda.data_criacao >= :fromDate', { fromDate });
    }

    return query.getOne();
  }
}
