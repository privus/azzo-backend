import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriaProduto, Produto } from '../../../infrastructure/database/entities';
import { ProdutoAPIResponse } from '../dto/products.dto';

@Injectable()
export class ProductsService {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly apiTag = 'products'; // Inicializa corretamente o apiTag
  photoUrl: string;

  constructor(
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(CategoriaProduto) private readonly categoriaRepository: Repository<CategoriaProduto>,
    private readonly httpService: HttpService,
  ) {
    this.token = process.env.SELLENTT_API_TOKEN;
    this.apiUrl = process.env.SELLENTT_API_URL;
    this.photoUrl = process.env.PRODUCT_PHOTO;
  }

  async syncroProducts(): Promise<void> {
    let page = 1;

    while (true) {
      try {
        // Monta a URL com validação
        const url = `${this.apiUrl}${this.apiTag}?page=${page}`;
        console.log(`Requesting: ${url}`); // Log para depuração

        // Realiza a requisição para a API
        const response = await this.httpService.axiosRef.get<{ data: ProdutoAPIResponse[] }>(url, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        const produtosData = response.data.data;

        // Verifica se não há mais produtos para sincronizar
        if (!produtosData || produtosData.length === 0) {
          console.log(`Nenhum registro encontrado na página ${page}. Encerrando a sincronização.`);
          break;
        }

        // Processa cada produto recebido
        console.log(`Página ${page} => ${produtosData.length} produtos recebidos.`);
        for (const item of produtosData) {
          await this.processarProduto(item);
        }
        page++;
      } catch (error) {
        console.error('Erro ao sincronizar produtos:', error.message);
        throw error;
      }
    }

    console.log('Sincronização de produtos finalizada!');
  }

  private async processarProduto(item: ProdutoAPIResponse) {
    // Busca ou cria a categoria do produto
    let categoria = await this.categoriaRepository.findOne({ where: { categoria_id: item.category.id } });

    if (!categoria) {
      categoria = this.categoriaRepository.create({
        categoria_id: item.category.id,
        nome: item.category.name,
      });
      await this.categoriaRepository.save(categoria);
      console.log(`Categoria ${categoria.nome} salva com sucesso!`);
    }

    // Cria ou atualiza o produto no banco
    const existingProduct = await this.produtoRepository.findOne({
      where: { codigo: item.code },
    });

    if (existingProduct) {
      console.log(`Produto com código ${item.code} já existe. Atualizando...`);
      Object.assign(existingProduct, {
        nome: item.name,
        ativo: item.is_active,
        preco_venda: item.price.default,
        ncm: Number(item.ncm),
        ean: Number(item.ean),
        preco_custo: item.price_cost,
        peso_grs: item.average_weight,
        fotoUrl: item.catalog.image,
        categoria: categoria,
        data_atualizacao: new Date(item.updated_at),
        descricao_uni: item.description.html,
      });
      await this.produtoRepository.save(existingProduct);
      console.log(`Produto ${existingProduct.nome} atualizado com sucesso!`);
      return;
    }

    const novoProduto = this.produtoRepository.create({
      codigo: item.code,
      nome: item.name,
      ativo: item.is_active,
      preco_venda: item.price.default,
      ncm: Number(item.ncm),
      ean: Number(item.ean),
      preco_custo: item.price_cost,
      peso_grs: item.average_weight,
      categoria: categoria,
      fornecedor: null,
      data_criacao: new Date(item.created_at),
      data_atualizacao: new Date(item.updated_at),
      descricao_uni: item.description.html,
      fotoUrl: `${this.photoUrl + item.code}.png`,
    });

    await this.produtoRepository.save(novoProduto);
    console.log(`Produto ${novoProduto.nome} salvo com sucesso!`);
  }

  findAllProducts(): Promise<Produto[]> {
    return this.produtoRepository.find({ relations: ['categoria'] });
  }

  findProductById(id: number): Promise<Produto> {
    return this.produtoRepository.findOne({ where: { produto_id: id }, relations: ['categoria'] });
  }

  async findBy(param: Partial<Produto>): Promise<Produto | null> {
    return this.produtoRepository.findOne({ where: param });
  }
}
