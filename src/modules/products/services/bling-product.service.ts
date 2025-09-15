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

  async registerProducts(): Promise<void> {
    try {
      const products = await this.productRepository.findAllUni();
      const token = await this.blingTokenService.getLastToken('AZZO');
  
      if (!products.length) {
        this.logger.log(`✅ Nenhum produto pendente para sincronizar.`);
        return;
      }
  
      this.logger.log(`📦 Total de produtos vindos da base: ${products.length}`);
  
      this.logger.log(`🧹 Após filtro: ${products.length} produtos únicos.`);
  
      for (const [index, produto] of products.entries()) {
        this.logger.log(`➡️ [${index + 1}/${products.length}] Processando: ${produto.nome} (${produto.codigo})`);
  
        const payload = this.mapProductToBling(produto);
  
        try {
          await this.sendProductToBling(payload, token.access_token);
  
          // ✅ Marca como sincronizado
          produto.bling = 1;
          await this.productRepository.saveProduct(produto);
          this.logger.log(`🔄 Produto ${produto.codigo} atualizado no banco (bling = 1)`);
  
        } catch (error) {
          this.logger.error(`❌ Erro ao enviar produto ${produto.codigo}`, error?.response?.data || error.message);
          // 🔴 Interrompe todo o processo
          throw error;
        }  

        await this.sleep(600); // respeita limite de 3 req/s
      }
  
      this.logger.log(`🎉 Finalizado: todos os produtos pendentes foram processados.`);
    } catch (fatalError) {
      this.logger.error(`💥 Erro fatal no processo de sincronização`, fatalError);
      throw fatalError; // 🔴 garante que a função também falhe para o chamador
    }
  }  

  private async sendProductToBling(payload: any, token: string): Promise<void> {
    await lastValueFrom(
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
        ncm: product.ncm?.toString(),
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
