import { Inject, Injectable } from '@nestjs/common';
import { ISellsRepository } from '../../../domain/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { Romaneio, Transportadora } from '../../../infrastructure/database/entities';
import { Repository } from 'typeorm';
import { RomaneioDto } from '../dto';
import * as XLSX from 'xlsx';

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

  async importFretesFromExcel(buffer: Buffer, romaneio_id: number): Promise<string> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
    const header = rows[0];
    const dataRows = rows.slice(1);
  
    const mappedRows = dataRows
      .filter(row => row.length >= 5)
      .map(row => ({
        numero_nfe: row[0]?.toString().trim(),
        valor_frete: Number(row[4])
      }));
  
    const vendas = await this.sellsService.findSellsByRomaneio(romaneio_id);
    const romaneio = await this.romaneioRepository.findOne({ where: { romaneio_id } });
    if (!romaneio) throw new Error(`Romaneio ${romaneio_id} não encontrado.`);
  
    let totalFrete = 0;
    let aplicadas = 0;
  
    for (const { numero_nfe, valor_frete } of mappedRows) {
      if (!numero_nfe) continue;
  
      const venda = vendas.find(v => v.numero_nfe?.toString() === numero_nfe);
      if (venda) {
        venda.valor_frete = valor_frete;
        await this.sellsService.saveSell(venda);
        totalFrete += valor_frete;
        aplicadas++;
      }
    }
  
    romaneio.valor_frete = totalFrete;
    await this.romaneioRepository.save(romaneio);
  
    return `Fretes importados: ${aplicadas} vendas atualizadas. Total R$ ${totalFrete.toFixed(2)}.`;
  }
  
}
