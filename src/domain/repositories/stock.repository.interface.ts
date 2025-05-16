import { Estoque } from '../../infrastructure/database/entities';

export interface IStockRepository {
  getStock(): Promise<Estoque[]>;
  insertStockByNf(nf_id: number, fornecedor_id: number): Promise<string>;
//   getStockByProductId(id: number): Promise<Estoque>;
//   updateStock(id: number, quantidade: number): Promise<string>;
}