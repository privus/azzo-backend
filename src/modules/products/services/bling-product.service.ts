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

    registerProducts = async (): Promise<void> => {
      try {
        const products = await this.productRepository.findAllUni();
        const token = await this.blingTokenService.getLastToken('AZZO');
    
        if (!token) {
          this.logger.error('Token do Bling não encontrado');
          return;
        }
    
        for (const [index, product] of products.entries()) {
          const payload = this.mapProductToBling(product);
          console.log('Payload gerado============>', payload);
    
          // Aguarda um intervalo para não exceder limite de 3 req/s
          await this.sleep(350); // 350ms garante até ~2.85 req/s
    
          await this.sendProductToBling(payload, token.access_token);
        }
      } catch (error) {
        this.logger.error('Erro ao registrar produtos no Bling', error);
      }
    };    

    private async sendProductToBling(payload: any, token: string): Promise<void> {
      try {
        console.log('url enviada============>', this.apiBlingUrl + this.productTag);
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
    
        this.logger.log(`Produto enviado com sucesso: ${payload.nome}`);
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
