import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CategoriaProduto, Fornecedor, Produto } from '../../../infrastructure/database/entities';
import { ProdutoAPIResponse } from '../dto/products.dto';
import { IProductsRepository } from '../../../domain/repositories';
import * as fs from 'fs';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductsService implements IProductsRepository {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly apiTag = 'products'; // Inicializa corretamente o apiTag
  photoUrl: string;

  constructor(
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(CategoriaProduto) private readonly categoriaRepository: Repository<CategoriaProduto>,
    @InjectRepository(Fornecedor) private readonly fornecedorRepository: Repository<Fornecedor>,
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
      sellent_id: item.id,
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

  async syncroSupplier(): Promise<void> {
    try {
      const totalProdutos = await this.produtoRepository.count();
      console.log(`Total de produtos cadastrados: ${totalProdutos}`);
  
      let page = 1;
      const limit = 100; // Ajuste conforme necessário
  
      while ((page - 1) * limit < totalProdutos) {
        const url = `${this.apiUrl}custom_values?page=${page}`;
        console.log(`Buscando fornecedores de: ${url}`);
  
        const response = await this.httpService.axiosRef.get<{ data: any[] }>(url, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
  
        const fornecedoresData = response.data.data;
  
        if (!fornecedoresData || fornecedoresData.length === 0) {
          console.log(`Nenhum fornecedor encontrado na página ${page}. Encerrando...`);
          break;
        }
  
        console.log(`Página ${page} => ${fornecedoresData.length} fornecedores recebidos.`);
  
        for (const item of fornecedoresData) {
  
          // Se o campo `value` for numérico, encerra a sincronização
          if (!isNaN(Number(item.value))) {
            console.log(`Valor numérico encontrado (${item.value}). Encerrando sincronização.`);
            return;
          }
  
          const produto = await this.produtoRepository.findOne({
            where: { sellent_id: item.product_id },
            relations: ['fornecedor'],
          });
  
          if (!produto) {
            console.log(`Produto com sellent_id ${item.product_id} não encontrado.`);
            continue;
          }

          if (produto.fornecedor) {
            console.log(`Produto ${produto.nome} já possui fornecedor, pulando...`);
            continue;
          }
  
          // Busca ou cria o fornecedor
          let fornecedor = await this.fornecedorRepository.findOne({
            where: { nome: item.value },
          });
  
          if (!fornecedor) {
            fornecedor = this.fornecedorRepository.create({ nome: item.value });
            await this.fornecedorRepository.save(fornecedor);
            console.log(`Fornecedor ${fornecedor.nome} salvo.`);
          }
  
          // Atualiza o produto com o fornecedor correto
          produto.fornecedor = fornecedor;
          await this.produtoRepository.save(produto);
          console.log(`Produto ${produto.nome} atualizado com fornecedor ${fornecedor.nome}.`);
        }
  
        page++; // Passa para a próxima página
      }
      console.log('Sincronização de produtos finalizada!');
    } catch (error) {
      console.error('Erro ao sincronizar produtos:', error.message);
      throw error;
    }
  }

  async syncroTinyIds(): Promise<void> {
    const jsonFilePath = 'src/utils/tabela-final-produtos-com-tiny.json'; // Caminho do JSON gerado

    // 1) Verifica se o arquivo JSON existe
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`Erro: Arquivo '${jsonFilePath}' não encontrado.`);
      return;
    }

    // 2) Lê o arquivo JSON
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const tinyData = JSON.parse(jsonData);

    console.log(`Lidos ${tinyData.length} registros de IDs Tiny do JSON.`);

    for (const item of tinyData) {
      // 3) Encontra o produto no banco pelo código
      const produto = await this.produtoRepository.findOne({
        where: { codigo: item.codigo },
      });

      if (!produto) {
        console.log(`Produto com código ${item.codigo} não encontrado no banco.`);
        continue;
      }

      // 4) Atualiza os IDs Tiny apenas se existirem no JSON
      produto.tiny_mg = item.id_tiny_mg || produto.tiny_mg;
      produto.tiny_sp = item.id_tiny_sp || produto.tiny_sp;

      await this.produtoRepository.save(produto);
      console.log(`Produto ${produto.codigo} atualizado com IDs Tiny MG: ${produto.tiny_mg}, SP: ${produto.tiny_sp}.`);
    }

    console.log('Sincronização de IDs Tiny finalizada com sucesso!');
  }
  

  findAllProducts(): Promise<Produto[]> {
    return this.produtoRepository.find({ where: { ativo: 1 }, relations: ['categoria', 'fornecedor'] });
  }

  findProductById(id: number): Promise<Produto> {
    return this.produtoRepository.findOne({ where: { produto_id: id }, relations: ['categoria', 'fornecedor'] });
  }

  async findBy(param: Partial<Produto>): Promise<Produto | null> {
    return this.produtoRepository.findOne({ where: param });
  }

  async findByEan(ean: number): Promise<Produto[] | null> { 
    const produtos = await this.produtoRepository.find({
      where: { ean },
      relations: ['categoria', 'fornecedor', 'unidade'],
    });
  
    if (!produtos.length) return undefined;

      return produtos
  }  

  async updateProduct(id: number, data: UpdateProductDto ): Promise<string> {
    await this.produtoRepository.update(id, data);
    return 'Produtos atualizados com Sucesso!';
  }

  async incrementStock(produto_id: number, quantidade: number): Promise<void> {
    await this.produtoRepository.increment({ produto_id }, 'saldo_estoque', quantidade);
    return 
  }

  async decrementStock(produto_id: number, quantidade: number): Promise<void> {
    await this.produtoRepository.decrement({ produto_id }, 'saldo_estoque', quantidade);
    return 
  }
  
  async findProductByPartialCode(partialCode: string): Promise<Produto[] | undefined> {
    const produtos = await this.produtoRepository.find({
      where: {
        codigo: Like(`${partialCode}%`)
      }, relations: ['categoria', 'fornecedor', 'unidade'],
    });
  
    if (!produtos.length) return undefined;
  
    return produtos
  } 

  async updateStockMinimumFromJson(): Promise<void> {
    const jsonFilePath = 'src/utils/estoque-minimo.json';
  
    // Verifica se o arquivo JSON existe
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Arquivo '${jsonFilePath}' não encontrado.`);
      return;
    }
  
    // Lê e parseia o arquivo JSON
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const estoqueData = JSON.parse(jsonData);
  
    console.log(`🔄 Processando ${estoqueData.length} registros de estoque mínimo...`);
  
    for (const item of estoqueData) {
      if (!item.produto_id) {
        console.warn(`⚠️ Registro inválido: ${JSON.stringify(item)}`);
        continue;
      }
  
      const produto = await this.produtoRepository.findOne({
        where: { produto_id: item.produto_id },
      });
  
      if (!produto) {
        console.warn(`⚠️ Produto com ID ${item.produto_id} não encontrado.`);
        continue;
      }
  
      const novoEstoqueMinimo = !item.estoque_minimo || item.estoque_minimo === 0
        ? 288
        : Number(item.estoque_minimo);
  
      produto.estoque_minimo = novoEstoqueMinimo;
      await this.produtoRepository.save(produto);
  
      console.log(`✅ Produto ${produto.produto_id} atualizado com estoque_minimo: ${produto.estoque_minimo}`);
    }
  
    console.log('🚀 Atualização de estoque_minimo concluída com sucesso!');
  }

  saveProduct(produto: Produto): Promise<Produto> {
    return this.produtoRepository.save(produto);
  }

  async activeProducts(product_id: number): Promise<void> {
    const url = `${this.apiUrl}${this.apiTag}/${product_id}`;
    try {
      return this.httpService.axiosRef.put(url, { "is_active": 1 }, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      }).then(() => {
        console.log(`Produto id-${product_id} atualizado com sucesso.`);
      });
    }
    catch (error) {
      console.error(`Erro ao ativar produto id-${product_id}:`, error.message);
      throw new BadRequestException({ message: error.message });
    }
  }
}
