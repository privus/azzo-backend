import { Estoque } from '../../infrastructure/database/entities';

export interface IStockRepository {
  getStock(): Promise<Estoque[]>;
}