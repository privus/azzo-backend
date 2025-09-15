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
  
    if (!token) {
      this.logger.error('Token do Bling não encontrado');
      return;
    }
  
    this.logger.log(`📦 Total de produtos vindos da base: ${products.length}`);
  
    const produtosUnicos = new Map<string, Produto>();
  
    for (const produto of products) {
      const codigoNormalizado = produto.codigo.trim().toUpperCase();
      if (!produtosUnicos.has(codigoNormalizado)) {
        produtosUnicos.set(codigoNormalizado, produto);
      } else {
        this.logger.warn(`⚠️ Produto com código duplicado na base local: ${codigoNormalizado}. Ignorando um deles.`);
      }
    }
  
    const produtosFiltrados = Array.from(produtosUnicos.values());
    this.logger.log(`🧹 Após filtro de duplicados: ${produtosFiltrados.length} produtos únicos.`);
  
    const chunkSize = 25;
  
    for (let i = 0; i < produtosFiltrados.length; i += chunkSize) {
      const chunk = produtosFiltrados.slice(i, i + chunkSize);
      this.logger.log(`🚚 Enviando lote ${i / chunkSize + 1} (${chunk.length} produtos)`);
  
      for (const [index, produto] of produtosFiltrados.entries()) {
        this.logger.log(`➡️ [${index + 1}/${produtosFiltrados.length}] Processando: ${produto.nome} (${produto.codigo})`);
      
        const payload = this.mapProductToBling(produto);
        console.log('Payload gerado============>', payload);
      
        await this.sleep(500);
        await this.sendProductToBling(payload, token.access_token);
      }
      
  
      // Espera 5 segundos após cada lote
      this.logger.log(`⏳ Aguardando 5 segundos antes do próximo lote...`);
      await this.sleep(5000);
    }
  }  

  private async sendProductToBling(payload: any, token: string): Promise<void> {
    try {
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
    } catch (error) {
      this.logger.error(
        `Erro ao enviar produto ${payload.codigo} para o Bling`,
        error?.response?.data || error.message
      );
    }
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
