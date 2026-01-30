import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Like, Not, Repository, Raw } from 'typeorm';
import { CategoriaProduto, Fornecedor, Produto, ItensVenda, Comissions } from '../../../infrastructure/database/entities';
import { ProdutoAPIResponse, UpdateProductDto, ProductRankingItem } from '../dto';
import { IProductsRepository } from '../../../domain/repositories';
import * as fs from 'fs';

@Injectable()
export class ProductsService implements IProductsRepository {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly productTag = 'products';
  photoUrl: string;

  constructor(
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(CategoriaProduto) private readonly categoriaRepository: Repository<CategoriaProduto>,
    @InjectRepository(Fornecedor) private readonly fornecedorRepository: Repository<Fornecedor>,
    @InjectRepository(ItensVenda) private readonly itensVendaRepository: Repository<ItensVenda>,
    @InjectRepository(Comissions) private readonly commissionsRepository: Repository<Comissions>,
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
      const codigo = item['codigo'];
      const preco = item['preco'];
  
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

  async getProductRanking(
    fromDate?: string,
    toDate?: string,
    limit: number = 100
  ): Promise<ProductRankingItem[]> {
    // === 1️⃣ Determina intervalo atual ===
    const from = fromDate ? new Date(fromDate) : new Date();
    const to = toDate ? new Date(toDate) : new Date();
  
    if (!fromDate && !toDate) {
      from.setDate(1);
      to.setMonth(to.getMonth() + 1);
      to.setDate(0);
    }
  
    // === 2️⃣ Calcula período anterior ===
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - diffDays);
  
    const format = (d: Date) => d.toISOString().slice(0, 10);
    const currFrom = format(from);
    const currTo = format(to);
    const lastFrom = format(prevFrom);
    const lastTo = format(prevTo);
  
    // === 3️⃣ Query para o período atual (ordenar por faturamento) ===
    const current = await this.itensVendaRepository
      .createQueryBuilder('itensVenda')
      .leftJoin('itensVenda.produto', 'produto')
      .leftJoin('produto.unidade', 'unidade')
      .leftJoin('produto.fornecedor', 'fornecedor')
      .leftJoin('itensVenda.venda', 'venda')
      .select([
        `COALESCE(unidade.produto_id, produto.produto_id) AS produto_id`,
        `COALESCE(unidade.codigo, produto.codigo) AS codigo`,
        `COALESCE(unidade.nome, produto.nome) AS nome`,
        `COALESCE(unidade.fotoUrl, produto.fotoUrl) AS fotoUrl`,
        `SUM(itensVenda.quantidade * COALESCE(produto.qt_uni, 1)) AS quantidade_vendida`,
        `SUM(itensVenda.valor_total) AS valor_total_vendido`,
        `fornecedor.nome AS fornecedor`,
      ])
      .where('DATE(venda.data_criacao) BETWEEN :from AND :to', {
        from: currFrom,
        to: currTo,
      })
      .groupBy(`COALESCE(unidade.produto_id, produto.produto_id)`)
      .addGroupBy(`COALESCE(unidade.codigo, produto.codigo)`)
      .addGroupBy(`COALESCE(unidade.nome, produto.nome)`)
      .addGroupBy(`COALESCE(unidade.fotoUrl, produto.fotoUrl)`)
      .addGroupBy(`fornecedor.nome`)
      .orderBy('valor_total_vendido', 'DESC') // ✅ ordena por faturamento
      .limit(limit)
      .getRawMany();
  
    // === 4️⃣ Query para o período anterior ===
    const previous = await this.itensVendaRepository
      .createQueryBuilder('itensVenda')
      .leftJoin('itensVenda.produto', 'produto')
      .leftJoin('produto.unidade', 'unidade')
      .leftJoin('itensVenda.venda', 'venda')
      .select([
        `COALESCE(unidade.produto_id, produto.produto_id) AS produto_id`,
        `SUM(itensVenda.valor_total) AS valor_total_vendido`,
      ])
      .where('DATE(venda.data_criacao) BETWEEN :from AND :to', {
        from: lastFrom,
        to: lastTo,
      })
      .groupBy(`COALESCE(unidade.produto_id, produto.produto_id)`)
      .getRawMany();
  
    // === 5️⃣ Monta mapa de comparação (por faturamento) ===
    const prevMap = new Map<number, number>();
    for (const p of previous) {
      prevMap.set(Number(p.produto_id), Number(p.valor_total_vendido));
    }
  
    // === 6️⃣ Calcula variação e retorna ===
    const ranking: ProductRankingItem[] = current.map((r) => {
      const produtoId = Number(r.produto_id);
      const atual = Number(r.valor_total_vendido);
      const anterior = prevMap.get(produtoId) || 0;
  
      let variacao = 0;
      if (anterior === 0 && atual > 0) variacao = 100;
      else if (anterior > 0) variacao = ((atual - anterior) / anterior) * 100;
  
      let direcao: 'aumento' | 'queda' | 'neutro' = 'neutro';
      if (variacao > 5) direcao = 'aumento';
      else if (variacao < -5) direcao = 'queda';
  
      return {
        produto_id: produtoId,
        codigo: r.codigo,
        nome: r.nome,
        quantidade_vendida: Number(r.quantidade_vendida),
        valor_total_vendido: atual,
        fornecedor: r.fornecedor,
        fotoUrl: r.fotoUrl || null,
        variacao_percentual: Number(variacao.toFixed(2)),
        direcao,
      };
    });
  
    return ranking;
  }
  
  async seedComissionsTable(): Promise<void> {
    const jsonFilePath = 'src/utils/tabela-padrao.json';
  
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Arquivo '${jsonFilePath}' não encontrado.`);
      return;
    }
  
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const comissionData = JSON.parse(jsonData);
  
    console.log(`🔄 Iniciando seed da tabela Comissions com ${comissionData.length} registros...`);
  
    for (const item of comissionData) {
      const codigo = item['codigo'];
      const percentual = item['percentual'];
  
      if (!codigo || percentual === undefined) {
        console.warn(`⚠️ Registro inválido: ${JSON.stringify(item)}`);
        continue;
      }
      const novaComissao = this.commissionsRepository.create({
        codigo,
        percentual: Number(percentual),
      });
      await this.commissionsRepository.save(novaComissao);
      console.log(`✅ Nova comissão adicionada: ${codigo} → ${percentual}%`);
    }
  
    console.log('🚀 Seed da tabela Comissions concluído com sucesso!');
  } 
}
