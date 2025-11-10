import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Not, Repository } from 'typeorm';
import { CategoriaProduto, Fornecedor, Produto } from '../../../infrastructure/database/entities';
import { ProdutoAPIResponse, UpdateProductDto } from '../dto';
import { IProductsRepository, ITinyAuthRepository } from '../../../domain/repositories';
import * as fs from 'fs';

@Injectable()
export class ProductsService implements IProductsRepository {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly productTag = 'products';
  photoUrl: string;
  private readonly apiUrlTiny: string;

  constructor(
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(CategoriaProduto) private readonly categoriaRepository: Repository<CategoriaProduto>,
    @InjectRepository(Fornecedor) private readonly fornecedorRepository: Repository<Fornecedor>,
    private readonly httpService: HttpService,
    @Inject('ITinyAuthRepository') private readonly tinyAuthService: ITinyAuthRepository,
  ) {
    this.token = process.env.SELLENTT_API_TOKEN;
    this.apiUrl = process.env.SELLENTT_API_URL;
    this.photoUrl = process.env.PRODUCT_PHOTO;
    this.apiUrlTiny = process.env.TINY_API_URL;
  }

  async syncroProducts(): Promise<void> {
    let page = 1;

    while (true) {
      try {
        const url = `${this.apiUrl}${this.productTag}?page=${page}`;
        console.log(`Requesting: ${url}`); // Log para depuração

        const response = await this.httpService.axiosRef.get<{ data: ProdutoAPIResponse[] }>(url, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        const produtosData = response.data.data;

        if (!produtosData || produtosData.length === 0) {
          console.log(`Nenhum registro encontrado na página ${page}. Encerrando a sincronização.`);
          break;
        }

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

    const existingProduct = await this.produtoRepository.findOne({
      where: { codigo: item.code },
    });

    if (existingProduct) {
      console.log(`Produto com código ${item.code} já existe. Pulando...`);
      return;
    }

    const novoProduto = this.produtoRepository.create({
      sellent_id: item.id,
      codigo: item.code,
      nome: item.name,
      ativo: item.is_active,
      preco_venda: item.price.default,
      ncm: Number(item.ncm),
      ean: item.ean,
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

  async findByEan(ean: string): Promise<Produto[] | null> { 
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
    const jsonFilePath = 'src/utils/estoque-min-dias.json';
  
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

      produto.estoque_minimo = Number(item.estoque_min_dias);
      await this.produtoRepository.save(produto);
  
      console.log(`✅ Produto ${produto.produto_id} atualizado com estoque_minimo: ${produto.estoque_minimo}`);
    }
  
    console.log('🚀 Atualização de estoque_minimo concluída com sucesso!');
  }

  saveProduct(produto: Produto): Promise<Produto> {
    return this.produtoRepository.save(produto);
  }

  async activeProducts(sellent_id: number): Promise<void> {
    const produto = await this.findBy({sellent_id})
    produto.ativo = 1;
    await this.produtoRepository.save(produto);
    const url = `${this.apiUrl}${this.productTag}/${sellent_id}`;
    console.log(`Ativando produto id-${sellent_id} na API: ${url}`);
    try {
      return this.httpService.axiosRef.put(url, { "is_active": 1 }, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      }).then(() => {
        console.log(`Produto id-${sellent_id} atualizado com sucesso.`);
      });
    }
    catch (error) {
      console.error(`Erro ao ativar produto id-${sellent_id}:`, error.message);
      throw new BadRequestException({ message: error.message });
    }
  }

  async updatePricesFromJson(): Promise<void> {
    const jsonFilePath = 'src/utils/tabela-padrao.json';
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Arquivo '${jsonFilePath}' não encontrado.`);
      return;
    }
  
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const priceData = JSON.parse(jsonData);
  
    console.log(`🔄 Processando ${priceData.length} produtos para atualização de preços...`);
  
    for (const item of priceData) {
      const codigo = item['Código do Produto'];
      const preco = item['Preço ($)'];
  
      if (!codigo || preco === undefined) {
        console.warn(`⚠️ Registro inválido: ${JSON.stringify(item)}`);
        continue;
      }
  
      const produto = await this.produtoRepository.findOne({ where: { codigo } });
  
      if (!produto) {
        console.warn(`⚠️ Produto com código ${codigo} não encontrado.`);
        continue;
      }
  
      produto.preco_venda = Number(preco);
  
      await this.produtoRepository.save(produto);
      console.log(`✅ Produto ${produto.codigo} atualizado com novo preço: R$${produto.preco_venda}`);
    }
  
    console.log('🚀 Atualização de preços concluída com sucesso!');
  }

  async findAllUni(): Promise<Produto[]> {
    const produtos = await this.produtoRepository
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.fornecedor', 'fornecedor')
      .where('produto.unidade_id IS NULL')
      .andWhere('produto.bling_id IS NULL')
      .andWhere('produto.ativo = :ativo', { ativo: 1 })
      .getMany();

    return produtos;
  }

  async fixUnidadeNames(): Promise<void> {
    // Regex para capturar medidas no final: 200ml, 1L, 250g, 1kg ...
    const measureAtEnd = /(\d+(?:[.,]\d+)?\s*(?:ml|mL|l|L|g|kg))\s*$/i;
  
    // Busca produtos do fornecedor 3 com unidade_id preenchido
    const produtos = await this.produtoRepository.find({
      where: {
        fornecedor: { fornecedor_id: 3 },
        unidade: Not(IsNull()),
      },
      relations: ['unidade', 'fornecedor'],
    });
  
    console.log(`Encontrados ${produtos.length} produtos CAIXA com unidade vinculada e fornecedor_id = 3.`);
  
    for (const produtoCaixa of produtos) {
      const nomeCaixa = (produtoCaixa.nome || '').trim();
  
      const match = nomeCaixa.match(measureAtEnd);
      if (!match) continue;
  
      // Normaliza medida
      let medida = match[1].trim();
      medida = medida.replace(/\s+/g, ''); // remove espaços internos → "200 ml" vira "200ml"
      medida = medida
        .replace(/mL$/i, 'ml')
        .replace(/l$/i, 'L')
        .replace(/kg$/i, 'kg')
        .replace(/g$/i, 'g');
  
      const produtoUnidade = produtoCaixa.unidade;
      if (!produtoUnidade) continue;
  
      const nomeUnidadeAtual = (produtoUnidade.nome || '').trim();
  
      // Verifica se já tem essa medida
      const alreadyHas = new RegExp(`\\b${medida.replace('.', '\\.')}\\b`, 'i').test(nomeUnidadeAtual);
      if (alreadyHas) continue;
  
      const novoNome = `${nomeUnidadeAtual} ${medida}`.trim();
  
      produtoUnidade.nome = novoNome;
      await this.produtoRepository.save(produtoUnidade);
  
      console.log(
        `✅ Unidade do produto ${produtoCaixa.codigo} atualizada: "${nomeUnidadeAtual}" → "${novoNome}"`
      );
    }
  
    console.log('🚀 Correção dos nomes de unidade concluída.');
  }

  async fixSupplierNames(): Promise<void> {
 
    const produtos = await this.produtoRepository.find({
      where: {
        fornecedor: { fornecedor_id: Not(4) },
      },
      relations: ['fornecedor'],
    });    
  
    console.log(`📦 ${produtos.length} produtos encontrados com fornecedor vinculado.`);
  
    for (const produto of produtos) {
      const fornecedor = produto.fornecedor;
  
      const fornecedorNome = (fornecedor.nome || '').trim();
      const produtoNome = (produto.nome || '').trim();
  
      if (!fornecedorNome || !produtoNome) {
        console.warn(`⚠️ Produto ID ${produto.produto_id} com dados incompletos. Pulando...`);
        continue;
      }
  
      const produtoNomeLower = produtoNome.toLowerCase();
      const fornecedorLower = fornecedorNome.toLowerCase();
  
      if (produtoNomeLower.includes(fornecedorLower)) {
        continue;
      }

      const novoNome = `${produtoNome} ${fornecedorNome}`.trim();
  
      produto.nome = novoNome;
      await this.produtoRepository.save(produto);
  
      console.log(`✅ Produto "${produtoNome}" atualizado → "${novoNome}"`);
    }
  
    console.log('🚀 Correção de nomes de fornecedores concluída com sucesso!');
  }

  async updateTinyProductNames(): Promise<void> {
    console.log('🔄 Iniciando atualização de nomes de produtos no Tiny MG...');
  
    // Busca apenas produtos com tiny_mg válido
    const produtos = await this.produtoRepository.find({
      where: { tiny_mg: Not(IsNull()) },
    });
  
    console.log(`📦 ${produtos.length} produtos encontrados com tiny_mg.`);
  
    const token = await this.tinyAuthService.getAccessToken('MG');
  
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
    for (const produto of produtos) {
      if (!produto.nome || !produto.tiny_mg) {
        console.warn(`⚠️ Produto ID ${produto.produto_id} sem nome ou tiny_mg. Pulando...`);
        continue;
      }
  
      const tinyId = produto.tiny_mg;
      const url = `${this.apiUrlTiny}produtos/${tinyId}`;
  
      // ✅ Estrutura correta para API Tiny
      const body = {
        produto: {
          nome: produto.nome.trim(),
          SKU: produto.codigo,
          ncm: produto.ncm.toString(),
        },
      };
  
      try {
        console.log(`📝 Atualizando produto ID ${produto.produto_id} (Tiny ID ${tinyId})...`);
        console.log('➡️ Corpo da requisição:', JSON.stringify(body));
  
        const response = await this.httpService.axiosRef.put(url, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
  
        if (response.status >= 200 && response.status < 300) {
          console.log(`✅ Produto ${produto.codigo} atualizado com sucesso no Tiny MG: ${produto.nome}`);
        } else {
          console.error(
            `❌ Falha ao atualizar produto ${produto.produto_id} (${produto.nome}).`,
            response.data
          );
        }
  
      } catch (error) {
        // Exibir detalhes completos do erro
        if (error.response) {
          console.error(`💥 Erro ${error.response.status} - ${error.response.statusText}`);
          console.error('📨 Resposta:', JSON.stringify(error.response.data, null, 2));
        } else {
          console.error(`💥 Erro ao atualizar produto ${produto.produto_id} no Tiny MG:`, error.message);
        }
      }
  
      await sleep(2000);
    }
  
    console.log('🚀 Atualização de nomes no Tiny MG concluída com sucesso!');
  }
  
}
