import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DebtsService } from '../services/debts.service';
import { DebtsDto } from '../dto/debts.dto';

@ApiTags('debts')
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @ApiOperation({ summary: 'Obter todos os débitos' })
  @Get()
  async getAllDebts() {
    return this.debtsService.getAllDebts();
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
}
