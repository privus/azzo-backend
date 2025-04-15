import { Venda } from '../../infrastructure/database/entities';
import { RakingSellsResponse, UpdateSellStatusDto } from '../../modules/sells/dto';

export interface ISellsRepository {
  syncroSells(): Promise<string>;
  sellsByDate(fromDate?: string): Promise<Venda[]>;
  getSellById(id: number): Promise<Venda>;
  exportTiny(id: number): Promise<string>;
  updateSellStatus(UpdateSellStatusDto: UpdateSellStatusDto): Promise<string>;
  deleteSell(id: number): Promise<string>;
  getDailyRakingSells(): Promise<RakingSellsResponse>;
  addVolumeSell(id: number, volume: number): Promise<string>;
  performanceSalesPeriods(
    fromDate: string,
    toDate: string,
    fromDate2: string,
    toDate2: string,
  ): Promise<SalesComparisonReport>;
}
