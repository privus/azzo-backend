import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegionsService } from '../services/regions.service';

@ApiTags('regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @ApiOperation({ summary: 'Obter todas as regiões' })
  @Get()
  async getAllRegions() {
    return this.regionsService.getAllRegions();
  }

  @ApiOperation({ summary: 'Obter região por ID' })
  @Get(':id')
  async getRegionById(@Param('id') id: number) {
    return this.regionsService.getRegionById(id);
  }

  @ApiOperation({ summary: 'Obter região por ID com informações adicionais' })
  @Get(':id/info')
  async getRegionAllInfoById(@Param('id') id: number) {
    return this.regionsService.getRegionAllInfoById(id);
  }

  @ApiOperation({ summary: 'Obter vendas por região a partir de uma data' })
  @Get(':id/sells')
  async getSellsByRegion(
    @Param('id') id: number,
    @Query('fromDate') fromDate?: string, // Parâmetro de query opcional
  ) {
    // Caso deseje, você pode validar o formato da data aqui.
    return this.regionsService.getSellsByRegion(id, fromDate);
  }
}
