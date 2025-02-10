import { Regiao } from '../../infrastructure/database/entities';

export interface IRegionsRepository {
  getAllRegions(): Promise<Regiao[]>;
  getRegionById(id: number): Promise<Regiao>;
  getSellsByRegion(id: number, fromDate?: string): Promise<Regiao>;
  getRegionByCode(codigo: number): Promise<Regiao>;
}
