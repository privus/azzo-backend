import { Inject, Injectable } from '@nestjs/common';
import { Estoque } from '../../../infrastructure/database/entities';
import { IProductsRepository, IStockRepository, ITinyAuthRepository } from '../../../domain/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { NfeSupplierDto } from '../dto';

@Injectable()
export class StockService implements IStockRepository {
  private readonly apiUrlTiny: string;
  private readonly nfeTag = 'notas';
  constructor(
    @InjectRepository(Estoque) private readonly stockRepository: Repository<Estoque>,
    @Inject('ITinyAuthRepository') private readonly tinyAuthService: ITinyAuthRepository,
    @Inject('IProductsRepository') private readonly productRepository: IProductsRepository,
    private readonly httpService: HttpService,    
  ) {
    this.apiUrlTiny = process.env.TINY_API_URL;

  }

  async getStock(): Promise<Estoque[]> {
    return this.stockRepository.find({
      relations: ['fornecedor', 'produto', 'saidas'],
    });
  }

  async insertStockByNf(nf_id: number, fornecedor_id: number): Promise<string> {
    const nf = await this.getNfById(nf_id);
    console.log(`🔍 NF encontrada ================================+>`, nf);
    const itens = nf.itens || [];
  
    if (itens.length === 0) {
      throw new Error(`Nota ${nf_id} sem itens.`);
    }
  
    for (const item of itens) {
      let produto;
  
      switch (fornecedor_id) {
        case 918650432:
          const tiny_mg =  item.idProduto;
          produto = await this.productRepository.findBy({ tiny_mg });
          break;
        
        case 918544743
        
  
        default:
          throw new Error(`Fornecedor ${fornecedor_id} ainda não mapeado.`);
      }
  
      if (!produto) {
        console.warn(`Produto não localizado: tiny_mg = ${item.idProduto}`);
        continue;
      }
  
      const quantidade = Number(item.quantidade);
      const precoUnitario = Number(item.valorUnitario);
  
      const estoque = this.stockRepository.create({
        produto,
        quantidade_total: quantidade,
        preco_custo_unitario: precoUnitario,
        valor_total: item.valorTotal,
        data_entrada: new Date().toISOString(),
        origem: 'NFE',
        numero_nfe: nf.numero,
      });
  
      await this.stockRepository.save(estoque);
  
      await this.productRepository.incrementStock(produto.produto_id, quantidade);
    }
  
    return `Estoque importado da NF ${nf_id}`;
  }

  async getNfById(id: number): Promise<NfeSupplierDto> {
    const token = await this.tinyAuthService.getAccessToken('MG');
    try {
        const url = `${this.apiUrlTiny}${this.nfeTag}/${id}`;
        console.log(`🔍 Buscando Nf ==============================> em: ${url}`);
        const response = await this.httpService.axiosRef.get< NfeSupplierDto >(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nfData = response.data
        if (!nfData) {
            throw new Error(`Nf com ID ${id} não encontrada`);
        }
        return nfData;
    } catch (error) {
        console.error(`🚫 Erro ao buscar Nf ${id}:`, error);
        throw error;
    }
  }    
}