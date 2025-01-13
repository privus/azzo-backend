import { Venda } from '../../infrastructure/database/entities';

export interface ISellsRepository {
  syncroSells(): Promise<void>;
  sellsByDate(fromDate?: string): Promise<Venda[]>;
  getSellById(id: number): Promise<Venda>;
}
