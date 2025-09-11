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
        this.clientSecret = process.env.OMIE_APP_SECRET_AZZO;
        this.clientKey = process.env.OMIE_APP_KEY_AZZO;
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
      const produtos = await this.produtoRepository.createQueryBuilder('produto')
      .leftJoinAndSelect('produto.fornecedor', 'fornecedor')
      .leftJoinAndSelect('produto.unidade', 'unidade')
      .where('produto.unidade_id IS NULL')
      .andWhere('produto.ativo = :ativo', { ativo: 1 })
      .getMany();    
      
      this.logger.log(`Encontrados ${produtos.length} produtos sem unidade_id.`);
      const resultados = [];
    
      for (const produto of produtos) {
        try {
          const res = await this.cadastrarProduto(produto);
          resultados.push({ codigo: produto.codigo, status: 'OK', omie: res });
          // Respeite o rate limit, use um delay conservador:
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (e) {
          const faultcode = e?.response?.data?.faultcode;
          const faultstring = e?.response?.data?.faultstring || '';
          resultados.push({
            codigo: produto.codigo,
            status: 'ERRO',
            erro: faultstring || e.message,
          });
          this.logger.error(`Falha ao cadastrar produto código: ${produto.codigo}`, faultstring || e.message);
    
          // Se detectou bloqueio por uso indevido, pause o loop pelo tempo sugerido pela Omie
          if (faultcode === 'MISUSE_API_PROCESS') {
            const seconds = this.extractSecondsFromFaultstring(faultstring);
            const wait = (seconds ? Number(seconds) : 1800) * 1000; // Default 1800s (30min) se não conseguir extrair
            this.logger.warn(`API OMIE bloqueada. Aguardando ${wait / 1000} segundos antes de continuar...`);
            await new Promise((resolve) => setTimeout(resolve, wait));
            // Opcional: break/return para sair e não rodar os próximos produtos já que está bloqueado
            break;
          }
        }
      }
      return resultados;
    }
    
    /**
     * Extrai número de segundos do faultstring da Omie, exemplo: "Tente novamente em 1792 segundos."
     */
    private extractSecondsFromFaultstring(faultstring: string): number | undefined {
      const match = faultstring.match(/em (\d+) segundos/);
      return match ? parseInt(match[1], 10) : undefined;
    }    
  
}
