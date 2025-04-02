import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Vendedor, Regiao } from '../../../infrastructure/database/entities';
import { SellerAPIResponse } from '../dto/sellers.dto';

@Injectable()
export class SellersService {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly apiTag = 'seller';

  constructor(
    @InjectRepository(Vendedor) private readonly vendedorRepository: Repository<Vendedor>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
    private readonly httpService: HttpService,
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

  findBy(param: Partial<Vendedor>): Promise<Vendedor | null> {
    return this.vendedorRepository.findOne({ where: param });
  }

  async getPositivacaoClientesPorMarca(): Promise<{
    [vendedor: string]: {
      [marca: string]: {
        totalClientes: number;
        clientesPositivados: number;
        positivacao: number;
      };
    };
  }> {
    const vendedores = await this.
    const vendas = await this.vendaRepository.find({
      relations: ['cliente.cidade.estado', 'vendedor.regiao', 'itensVenda.produto.fornecedor'],
    });
  
    const relatorio: {
      [vendedor: string]: {
        [marca: string]: {
          totalClientes: number;
          clientesPositivados: number;
          positivacao: number;
        };
      };
    } = {};
  
    for (const vendedor of vendedores) {
      const vendedorNome = vendedor.nome;
      const regiao = vendedor.regiao;
  
      if (!regiao) continue;
  
      const clientesRegiao = regiao.clientes || [];
  
      const marcasPorCliente = new Map<number, Set<string>>();
  
      const vendasDoVendedor = vendas.filter(v => v.vendedor?.codigo === vendedor.codigo);
  
      for (const venda of vendasDoVendedor) {
        const clienteId = venda.cliente?.cliente_id;
        if (!clienteId) continue;
  
        for (const item of venda.itensVenda) {
          const marca = item.produto?.fornecedor?.nome;
          if (!marca) continue;
  
          if (!marcasPorCliente.has(clienteId)) {
            marcasPorCliente.set(clienteId, new Set());
          }
          marcasPorCliente.get(clienteId)!.add(marca);
        }
      }
  
      relatorio[vendedorNome] = {};
  
      const totalClientes = clientesRegiao.length;
  
      for (const cliente of clientesRegiao) {
        const clienteId = cliente.cliente_id;
        const marcas = marcasPorCliente.get(clienteId) || new Set();
  
        for (const marca of marcas) {
          if (!relatorio[vendedorNome][marca]) {
            relatorio[vendedorNome][marca] = {
              totalClientes: totalClientes,
              clientesPositivados: 0,
              positivacao: 0,
            };
          }
  
          relatorio[vendedorNome][marca].clientesPositivados += 1;
        }
      }
  
      for (const marca in relatorio[vendedorNome]) {
        const r = relatorio[vendedorNome][marca];
        r.positivacao = Number((r.clientesPositivados / r.totalClientes).toFixed(2));
      }
    }
  
    console.dir(relatorio, { depth: null });
    return relatorio;
  }
  
}
