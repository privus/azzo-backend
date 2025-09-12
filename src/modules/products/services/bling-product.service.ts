import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IBlingTokenRepository, IProductsRepository } from 'src/domain/repositories';
import { Produto } from '../../../infrastructure/database/entities';

@Injectable()
export class BlingProductService {
    private readonly logger = new Logger(BlingProductService.name);

    constructor(
        private readonly httpService: HttpService,
        @Inject('IBlingTokenRepository') private readonly blingTokenService: IBlingTokenRepository,
        @Inject('IProductsRepository') private readonly productRepository: IProductsRepository,
    ) {}

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
          pesoLiquido: product.peso_grs,
          pesoBruto: product.peso_grs, // ou calcule com embalagem
          gtin: product.ean,
          gtinEmbalagem: product.ean,
          tipoProducao: 'P',
          condicao: 0,
          freteGratis: false,
          marca: product.fornecedor?.nome ?? '',
          descricaoComplementar: '',
          linkExterno: '',
          observacoes: '',
          descricaoEmbalagemDiscreta: '',
          categoria: {
            id: product.categoria?.categoria_id || 1
          },
          estoque: {
            minimo: product.estoque_minimo ?? 1,
            maximo: product.saldo_estoque ?? 100,
            crossdocking: 1,
            localizacao: '14A'
          },
          actionEstoque: 'T',
          dimensoes: {
            largura: product.largura || 1,
            altura: product.altura || 1,
            profundidade: product.comprimento || 1,
            unidadeMedida: 1
          },
          tributacao: {
            origem: 0,
            ncm: product.ncm?.toString() ?? '',
            cest: product.cest ?? ''
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
