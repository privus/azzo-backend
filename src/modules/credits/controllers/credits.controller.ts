import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreditsService } from '../services/credits.service';
import { UpdateInstalmentDto, CreditDto } from '../dto';

@ApiTags('credits')
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @ApiOperation({ summary: 'Obter todos os créditos' })
  @Get()
  async getAllCredits() {
    return this.creditsService.getAllCredits();
  }

  @ApiOperation({ summary: 'cria um novo crédito' })
  @Post()
  async create(@Body() creditDto: CreditDto) {
    return this.creditsService.createCredit(creditDto);
  }

  @ApiOperation({ summary: 'Obter categoria de crédito' })
  @Get('categories')
  async getAllCategories() {
    return this.creditsService.getAllCategories();
  }

  @ApiOperation({ summary: 'Atualizar status de uma Instalment' })
  @Patch('installment')
  async updateInstalmentStatus(@Body() updateInstalmentDto: UpdateInstalmentDto) {
    const resultMessage = await this.creditsService.updateInstalmentStatus(updateInstalmentDto);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Obter crédito por Data' })
  @Get('date')
  async getCreditByDate(@Query('fromDate') fromDate?: string, @Query('toDate') toDate?: string) {
    return this.creditsService.filterCreditsByDueDate(fromDate, toDate);
  }
  
  @ApiOperation({ summary: 'Obter crédito por ID' })
  @Get(':id')
  async getCreditById(@Param('id') id: number) {
    return this.creditsService.getCreditById(id);
  }
}
