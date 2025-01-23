import { Controller, Get, Param } from '@nestjs/common';
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

  @ApiOperation({ summary: 'Obter crédito por ID' })
  @Get(':id')
  async getCreditById(@Param('id') id: number) {
    return this.creditsService.getCreditById(id);
  }
}
