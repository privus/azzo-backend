import { Inject, Injectable } from '@nestjs/common';
import { Distribuidor, Estoque, Fornecedor, Produto } from '../../../infrastructure/database/entities';
import { IProductsRepository, ISellsRepository, IStockRepository } from '../../../domain/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';

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

  async importStockFromNfeXml(filePath: string, typeId: number): Promise<string> {
    const xml = fs.readFileSync(filePath, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const json = parser.parse(xml);
  
    const itensNFe = json.nfeProc.NFe.infNFe.det;
    const produtosNaoEncontrados: string[] = [];
    let quantidadeImportada = 0;
  
    const itens = Array.isArray(itensNFe) ? itensNFe : [itensNFe];
    const dist_type = Number(typeId);
  
    for (const item of itens) {
      const { prod } = item;
      let produto;
  
      // Identificação do produto
      switch (dist_type) {
        case 1: // GREEN
        case 8: // W COSMETICOS
          produto = await this.productRepository.findProductByPartialCode(prod.cProd);
          break;
  
        case 2: // VIDAL
        case 3: // VICEROY
        case 4: // NEW BLACK: busca por EAN se possível, senão usa código parcial
          const codigoParcial = String(prod.cProd).split(',')[0];
          const ean = Number(prod.cBarra || prod.cEAN);
          produto = isNaN(ean)
            ? await this.productRepository.findProductByPartialCode(codigoParcial)
            : await this.productRepository.findByEan(ean);
          break;
  
        case 5: // H2O
        case 6: // ISPL
          produto = await this.productRepository.findByEan(prod.cEANTrib);
          break;
  
        case 7: // ALL BRANDS
          produto = await this.productRepository.findByEan(prod.cBarraTrib);
          break;
  
        default:
          continue;
      }
  
      if (!produto) {
        produtosNaoEncontrados.push(prod.cProd);
        continue;
      }
  
      // Cálculo de quantidade
      let unidade = prod.uCom;
      let quantidade = parseFloat(prod.qCom);
      const descricao = prod.xProd;
  
      switch (dist_type) {
        case 1: // GREEN
          if (unidade === 'DZ') quantidade *= 12;
          break;
  
        case 2: // VIDAL
          const matchVidal = descricao.match(/(?:C\s*\/\s*)?(\d+[.,]?\d*)\s*UND/i);
          if (matchVidal) quantidade *= parseFloat(matchVidal[1].replace(',', '.'));
          break;
  
        case 4: // NEW BLACK
          if (unidade === 'CX') quantidade *= 12;
          break;
  
        case 5: // H2O
        case 6: // ISPL
          quantidade = parseFloat(prod.qTrib);
          break;
  
        case 7: // ALL BRANDS
          const matchAll = descricao.match(/C\s*\/\s*(\d+)\s*UND/i);
          if (matchAll) quantidade *= parseInt(matchAll[1], 10);
          break;
  
        // VICEROY e W COSMETICOS mantêm a quantidade direta
      }
      const marca_id = produto.fornecedor.fornecedor_id;
      const fornecedor = await this.fornecedorRepository.findOne({ where: { fornecedor_id: marca_id }});
      const distribuidor = await this.distribuidorRepository.findOne({ where: { distribuidor_id: dist_type }});
      // Registro no estoque
      const estoque = this.stockRepository.create({
        produto,
        quantidade_total: quantidade,
        preco_custo_unitario: parseFloat(prod.vUnCom),
        valor_total: parseFloat(prod.vProd),
        data_entrada: new Date().toISOString(),
        origem: 'NFE_XML',
        numero_nfe: json.nfeProc.NFe.infNFe.ide.nNF,
        fornecedor,
        distribuidor,
      });
  
      await this.stockRepository.save(estoque);
      await this.productRepository.incrementStock(produto.produto_id, quantidade);
      quantidadeImportada++;
    }
  
    return `Importados ${quantidadeImportada} produtos. Não encontrados: ${produtosNaoEncontrados.join(', ')}`;
  }

  async projectStockInUnits(): Promise<Record<string, number>> {
    const statusVendaIds = [11139, 11138];
    const vendas = await this.sellRepository.getSellsByStatus(statusVendaIds);
  
    const unidadesVendidas: Record<string, number> = {};
  
    for (const venda of vendas) {
      for (const item of venda.itensVenda) {
        const produto = item.produto;
        if (!produto || !produto.codigo) continue;
  
        const produtoUnidade = await this.productRepository.findProductByPartialCode(produto.codigo);
        if (!produtoUnidade || !produtoUnidade.codigo) continue;
  
        const descricao = produto.descricao_uni || '';
        const match = descricao.match(/CAIXA\s*C\/\s*(\d+)\s*UNIDADES/i);
        console.log('match ===========>', match);
        console.log('produtoUnidade ===========>', produtoUnidade);
  
        const codigoUnidade = produtoUnidade.codigo;
        if (!unidadesVendidas[codigoUnidade]) {
          unidadesVendidas[codigoUnidade] = 0;
        }
  
        if (match) {
          const unidadeMultiplicador = parseInt(match[1], 10);
          unidadesVendidas[codigoUnidade] += Number(item.quantidade) * unidadeMultiplicador;
        } else {
          unidadesVendidas[codigoUnidade] += Number(item.quantidade);
        }
      }
    }
  
    return unidadesVendidas;
  } 
  
}