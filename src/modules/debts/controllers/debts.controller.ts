import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
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
  async getAllDebts() {
    return this.debtsService.getAllDebts();
  }

  @ApiOperation({ summary: 'Obter todos os departamentos' })
  @Get('departments')
  async getAllDepartments() {
    return this.debtsService.getAllDepartments();
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
