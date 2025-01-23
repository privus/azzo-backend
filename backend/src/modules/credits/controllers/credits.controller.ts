import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreditsService } from '../services/credits.service';

@ApiTags('credits')
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @ApiOperation({ summary: 'Obter todos os créditos' })
  @Get()
  async getAllCredits() {
    return this.creditsService.getAllCredits();
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
