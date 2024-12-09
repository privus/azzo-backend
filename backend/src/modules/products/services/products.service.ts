import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaProduto, Produto } from '../../../infrastructure/database/entities';
import { ProdutoAPIResponse } from '../dto/products.dto';

@Injectable()
export class ProductsService {
  private readonly apiUrl = 'https://api.sellentt.com.br/api/v1/products';
  private readonly token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MzI3MTM1NDQsImlzcyI6ImFwcC5wZWRpZG9zZGlnaXRhaXMuY29tLmJyIiwiaWQiOjI1OCwiY2xpZW50X2lkIjoxMDMwfQ.VCbVSBwUW8MPBWtVDNPzUuc8bFF_4FB9WmHk-MjUiRc';

  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(CategoriaProduto)
    private readonly categoriaRepository: Repository<CategoriaProduto>,
    private readonly httpService: HttpService, // Agora sem o @InjectRepository
  ) {}

  async syncroProducts(): Promise<void> {
    try {
      const response = await this.httpService.axiosRef.get<{ data: ProdutoAPIResponse[] }>(this.apiUrl, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const produtosData = response.data.data;
      for (const item of produtosData) {
        await this.processarProduto(item);
      }
    } catch (error) {
      console.error('Erro ao sincronizar produtos:', error);
      throw error;
    }
  }

  private async processarProduto(item: ProdutoAPIResponse) {
    // Ajuste o campo de busca da categoria conforme o nome da coluna na sua entidade CategoriaProduto.
    // Se a entidade CategoriaProduto tiver a coluna "id" e não "categoria_id", use { id: item.category.id }.
    let categoria = await this.categoriaRepository.findOne({ where: { categoria_id: item.category.id } });

    if (!categoria) {
      categoria = this.categoriaRepository.create({
        // Aqui também ajuste o campo conforme a entidade CategoriaProduto.
        // Se a entidade tem "id" e "nome", use "id" ao invés de "categoria_id".
        categoria_id: item.category.id,
        nome: item.category.name,
      });
      await this.categoriaRepository.save(categoria);
    }

    const descontoMaximo = item.maximum_discount || 0;

    const novoProduto = this.produtoRepository.create({
      codigo: item.code,
      name: item.name,
      ativo: item.is_active,
      desconto_maximo: descontoMaximo,
      preco_venda: item.price.default,
      ncm: Number(item.ncm),
      ean: Number(item.ean),
      preco_custo: item.price_cost,
      peso_grs: item.average_weight,
      fotoUrl: item.catalog.image,
      categoria: categoria,
      fornecedor: null,
    });

    await this.produtoRepository.save(novoProduto);
    console.log(`Produto ${novoProduto.name} salvo com sucesso!`);
  }

  findAllProducts(): Promise<Produto[]> {
    return this.produtoRepository.find({ relations: ['categoria'] });
  }
}
