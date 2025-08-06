import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { Distribuidor, Estoque, Fornecedor, Produto, SaidaEstoque } from '../../../infrastructure/database/entities';
import { IDebtsRepository, IProductsRepository, ISellsRepository, IStockRepository } from '../../../domain/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import { StockImportResponse, StockLiquid } from '../dto';
import { StockOutDto } from '../dto/stock-out.dto';
import { DebtsDto } from 'src/modules/debts/dto';


@Injectable()
export class StockService implements IStockRepository {
  constructor(
    @InjectRepository(Estoque) private readonly stockRepository: Repository<Estoque>,
    @InjectRepository(Fornecedor) private readonly fornecedorRepository: Repository<Fornecedor>,
    @InjectRepository(Distribuidor) private readonly distribuidorRepository: Repository<Distribuidor>,
    @Inject('IProductsRepository') private readonly productRepository: IProductsRepository,
    @Inject('ISellsRepository') private readonly sellRepository: ISellsRepository,
    @InjectRepository(SaidaEstoque) private readonly saidaRepository: Repository<SaidaEstoque>,
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @Inject('IDebtsRepository') private readonly debtsService: IDebtsRepository,
  ) {}

  async getStock(): Promise<Estoque[]> {
    return this.stockRepository.find({relations: ['fornecedor', 'produto', 'saidas']});
  }

  async importStockFromNfeXml(filePath: string, typeId: number): Promise<StockImportResponse> {
    const xml = fs.readFileSync(filePath, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const json = parser.parse(xml);
  
    const itensNFe = json.nfeProc.NFe.infNFe.det;
    const produtosNaoEncontrados: string[] = [];
    let quantidadeImportada = 0;
    const produtosImportados: {
      codigo: string,
      nome: string,
      valor: number,
      quantidade: number,
      quantidadeCx: number
    }[] = [];
    const info = json.nfeProc.NFe.infNFe;
    const emitente = info.emit;
    const ide = info.ide;
    const valorNf = info.total.ICMSTot.vNF; 
    const numero_nfe = json.nfeProc.NFe.infNFe.ide.nNF
    const debito = info.cobr
    const nomeFornecedor = info.emit.xFant

    
    const existente = await this.stockRepository.findOne({
      where: { numero_nfe: numero_nfe, origem: 'NFE_XML' },
    });

    if (existente) {
      throw new ConflictException(`NF-e ${numero_nfe} já importada anteriormente.`);
    }   
  
    const itens = Array.isArray(itensNFe) ? itensNFe : [itensNFe];
    const dist_type = Number(typeId);
  
    for (const item of itens) {
      const { prod } = item;
      const { nItem } = item;
      let produtos: Produto[] | undefined;
  
      switch (dist_type) {
        case 1: // GREEN
        case 7: // W COSMETICOS
          produtos = await this.productRepository.findProductByPartialCode(prod.cProd);
          break;
        case 2: // VIDAL
        case 3: // VICEROY / ABSOLUTA
        case 4: // NEW BLACK: busca por EAN se possível, senão usa código parcial
          const cod = String(prod.cProd).split(',')[0];
          const ean = Number(prod.cBarra || prod.cEAN);
          produtos = isNaN(ean)
            ? await this.productRepository.findProductByPartialCode(cod)
            : await this.productRepository.findByEan(ean);
          break;
        case 5: // H2O // ISPL // IPC
          produtos = await this.productRepository.findByEan(prod.cEANTrib);
          break;
        case 6: // ALL BRANDS
          produtos = await this.productRepository.findByEan(prod.cBarraTrib);
          break;
          case 8: // TEK SUL 
          const eanTek = Number(prod.cProd);

          if (nItem === 1) {
            const p = await this.productRepository.findProductById(492);
            produtos = p ? [p] : [];
          } else if (nItem === 2) {
            const p = await this.productRepository.findProductById(501);
            produtos = p ? [p] : [];
          } else { 
            produtos = await this.productRepository.findByEan(eanTek) || [];
          }
          break;

        default:
          continue;
      }
  
      if (!produtos || produtos.length === 0) {
        produtosNaoEncontrados.push(prod.cProd);
        continue;
      }
  
      const caixa = produtos.find(p => p.qt_uni !== null);
      const unidade = produtos.find(p => p.qt_uni === null);
      const produtoFinal = unidade ?? caixa;
  
      if (!produtoFinal) {
        produtosNaoEncontrados.push(prod.cProd);
        continue;
      }
  
      let quantidade = 0;
      const qtdBase = ['5'].includes(dist_type.toString()) ? prod.qTrib : prod.qCom;

      quantidade = parseFloat(qtdBase);
      const quantidadeCx = parseFloat(qtdBase);

  
      // Multiplica pela qt_uni apenas se ambos forem encontrados (caixa + unidade)
      // e o distribuidor **não for** W COSMETICOS (case 7)
      if (produtos.length > 1 && caixa && unidade && dist_type !== 7 && dist_type !== 5) {
        quantidade *= caixa.qt_uni;
      }      
  
      const fornecedor = await this.fornecedorRepository.findOne({
        where: { fornecedor_id: produtoFinal.fornecedor.fornecedor_id }
      });
  
      const distribuidor = await this.distribuidorRepository.findOne({
        where: { distribuidor_id: dist_type }
      });
  
      const estoque = this.stockRepository.create({
        produto: produtoFinal,
        quantidade_total: quantidade,
        preco_custo_unitario: parseFloat(prod.vUnCom),
        valor_total: parseFloat(prod.vProd),
        data_entrada: new Date().toISOString(),
        origem: 'NFE_XML',
        numero_nfe,
        fornecedor,
        distribuidor,
      });
  
      await this.stockRepository.save(estoque);
      produtosImportados.push({
        codigo: produtoFinal.codigo,
        nome: produtoFinal.nome,
        valor: parseFloat(prod.vProd),
        quantidade,
        quantidadeCx,
      });
      
       
      await this.productRepository.incrementStock(produtoFinal.produto_id, quantidade);

      // ATIVAR UNIDADE E CAIXA (se existirem)
      if (unidade) {
        await this.productRepository.activeProducts(unidade.sellent_id);
      }
      if (caixa) {
        await this.productRepository.activeProducts(caixa.sellent_id);
      }
      quantidadeImportada++;
    }

    let debitoCriado = null;
    if (debito && debito.fat && debito.dup) {
      const debtsDto: DebtsDto = {
        nome: `${nomeFornecedor} NF-e ${numero_nfe}`,
        descricao: `Débito gerado automaticamente pela NF-e ${numero_nfe}`,
        valor_total: parseFloat(debito.fat.vOrig),
        data_competencia: ide.dhEmi || ide.dEmi,
        data_vencimento: Array.isArray(debito.dup) ? debito.dup[0].dVenc : debito.dup.dVenc,
        numero_parcelas: Array.isArray(debito.dup) ? debito.dup.length : 1,
        company_id: 2,
        user_company_id: 2,
        departamento_id: 2,
        categoria_id: 14,
        criado_por: 'geecom@azzo.com',
        account_id: 3,
        tipo: 'CUSTO',
      };

      // **Chama o serviço de débitos para criar o débito e as parcelas**
      debitoCriado = await this.debtsService.createDebtFromNfeXml(debtsDto, debito.dup);
    }
    
      return {
        numero_nf: ide.nNF,
        data_emissao: ide.dhEmi || ide.dEmi,
        emitente: `${emitente.xNome} (CNPJ: ${emitente.CNPJ})`,
        valor: valorNf,
        qtd_itens: quantidadeImportada,
        produtos_nao_encontrados: produtosNaoEncontrados.length ? produtosNaoEncontrados.join(', ') : 'Nenhum',
        produtos: produtosImportados.map(p => ({
          codigo: p.codigo,
          nome: p.nome,
          qt_caixa: p.quantidadeCx,
          quantidade: p.quantidade,
          valor_total: p.valor,
        })),
        debito: debitoCriado ? { debito_id: debitoCriado.debito_id, nome: debitoCriado.nome, valor_total: debitoCriado.valor_total, numero_parcelas: debitoCriado.numero_parcelas } : null,
      };
         
  }

  async getStockLiquid(): Promise<StockLiquid[]> {
    const statusVendaIds = [11139, 11138];
    const vendas = await this.sellRepository.getSellsByStatus(statusVendaIds);
  
    const vendasMap = new Map<number, { produto: Produto; quantidadeVendida: number }>();
  
    for (const venda of vendas) {
      for (const item of venda.itensVenda) {
        const produto = item.produto;
        const baseProduto = produto.unidade ?? produto;
        const produtoId = baseProduto.produto_id;
  
        const qtVenda = produto.unidade && produto.qt_uni
          ? item.quantidade * produto.qt_uni
          : item.quantidade;
  
        if (!vendasMap.has(produtoId)) {
          vendasMap.set(produtoId, { produto: baseProduto, quantidadeVendida: 0 });
        }
  
        vendasMap.get(produtoId)!.quantidadeVendida += qtVenda;
      }
    }
  
    const results = [];
    for (const { produto, quantidadeVendida } of vendasMap.values()) {
      const saldoEstoque = produto.saldo_estoque;
      const estoqueLiquido = saldoEstoque - quantidadeVendida; 
      results.push({
        codigo: produto.codigo,
        quantidadeVendida,
        saldo_estoque: saldoEstoque,
        estoqueLiquido,
        ean: +produto.ean,
      });
    }  
    return results;
  }

  findAllDistributors(): Promise<Distribuidor[]> {
    return this.distribuidorRepository.find();
  }
  
  async updateStockFromJson(): Promise<string> {
    const jsonFilePath = 'src/utils/contagem-estoque-julho.json';
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Arquivo '${jsonFilePath}' não encontrado.`);
      return;
    }
  
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const estoqueData: { produto_id: number; saldo_estoque: number }[] = JSON.parse(jsonData);
  
    for (const item of estoqueData) {
      const produto = await this.productRepository.findProductById(item.produto_id);
      if (!produto) {
        console.warn(`Produto com ID ${item.produto_id} não encontrado.`);
        continue;
      }
  
      produto.saldo_estoque = item.saldo_estoque === null ? 0 : item.saldo_estoque;
      await this.productRepository.saveProduct(produto);
    }
  
    return '✅ Estoque atualizado com sucesso.';
  }

  async getStockOut(out: StockOutDto): Promise<string> {
    const { produtos, observacao } = out;
  
    let totalUnidadesSaidas = 0;
  
    for (const item of produtos) {
      const produto = await this.productRepository.findProductById(item.produto_id);
      if (!produto) {
        throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
      }
      let quantidadeEmUnidadesBase = Number(item.quantidade);
      if (produto.qt_uni && produto.unidade) {
        quantidadeEmUnidadesBase *= produto.qt_uni;
      }    
  
      totalUnidadesSaidas += quantidadeEmUnidadesBase;
  
      await this.produtoRepository.decrement({ produto_id: produto.produto_id }, 'saldo_estoque', quantidadeEmUnidadesBase);
  
      const saida = this.saidaRepository.create({
        quantidade: item.quantidade,
        produto,
        observacao,
      });
  
      await this.saidaRepository.save(saida);
    }
  
    return `Saída de estoque realizada com sucesso. Total de unidades: ${totalUnidadesSaidas}.`;
  }

  async findProductOut(id: number): Promise<SaidaEstoque[]> {
    return await this.saidaRepository.find({
      where: { produto: { produto_id: id } },
      order: { data_saida: 'DESC' },  
      take: 30,
    });
  }

  async getCestByXmlBuffer(buffer: Buffer): Promise<{ message: string, updated: number, notFound: string[] }> {
    const xml = buffer.toString('utf-8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const json = parser.parse(xml);

    const itensNFe = json.nfeProc?.NFe?.infNFe?.det;
    const itens = Array.isArray(itensNFe) ? itensNFe : [itensNFe];

    let updated = 0;
    const notFound: string[] = [];

    for (const item of itens) {
      const { prod } = item;
      if (!prod?.cEAN || !prod?.CEST) continue;
      const produtos = await this.productRepository.findByEan(prod.cEAN);
      const produto = produtos?.[0];
      if (produto) {
        produto.cest = prod.CEST;
        await this.productRepository.saveProduct(produto);
        updated++;
      } else {
        notFound.push(prod.cEAN);
      }
    }

    return {
      message: `CEST atualizado em ${updated} produto(s).`,
      updated,
      notFound,
    };
  }
}