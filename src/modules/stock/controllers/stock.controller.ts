import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';

ApiTags('stock')
@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
  ) {}

  @ApiOperation({ summary: 'Obter estoque' })
  @Get()
  async getStock() {
    return this.stockService.getStock();
  }

  @ApiOperation({ summary: 'Inserir estoque por nota fiscal' })
  @Post('insertNf')
  async insertStockByNf(@Body('nf_id') nf_id: number, @Body('fornecedor_id') fornecedor_id: number) {
    return this.stockService.insertStockByNf(nf_id, fornecedor_id);
  }
}