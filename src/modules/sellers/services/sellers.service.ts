import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Raw } from 'typeorm';
import { Vendedor, Regiao, MetaVendedor, Venda } from '../../../infrastructure/database/entities';
import { Goals, GoalsDto, SellerAPIResponse } from '../dto/sellers.dto';

@Injectable()
export class SellersService {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly apiTag = 'seller';

  constructor(
    @InjectRepository(Vendedor) private readonly vendedorRepository: Repository<Vendedor>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
    private readonly httpService: HttpService,
    @InjectRepository(MetaVendedor) private readonly metaRepository: Repository<MetaVendedor>,
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
  ) {
    this.token = process.env.SELLENTT_API_TOKEN;
    this.apiUrl = process.env.SELLENTT_API_URL;
  }

  async syncroSellers(): Promise<void> {
    try {
      const response = await this.httpService.axiosRef.get<{ data: SellerAPIResponse[] }>(this.apiUrl + this.apiTag, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const sellersData = response.data.data;
      console.log('Vendedores recebidos =>', sellersData);

      const existingSellers = await this.vendedorRepository.find({ relations: ['regiao'] });
      const existingCodes = existingSellers.map(seller => seller.codigo);
      const receivedCodes = sellersData.map(seller => seller.code);

      const sellersToDelete = existingSellers.filter(seller => !receivedCodes.includes(seller.codigo));
      if (sellersToDelete.length > 0) {
        await this.vendedorRepository.delete({ codigo: In(sellersToDelete.map(seller => seller.codigo)) });
        console.log('Vendedores removidos =>', sellersToDelete.map(seller => seller.codigo));
      }

      for (const seller of sellersData) {
        const existingSeller = existingSellers.find(s => s.codigo === seller.code);
        const regiao = await this.regiaoRepository.findOne({ where: { codigo: seller.region_code } });

        if (existingSeller) {
          if (existingSeller.regiao?.codigo !== seller.region_code) {
            console.log(`Atualizando região do vendedor ${seller.code}`);
            existingSeller.regiao = regiao;
            await this.vendedorRepository.save(existingSeller);
          }
          continue;
        }

        const novoVendedor = this.vendedorRepository.create({
          codigo: seller.code,
          nome: seller.name,
          ativo: seller.is_active,
          data_criacao: seller.created_at,
          regiao: regiao,
        });
        await this.vendedorRepository.save(novoVendedor);
        console.log('Vendedor sincronizado =>', novoVendedor);
      }
    } catch (error) {
      console.error('Erro ao sincronizar vendedores:', error);
      throw error;
    }
  }

  findAllSellers(): Promise<Vendedor[]> {
    return this.vendedorRepository.find({ relations: ['regiao'] });
  }

  findBy(id: number): Promise<Vendedor> {
    return this.vendedorRepository.findOne({ where: { vendedor_id: id }
    });
  }

  async saveMetas(goalsArray: Goals[]): Promise<string> {
    // ✅ Obter mês e ano atuais
    const hoje = new Date();
    const mes = hoje.getMonth() + 1; // Janeiro = 0, então +1
    const ano = hoje.getFullYear();
  
    for (const goal of goalsArray) {
      const { vendedor_id, meta_ped, meta_fat } = goal;
  
      const vendedor = await this.vendedorRepository.findOne({ where: { vendedor_id } });
  
      if (!vendedor) {
        throw new Error(`Vendedor com ID ${vendedor_id} não encontrado`);
      }
  
      let meta = await this.metaRepository.findOne({
        where: {
          vendedor: { vendedor_id },
          mes,
          ano,
        },
      });
  
      if (!meta) {
        meta = this.metaRepository.create({
          vendedor,
          mes,
          ano,
          meta_ped: Number(meta_ped),
          meta_fat: Number(meta_fat),
        });
      } else {
        meta.meta_ped = Number(meta_ped);
        meta.meta_fat = Number(meta_fat);
      }     
      await this.metaRepository.save(meta);
    }
  
    return `✅ Metas salvas para vendedores (${mes}/${ano})`;
  }
 
  
  async getMetaProgress(): Promise<GoalsDto[]> {
    const today = new Date();
    const mes = today.getMonth() + 1;
    const ano = today.getFullYear();
  
    const metas = await this.metaRepository.find({
      where: { mes, ano },
      relations: ['vendedor'],
    });
  
    const vendas = await this.vendaRepository.find({
      where: {
        data_criacao: Raw(alias => `EXTRACT(MONTH FROM ${alias}) = :mes AND EXTRACT(YEAR FROM ${alias}) = :ano`, { mes, ano }),
        tipo_pedido: { tipo_pedido_id: 10438 }, // apenas vendas válidas
      },
      relations: ['vendedor'],
    });
  
    const progressoMap = new Map<number, { pedidos: number; faturamento: number }>();
  
    for (const venda of vendas) {
      const id = venda.vendedor?.vendedor_id;
      if (!id) continue;
  
      if (!progressoMap.has(id)) {
        progressoMap.set(id, { pedidos: 0, faturamento: 0 });
      }
  
      progressoMap.get(id)!.pedidos += 1;
      progressoMap.get(id)!.faturamento += Number(venda.valor_final);
    }
  
    return metas.map(meta => {
      const progresso = progressoMap.get(meta.vendedor.vendedor_id) || { pedidos: 0, faturamento: 0 };
  
      return {
        vendedor: meta.vendedor.nome,
        mes,
        ano,
        meta_ped: meta.meta_ped,
        meta_fat: Number(meta.meta_fat.toFixed(2)),
        ped_realizados: progresso.pedidos,
        fat_realizado: Number(progresso.faturamento.toFixed(2)),
        progress_ped: Number(((progresso.pedidos / meta.meta_ped) * 100).toFixed(2)),
        progress_fat: Number(((progresso.faturamento / Number(meta.meta_fat)) * 100).toFixed(2)),
      };
    });
  }  
}
