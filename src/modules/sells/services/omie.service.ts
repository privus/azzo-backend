import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Produto } from '../../../infrastructure/database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OmieService {
    private readonly logger = new Logger(OmieService.name);
    private readonly clientKey: string;
    private readonly clientSecret: string;
    private readonly endpoint: string;
    private readonly tag = 'produtos'
    
    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    ) {
        this.clientSecret = process.env.OMIE_APP_SECRET;
        this.clientKey = process.env.OMIE_APP_KEY;
        this.endpoint = process.env.OMIE_API_URL;
    }

    private extrairCodigoOmie(codigo: string): string {
        // Pega parte antes do primeiro "_"
        let parte = codigo.split('_')[0];
        // Remove "UNI" do final (case insensitive)
        parte = parte.replace(/UNI$/i, '');
        return parte.trim();
      }

      private montarBodyOmie(produto: Produto): any {
        const codigoOmie = this.extrairCodigoOmie(produto.codigo);
      
        return {
          call: "IncluirProduto",
          param: [
            {
              codigo_produto_integracao: produto.codigo,
              codigo: codigoOmie,
              descricao: produto.nome,
              unidade: "UN",
              ncm: produto.ncm,
              ean: produto.ean,
              recomendacoes_fiscais: produto.cest ? [{ id_cest: produto.cest }] : [],
            }
          ],
          app_key: this.clientKey,
          app_secret: this.clientSecret,
        };
      }
      
    
      async cadastrarProduto(produto: Produto): Promise<any> {
        const body = this.montarBodyOmie(produto);
        try {
          const response = await this.httpService.axiosRef.post(
            this.endpoint + this.tag,
            body
          );
          this.logger.log(`Produto cadastrado na Omie: ${produto.codigo}`);
          return response.data;
        } catch (error) {
          this.logger.error(`Erro ao cadastrar produto Omie ${produto.codigo}: ${error.response?.data?.faultstring || error.message}`);
          throw error;
        }
    }

    async cadastrarTodosProdutosUnidade(): Promise<void> {
        // Busca todos os produtos com unidade_id null
        const produtos = await this.produtoRepository.find({ where: { unidade: null } });
    
        this.logger.log(`Encontrados ${produtos.length} produtos sem unidade_id.`);
    
        for (const produto of produtos) {
          try {
            await this.cadastrarProduto(produto);
            // Respeite o rate limit da Omie! (um delay simples)
            await new Promise((res) => setTimeout(res, 250)); // 240/min
          } catch (e) {
            this.logger.error(`Falha ao cadastrar produto código: ${produto.codigo}`, e?.response?.data || e.message);
          }
        }
      }
    
}
