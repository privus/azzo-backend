import { StockImportResponse, StockLiquid } from 'src/modules/stock/dto';
import { Distribuidor, Estoque, Venda } from '../../infrastructure/database/entities';

export interface IStockRepository {
  getStock(): Promise<Estoque[]>;
  getStock(): Promise<Estoque[]>;
  importStockFromNfeXml(filePath: string, typeId: number): Promise<StockImportResponse>;
  getStockLiquid(): Promise<StockLiquid[]>;
  findAllDistributors(): Promise<Distribuidor[]>;
}