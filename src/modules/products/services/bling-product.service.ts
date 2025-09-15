import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IBlingTokenRepository, IProductsRepository } from 'src/domain/repositories';
import { Produto } from '../../../infrastructure/database/entities';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BlingProductService {
  private readonly logger = new Logger(BlingProductService.name);
  private readonly productTag = 'produtos';
  private readonly apiBlingUrl: string;

  constructor(
    private readonly httpService: HttpService,
    @Inject('IBlingTokenRepository') private readonly blingTokenService: IBlingTokenRepository,
    @Inject('IProductsRepository') private readonly productRepository: IProductsRepository,
  ) {
    this.apiBlingUrl = process.env.BLING_API_URL;
  }

  private sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async registerProducts(fornecedor_id: number): Promise<void> {
    const products = await this.productRepository.findAllUni(fornecedor_id);
    const token = await this.blingTokenService.getLastToken('AZZO');
  
    this.logger.log(`📦 Total de produtos vindos da base: ${products.length}`);
  
    const produtosUnicos = new Map<string, Produto>();
    for (const produto of products) {
      const codigoNormalizado = produto.codigo.trim().toUpperCase();
      if (!produtosUnicos.has(codigoNormalizado)) {
        produtosUnicos.set(codigoNormalizado, produto);
      } else {
        this.logger.warn(`⚠️ Produto duplicado na base local: ${codigoNormalizado}. Ignorando um deles.`);
      }
    }
  
    const produtosFiltrados = Array.from(produtosUnicos.values());
    this.logger.log(`🧹 Após filtro: ${produtosFiltrados.length} produtos únicos.`);
  
    const chunkSize = 25;
  
    for (let i = 0; i < produtosFiltrados.length; i += chunkSize) {
      const chunk = produtosFiltrados.slice(i, i + chunkSize);
      this.logger.log(`🚚 Enviando lote ${i / chunkSize + 1} (${chunk.length} produtos)`);
  
      for (const [index, produto] of chunk.entries()) {
        const globalIndex = i + index + 1;
        this.logger.log(`➡️ [${globalIndex}/${produtosFiltrados.length}] Processando: ${produto.nome} (${produto.codigo})`);
      
        const payload = this.mapProductToBling(produto);
      
        try {
          await this.sendProductToBling(payload, token.access_token);
        } catch (error) {
          const errorMsg = error?.response?.data;
      
          if (errorMsg?.error?.type === 'TOO_MANY_REQUESTS') {
            this.logger.warn(`⚠️ Rate limit atingido. Aguardando 3 segundos e tentando de novo...`);
            await this.sleep(3000);
            try {
              await this.sendProductToBling(payload, token.access_token);
            } catch (retryError) {
              this.logger.error(`❌ Falha definitiva no produto ${produto.codigo}`, retryError?.response?.data || retryError.message);
            }
          } else {
            this.logger.error(`❌ Erro ao registrar produto ${produto.codigo}`, errorMsg || error.message);
          }
        }
      
        // intervalo maior para evitar concorrência com queries extras do TypeORM
        await this.sleep(600);
      }      
  
      if (i + chunkSize < produtosFiltrados.length) {
        this.logger.log(`⏳ Aguardando 5 segundos antes do próximo lote...`);
        await this.sleep(5000);
      }
    }
  }
  

  private async sendProductToBling(payload: any, token: string): Promise<void> {
    const response = await lastValueFrom(
      this.httpService.post(
        this.apiBlingUrl + this.productTag,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
    );
  
    this.logger.log(`✅ Produto enviado com sucesso: ${payload.nome}`);
  }
  

  private mapProductToBling(product: Produto): any {
    return {
      nome: product.nome,
      tipo: 'P',
      situacao: product.ativo === 1 ? 'A' : 'I',
      formato: 'S',
      codigo: product.codigo,
      preco: product.preco_venda,
      descricaoCurta: product.nome,
      unidade: 'UN',
      pesoLiquido: product.peso_grs || 0,
      pesoBruto: product.peso_grs || 0,
      gtin: product.ean,
      tipoProducao: 'T',
      marca: product.fornecedor.nome,
      categoria: {
        id: product.fornecedor.fornecedor_id
      },
      actionEstoque: 'T',
      tributacao: {
        origem: 0,
        ncm: product.ncm.toString(),
        cest: product.cest
      },
      midia: {
        imagens: {
          imagensURL: product.fotoUrl
            ? [{ link: product.fotoUrl }]
            : []
        }
      }
    };
  }
}
