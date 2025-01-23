import { ParcelaCredito } from '../../infrastructure/database/entities';

export interface ICreditsRepository {
  getAllCredits(): Promise<ParcelaCredito[]>;
  getCreditById(id: number): Promise<ParcelaCredito>;
  filterCreditsByDueDate(fromDate?: string, toDate?: string): Promise<ParcelaCredito[]>;
}
