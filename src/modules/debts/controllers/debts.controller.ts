import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DebtsService } from '../services/debts.service';
import { DebtsDto } from '../dto/debts.dto';
import { UpdateInstalmentDto } from '../dto/update-instalment.dto';
import { UpdateDebtStatusDto } from '../dto';

@ApiTags('debts')
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @ApiOperation({ summary: 'Obter todos os débitos' })
  @Get()
  async getAllDebts(@Query('company') companyId: number, @Query('fromDate') fromDate?: string) {
    return this.debtsService.getDebtsByDate(companyId, fromDate);
  }

  @ApiOperation({ summary: 'Obter débitos entre datas' })
  @Get('between')
  async getDebtsBetweenDates(@Query('company') companyId: number, @Query('fromDate') fromDate: string, @Query('toDate') toDate?: string) {
    return this.debtsService.getDebtsBetweenDates(companyId, fromDate, toDate);
  }
  DebtsComparisonReport
  @ApiOperation({ summary: 'Obter todos os departamentos' })
  @Get('departments')
  async getAllDepartments() {
    return this.debtsService.getAllDepartments();
  }

  @ApiOperation({ summary: 'Relatorio de despesas do mês atual com percetual' })
  @Get('debtsReport')
  async getDebtsComparison(@Query('fromDate1') fromDate1: string, @Query('toDate1') toDate1: string, @Query('fromDate2') fromDate2: string, @Query('toDate2') toDate2: string) {
    return this.debtsService.performanceDebtsPeriods(fromDate1, toDate1, fromDate2, toDate2);
  }

  @ApiOperation({ summary: 'Obter todas as categorias' })
  @Get('categories')
  async getAllCategories() {
    return this.debtsService.getAllCategories();
  }

  @ApiOperation({ summary: 'Atualizar status de uma parcela' })
  @Patch('installment')
  async updateInstalmentStatus(@Body() updateInstalmentDto: UpdateInstalmentDto) {
    const resultMessage = await this.debtsService.updateInstalmentStatus(updateInstalmentDto);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Obter parcelas de um débito' })
  @Get('associedCompany')  
  async updateDebts() {
    return this.debtsService.alignDebitCompany();
  }

  @ApiOperation({ summary: 'Obter todas contas por Empresa' })
  @Get('accounts/:id')
  async getAccoutsAzzo(@Param('id') id: number) {
    return this.debtsService.findAccountByCompanyId(id);
  }

  @ApiOperation({ summary: 'Excluir debito e suas parcelas' })
  @Delete(':id')
  async deleteSell(@Param('id') id: number) {
    const resultMessage = await this.debtsService.deleteDebt(id);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Obter débito por ID' })
  @Get(':id')
  async getDebtById(@Param('id') id: number) {
    return this.debtsService.getDebtById(id);
  }

  @ApiOperation({ summary: 'Cadastrar um novo débito' })
  @Post()
  async create(@Body() debtDto: DebtsDto) {
    return this.debtsService.createDebt(debtDto);
  }

  @ApiOperation({ summary: 'Atualizar status de um débito' })
  @Patch('status')
  async updateDebtStatus(@Body() updateStatusDto: UpdateDebtStatusDto) {
    const resultMessage = await this.debtsService.updateDebtStatus(updateStatusDto);
    return { message: resultMessage };
  }

}
