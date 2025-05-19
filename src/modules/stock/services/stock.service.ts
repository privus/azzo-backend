import { Inject, Injectable } from '@nestjs/common';
import { Estoque } from '../../../infrastructure/database/entities';
import { IProductsRepository, IStockRepository } from '../../../domain/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';

@Injectable()
export class StockService implements IStockRepository {
  private readonly apiUrlTiny: string;
  private readonly nfeTag = 'notas';

  constructor(
    @InjectRepository(Estoque) private readonly stockRepository: Repository<Estoque>,
    @Inject('IProductsRepository') private readonly productRepository: IProductsRepository,
    private readonly httpService: HttpService,
  ) {
    this.apiUrlTiny = process.env.TINY_API_URL;
  }

  async getStock(): Promise<Estoque[]> {
    return this.stockRepository.find({
      relations: ['fornecedor', 'produto', 'saidas'],
    });
  }

  async importStockFromNfeXml(filePath: string, id: number): Promise<string> {
    const xml = fs.readFileSync(filePath, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const json = parser.parse(xml);
  
    const items = json.nfeProc.NFe.infNFe.det;
    const notFoundEAN: string[] = [];
    let importedCount = 0;
  
    for (const item of Array.isArray(items) ? items : [items]) {
      const prod = item.prod;
      let produto;
  
      switch (Number(id)) {
        case 1: // GREEN
          produto = await this.productRepository.findProductByPartialCode(prod.cProd);
          break;
  
        case 2: // VIDAL
        case 3: // VICEROY
          const eanRaw = prod.cBarra ? prod.cBarra : prod.cEAN;
          if (!eanRaw || eanRaw === 'SEM GTIN') {
            throw new Error(`Produto sem EAN/GTIN encontrado na NF`);
          }
          const numeroEan = Number(eanRaw);
          produto = await this.productRepository.findByEan(numeroEan);
          break;
  
        case 4: // H2O
        case 5: // ISPL
          produto = await this.productRepository.findByEan(prod.cEANTrib);
          break;
  
        case 6: // ALL BRANDS
          produto = await this.productRepository.findByEan(prod.cBarraTrib);
          break;
  
        default:
          continue;
      }
  
      if (!produto) {
        notFoundEAN.push(prod.cProd);
        continue;
      }
  
      let unidade = prod.uCom;
      let quantidade = parseFloat(prod.qCom);
      const descricao = prod.xProd;
  
      switch (Number(id)) {
        case 1: // GREEN
          if (unidade === 'DZ') {
            quantidade *= 12;
          }
          break;
  
        case 2: // VIDAL
          const matchVidal = descricao.match(/(?:C\s*\/\s*)?(\d+[.,]?\d*)\s*UND/i);
          if (matchVidal) {
            const und = parseFloat(matchVidal[1].replace(',', '.'));
            quantidade *= und;
          }
          break;
  
        case 3: // VICEROY
          // Mantém quantidade direta do qCom
          break;
  
        case 4: // H2O
        case 5: // ISPL
          quantidade = parseFloat(prod.qTrib);
          break;
  
        case 6: // ALL BRANDS
          const matchAllBrands = descricao.match(/C\s*\/\s*(\d+)\s*UND/i);
          if (matchAllBrands) {
            const und = parseInt(matchAllBrands[1], 10);
            quantidade *= und;
          }
          break;
      }
  
      const estoque = this.stockRepository.create({
        produto,
        quantidade_total: quantidade,
        preco_custo_unitario: parseFloat(prod.vUnCom),
        valor_total: parseFloat(prod.vProd),
        data_entrada: new Date().toISOString(),
        origem: 'NFE_XML',
        numero_nfe: json.nfeProc.NFe.infNFe.ide.nNF,
      });
  
      await this.stockRepository.save(estoque);
      await this.productRepository.incrementStock(produto.produto_id, quantidade);
      importedCount++;
    }
  
    return `Importados ${importedCount} produtos. Não encontrados: ${notFoundEAN.join(', ')}`;
  } 
  
}