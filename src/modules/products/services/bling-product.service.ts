import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IBlingAuthRepository, IProductsRepository } from '../../../domain/repositories';
import { BlingProductApiResponse, BlingProductDto } from '../dto';
import * as fs from 'fs';

@Injectable()
export class BlingProductService {
  private readonly logger = new Logger(BlingProductService.name);
  private readonly productTag = 'produtos';
  private readonly apiBlingUrl: string;
  private isUpdating = false;

  constructor(
    private readonly httpService: HttpService,
    @Inject('IBlingAuthRepository') private readonly blingAuthRepository: IBlingAuthRepository,
    @Inject('IProductsRepository') private readonly productRepository: IProductsRepository,
  ) {
    this.apiBlingUrl = process.env.BLING_API_URL;
  }

  private sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async registerProducts(): Promise<void> {
    try {
      const products = await this.productRepository.findAllUni();
      const token = await this.blingAuthRepository.getAccessToken('PURELI');
  
      if (!products.length) {
        this.logger.log(`✅ Nenhum produto pendente para sincronizar.`);
        return;
      }
  
      this.logger.log(`📦 Total de produtos vindos da base: ${products.length}`);
  
      for (const [index, produto] of products.entries()) {
        this.logger.log(`➡️ [${index + 1}/${products.length}] Processando: ${produto.nome} (${produto.codigo})`);
  
        try {
          const body: BlingProductDto = {
            nome: produto.nome,
            tipo: 'P',
            situacao: 'A',
            formato: 'S',
            codigo: produto.codigo,
            preco: produto.preco_venda,
            descricaoCurta: produto.nome,
            unidade: 'UN',
            pesoLiquido: produto.peso_grs || 0,
            pesoBruto: produto.peso_grs || 0,
            gtin: produto.ean,
            tipoProducao: 'T',
            marca: produto.fornecedor.nome,
            categoria: {
              id: produto.fornecedor.fornecedor_id
            },
            actionEstoque: 'T',
            tributacao: {
              origem: 0,
              ncm: produto.ncm.toString(),
              cest: produto.cest
            },
            midia: {
              imagens: {
                imagensURL: produto.fotoUrl
                  ? [{ link: produto.fotoUrl }]
                  : []
              }
            }
          };
  
          const blingId = await this.sendProductToBling(body, token);
  
          produto.bling_id_p = blingId;
          await this.productRepository.saveProduct(produto);
  
          this.logger.log(`🔄 Produto ${produto.codigo} atualizado no banco com bling_id ${blingId}`);
        } catch (error) {
          this.logger.error(`❌ Erro ao enviar produto ${produto.codigo}`, error?.response?.data || error.message);
          throw error; // Se quiser continuar com os outros, remova este throw
        }
  
        await this.sleep(600); // 3 req/s de acordo com rate limit do Bling
      }
  
      this.logger.log(`🎉 Finalizado: todos os produtos pendentes foram processados.`);
    } catch (fatalError) {
      this.logger.error(`💥 Erro fatal no processo de sincronização`, fatalError);
      throw fatalError;
    }
  }
  
  private async sendProductToBling(payload: BlingProductDto, token: string): Promise<number> {
    try {
      const response = await this.httpService.axiosRef.post(
        this.apiBlingUrl + this.productTag,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      const produtoId = response.data?.data?.id;
  
      if (!produtoId) {
        throw new Error(`ID do produto não retornado pelo Bling. Response: ${JSON.stringify(response.data)}`);
      }
  
      this.logger.log(`✅ Produto enviado com sucesso: ${payload.nome} | ID: ${produtoId}`);
  
      return produtoId;
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar produto: ${payload.nome}`,
        error?.response?.data || error.message,
      );
      throw error;
    }
  }    

  async getIdsBling(): Promise<string> {
    let pagina = 1;

    const token = await this.blingAuthRepository.getAccessToken('PURELI');

    if (!token) {
      console.error(`❌ Erro ao obter token, pulando sincronização.`);
      return;
    }

    while (true) {
      try {
        const url = `${this.apiBlingUrl}${this.productTag}?pagina=${pagina}`;
        
        const response = await this.httpService.axiosRef.get<BlingProductApiResponse>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });        

        const products = response.data.data;

        for (const product of products) {
          const existingProduct = await this.productRepository.findBy({codigo: product.codigo});
          if (existingProduct) {
            existingProduct.bling_id_p = product.id;
            await this.productRepository.saveProduct(existingProduct);
            this.logger.log(`🔄 Produto ${product.codigo} atualizado no banco com bling_id ${product.id}`);
          } else {
            this.logger.warn(`⚠️ Produto com código ${product.codigo} não encontrado na base local.`);
          }
        }

        pagina++;
        if (products.length === 0) {
          this.logger.log(`🎉 Finalizado: todos os produtos foram processados.`);
          break;
        }
      } catch (error) {
        this.logger.error(`❌ Erro ao buscar produtos na página ${pagina}`, error?.response?.data || error.message);
        break;
      }
    }
  }

  async updateProductWithTributacao(): Promise<void> {
    if (this.isUpdating) {
      this.logger.warn('⚠️ Uma atualização já está em andamento. Abortando nova execução.');
      return;
    }
  
    this.isUpdating = true;
  
    try {
      const jsonFilePath = 'src/utils/base-icms-uni.json';
  
      if (!fs.existsSync(jsonFilePath)) {
        this.logger.error(`❌ Arquivo '${jsonFilePath}' não encontrado.`);
        return;
      }
  
      const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
      const taxData: {
        codigo: string;
        valorBaseStRetencao?: number | null;
        valorStRetencao?: number | null;
        valorICMSSubstituto?: number | null;
      }[] = JSON.parse(jsonData);
  
      const token = await this.blingAuthRepository.getAccessToken('PURELI');
      if (!token) {
        this.logger.error(`❌ Token de autenticação não encontrado.`);
        return;
      }
  
      this.logger.log(`🚀 Iniciando atualização de produtos (preço, EAN e tributação)... Total: ${taxData.length}`);
  
      for (const [index, item] of taxData.entries()) {
        try {
          const produto = await this.productRepository.findBy({ codigo: item.codigo });
  
          if (!produto || !produto.bling_id_p) {
            this.logger.warn(`⚠️ [${index + 1}/${taxData.length}] Produto ${item.codigo} não encontrado ou sem bling_id.`);
            continue;
          }
  
          const body = {
            codigo: produto.codigo,
            nome: produto.nome,
            preco: produto.preco_venda,
            ean: produto.ean,
            unidade: 'UN',
            tipo: 'P',
            situacao: 'A',
            formato: 'S',
            tributacao: {
              origem: 0,
              ncm: produto.ncm?.toString(),
              cest: produto.cest,
              valorBaseStRetencao: item.valorBaseStRetencao || 0,
              valorStRetencao: item.valorStRetencao || 0,
              valorICMSSubstituto: item.valorICMSSubstituto || 0,
            },
          };
  
          const url = `${this.apiBlingUrl}${this.productTag}/${produto.bling_id_p}`;
  
          await this.httpService.axiosRef.put(url, body, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
  
          this.logger.log(`✅ [${index + 1}/${taxData.length}] Produto ${produto.codigo} atualizado com sucesso no Bling.`);
          await this.sleep(1200);
        } catch (error) {
          this.logger.error(
            `❌ [${index + 1}/${taxData.length}] Erro ao atualizar produto ${item.codigo} no Bling`,
            error?.response?.data || error.message
          );
        }
      }
  
      this.logger.log(`🎯 Atualização de preço, EAN e tributação finalizada.`);
    } catch (error) {
      this.logger.error(`💥 Erro inesperado no processo de atualização`, error);
    } finally {
      this.isUpdating = false;
    }
  }
  
}
