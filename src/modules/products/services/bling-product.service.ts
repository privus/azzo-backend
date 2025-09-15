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
      const products = await this.productRepository.findAllUni();
      const token = await this.blingTokenService.getLastToken('AZZO');
    
      const codigosDuplicados = new Set<string>(); // ✅ controle em memória
    
      for (const produto of products) {
        try {
          if (codigosDuplicados.has(produto.codigo)) {
            this.logger.warn(`⏭️ Produto ${produto.codigo} já deu erro de duplicação. Pulando...`);
            continue;
          }
    
          const payload = this.mapProductToBling(produto);
          console.log('Payload gerado============>', payload);
    
          await this.sleep(350);
    
          await this.sendProductToBling(payload, token.access_token);
        } catch (error) {
          const errorMsg = error?.response?.data;
    
          const campos = errorMsg?.error?.fields;
          const erroDuplicado = campos?.some(
            (field) => field.element === 'codigo' && field.msg?.includes('já foi cadastrado')
          );
    
          if (erroDuplicado) {
            this.logger.warn(`🔁 Produto ${produto.codigo} já cadastrado no Bling.`);
            codigosDuplicados.add(produto.codigo); // ✅ adiciona ao Set
          } else {
            this.logger.error(`❌ Erro ao registrar produto ${produto.codigo}`, errorMsg || error.message);
          }
        }
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
