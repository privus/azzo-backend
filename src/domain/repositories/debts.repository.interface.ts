import { Debito, Departamento, CategoriaDebito, Account } from '../../infrastructure/database/entities';
import { DebtsDto, UpdateInstalmentDto, DebtsComparisonReport, UpdateDebtStatusDto, GrupoCompensacaoReport } from '../../modules/debts/dto';

export interface IDebtsRepository {
  createDebt(debtDto: DebtsDto): Promise<Debito>;
  getAllDepartments(): Promise<Departamento[]>;
  getAllCategories(): Promise<CategoriaDebito[]>;
  getDebtById(id: number): Promise<Debito>;
  updateInstalmentStatus(dto: UpdateInstalmentDto): Promise<string>;
  updateDebtStatus(dto: UpdateDebtStatusDto): Promise<string>;
  deleteDebt(code: number): Promise<string>;
  getDebtsByDate(companyId: number, fromDate?: string): Promise<Debito[]>;
  getDebtsBetweenDates(companyId: number, fromDate: string, toDate?: string): Promise<Debito[]>;
  performanceDebtsPeriods(
    fromDate1: string,
    toDate1: string,
    fromDate2: string,
    toDate2: string,
    conpany_id: number,
  ): Promise<DebtsComparisonReport>;
  findAccountByCompanyId(company_id: number): Promise<Account[]>;
  alignDebitCompany(): Promise<void>;
  seedAccounts(): Promise<void>;
  associateParcelsToDebitAccount(): Promise<void>;
  balanceDebtsPrivus(fromDate: string, toDate: string): Promise<GrupoCompensacaoReport>;
  associeteParcelaToAccount(): Promise<void>;
  importDebitosFromJson(): Promise<string>;
  createDebtFromNfeXml(debtDto: DebtsDto, duplicatas: any[]): Promise<Debito>;
}
