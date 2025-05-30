import { Venda } from '../../infrastructure/database/entities';
import {
  RakingSellsResponse,
  SalesComparisonReport,
  UpdateSellStatusDto,
  BrandSales,
  ReportBrandPositivity,
  PositivityResponse,
  Commissions
} from '../../modules/sells/dto';

export interface ISellsRepository {
  syncroSells(): Promise<string>;
  syncroStatusSells(): Promise<void>;
  sellsByDate(fromDate?: string): Promise<Venda[]>;
  sellsBetweenDates(fromDate: string, toDate?: string): Promise<Venda[]>;
  getSellByCode(id: number): Promise<Venda>;
  exportTiny(id: number): Promise<string>;
  updateSellStatus(UpdateSellStatusDto: UpdateSellStatusDto): Promise<string>;
  deleteSell(id: number): Promise<string>;
  getDailyRakingSells(): Promise<RakingSellsResponse>;
  addVolumeSell(id: number, volume: number): Promise<string>;
  performanceSalesPeriods(fromDate: string, toDate: string, fromDate2: string, toDate2: string): Promise<SalesComparisonReport>;
  reportBrandSalesBySeller(fromDate: string, toDate?: string): Promise<BrandSales>;
  reportPositivityByBrand(fromDate: string, toDate?: string): Promise<ReportBrandPositivity>;
  getPositivityAzzo(fromDate: string, toDate: string): Promise<PositivityResponse>;
  commissionBySeller(fromDate: string, toDate?: string): Promise<Commissions[]>;
  syncroTinyInvoiceNf(): Promise<string>;
  reportUniqueEanBySegment(): Promise<Record<string, { totalVendas: number, faturamento: number, fornecedores: Record<string, { uniqueEansCount: number, margem: number, participacao: number }> }>>;
  reportSalesByBrandAndProduct(): Promise<Record<string, Record<string, { quantidade: number; valor: number }>>>;
  updateStatusSellentt(id: number, status_id: number): Promise<void>;
  saveSell(venda: Venda): Promise<void>;
  getSellsByStatus(statusIds: number[]): Promise<Venda[]> 
}
