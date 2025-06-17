import { Inject, Injectable } from '@nestjs/common';
import { Distribuidor, Estoque, Fornecedor, Produto } from '../../../infrastructure/database/entities';
import { IProductsRepository, ISellsRepository, IStockRepository } from '../../../domain/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import { StockImportResponse, StockLiquid } from '../dto';
import e from 'express';

@Injectable()
export class StockService implements IStockRepository {
  private readonly apiUrlTiny: string;
  private readonly nfeTag = 'notas';

  constructor(
    @InjectRepository(Estoque) private readonly stockRepository: Repository<Estoque>,
    @InjectRepository(Fornecedor) private readonly fornecedorRepository: Repository<Fornecedor>,
    @InjectRepository(Distribuidor) private readonly distribuidorRepository: Repository<Distribuidor>,
    @Inject('IProductsRepository') private readonly productRepository: IProductsRepository,
    @Inject('ISellsRepository') private readonly sellRepository: ISellsRepository,
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
    
    const existente = await this.stockRepository.findOne({
      where: { numero_nfe: numero_nfe, origem: 'NFE_XML' },
    });
    
    if (existente) {
      throw new Error(`A NFE número ${numero_nfe} já foi importada anteriormente.`);
    }
  
    const itens = Array.isArray(itensNFe) ? itensNFe : [itensNFe];
    const dist_type = Number(typeId);
  
    for (const item of itens) {
      const { prod } = item;
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
      quantidadeImportada++;
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
        }))
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
  
}