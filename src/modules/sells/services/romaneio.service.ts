import { Inject, Injectable } from '@nestjs/common';
import { ISellsRepository } from '../../../domain/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { Romaneio, Transportadora } from '../../../infrastructure/database/entities';
import { Repository } from 'typeorm';
import { RomaneioDto } from '../dto';

@Injectable()
export class RomaneioService {
  constructor(
    @Inject('ISellsRepository') private readonly sellsService: ISellsRepository,
    @InjectRepository(Romaneio) private readonly romaneioRepository: Repository<Romaneio>,
    @InjectRepository(Transportadora) private readonly transportadoraRepository: Repository<Transportadora>,
  ) {}
   
  async generateRomaneio(romaneioDto: RomaneioDto): Promise<string> {
    const { codigos, transportadora_id, transportadora_nome, data_criacao, cod_rastreio } = romaneioDto;
    let transportadora = await this.transportadoraRepository.findOne({ where: { transportadora_id }});
  
    if (!transportadora) {
      transportadora = this.transportadoraRepository.create({ nome: transportadora_nome });
      await this.transportadoraRepository.save(transportadora);
    }
  
    const vendas = await Promise.all(
      codigos.map(async (code) => await this.sellsService.getSellByCode(code))
    );
  
    const novoRomaneio = this.romaneioRepository.create({
      vendas,
      transportadora,
      data_criacao,
      cod_rastreio,
    });
  
    await this.romaneioRepository.save(novoRomaneio);

    for (const venda of vendas) {
        venda.romaneio = novoRomaneio;
        await this.sellsService.saveSell(venda);
    }
  
    return `Romaneio ${novoRomaneio.romaneio_id} criado com ${vendas.length} vendas!`;
  } 

  getRomaneios(): Promise<Romaneio[]> {
    return this.romaneioRepository.find({ relations: ['vendas.cliente', 'transportadora'] });
  }

  getTransportadoras(): Promise<Transportadora[]> {
    return this.transportadoraRepository.find();
  }
}
