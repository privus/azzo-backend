import { Venda } from '../../infrastructure/database/entities';
import { UpdateSellStatusDto } from '../../modules/sells/dto';

export interface ISellsRepository {
  syncroSells(): Promise<string>;
  sellsByDate(fromDate?: string): Promise<Venda[]>;
  getSellById(id: number): Promise<Venda>;
  exportTiny(id: number): Promise<string>;
  updateSellStatus(UpdateSellStatusDto: UpdateSellStatusDto): Promise<string>;
}
