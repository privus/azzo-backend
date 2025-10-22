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
  
    let transportadora = await this.transportadoraRepository.findOne({ where: { transportadora_id } });
  
    if (!transportadora) {
      if (!transportadora_nome) {
        throw new Error('Nome da transportadora é obrigatório ao cadastrar nova transportadora.');
      }
  
      transportadora = this.transportadoraRepository.create({ nome: transportadora_nome });
      await this.transportadoraRepository.save(transportadora);
    }
  
    const vendasEncontradas: any[] = [];
    const vendasNaoEncontradas: number[] = [];
  
    for (const code of codigos) {
      const venda = await this.sellsService.getSellByCode(code);
      if (venda) {
        vendasEncontradas.push(venda);
      } else {
        vendasNaoEncontradas.push(code);
      }
    }
  
    if (vendasEncontradas.length === 0) {
      throw new Error('Nenhuma venda válida encontrada para os códigos fornecidos.');
    }

    const novoRomaneio = this.romaneioRepository.create({
      vendas: vendasEncontradas,
      transportadora,
      data_criacao,
      cod_rastreio,
    });
  
    await this.romaneioRepository.save(novoRomaneio);
  
    for (const venda of vendasEncontradas) {
      venda.romaneio = novoRomaneio;
      await this.sellsService.saveSell(venda);
    }

    let mensagem = `Romaneio ${novoRomaneio.romaneio_id} criado com ${vendasEncontradas.length} vendas!`;
  
    if (vendasNaoEncontradas.length > 0) {
      mensagem += ` ⚠️ Vendas não encontradas: ${vendasNaoEncontradas.join(', ')}`;
    }
  
    return mensagem;
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
  
    const dataRows = rows.slice(1);
  
    const mappedRows = dataRows
      .filter(row => row.length >= 2)
      .map(row => ({
        nota: row[0]?.toString().trim(),
        frete: Number(row[1])
      }));
    
  
    const vendas = await this.sellsService.findSellsByRomaneio(romaneio_id);
    const romaneio = await this.romaneioRepository.findOne({ where: { romaneio_id } });
    if (!romaneio) throw new Error(`Romaneio ${romaneio_id} não encontrado.`);
  
    let totalFrete = 0;
    let aplicadas = 0;
  
    for (const { nota, frete } of mappedRows) {
      if (!nota) continue;
    
      let venda = vendas.find(v => v.numero_nfe?.toString() === nota);
    
      // Se não encontrou por nota, tenta buscar por padrão alternativo
      if (!venda && nota.startsWith('*')) {
        const pedidoId = nota.substring(1); // remove o caractere especial
        venda = vendas.find(v => v.codigo.toString() === pedidoId);
      }
    
      if (venda) {
        venda.valor_frete = frete;
        await this.sellsService.saveSell(venda);
        totalFrete += frete;
        aplicadas++;
      }
    }
    
  
    romaneio.valor_frete = totalFrete;
    await this.romaneioRepository.save(romaneio);
  
    return `Fretes importados: ${aplicadas} vendas atualizadas. Total R$ ${totalFrete.toFixed(2)}.`;
  }  
}
