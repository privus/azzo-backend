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
    private readonly tag = 'produtos/'
    
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
            ncm: produto.ncm ? produto.ncm.toString() : "",
            ean: produto.ean ? produto.ean.toString() : "",
            peso_bruto: produto.peso_grs ? Number((produto.peso_grs / 1000).toFixed(3)) : undefined,
            marca: produto.fornecedor?.nome || undefined,
            recomendacoes_fiscais: produto.cest ? [{ id_cest: produto.cest }] : [],
            valor_unitario: produto.preco_venda,
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

    async cadastraProdutosOmie(): Promise<any> {
      const produtos = await this.produtoRepository.find({ where: { unidade: null }, relations: ['fornecedor', 'produto'] });
      this.logger.log(`Encontrados ${produtos.length} produtos sem unidade_id.`);
      const resultados = [];
  
      for (const produto of produtos) {
        try {
          const res = await this.cadastrarProduto(produto);
          resultados.push({ codigo: produto.codigo, status: 'OK', omie: res });
          await new Promise((res) => setTimeout(res, 250)); // rate limit
        } catch (e) {
          this.logger.error(`Falha ao cadastrar produto código: ${produto.codigo}`, e?.response?.data || e.message);
          resultados.push({ codigo: produto.codigo, status: 'ERRO', erro: e?.response?.data || e.message });
        }
      }
      return resultados;
  }
  
}
