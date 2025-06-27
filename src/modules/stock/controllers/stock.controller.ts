import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Distribuidor, Produto } from '../../../infrastructure/database/entities';
import { StockImportResponse, StockLiquid } from '../dto';

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

  @ApiOperation({ summary: 'Importar estoque de NFe XML' })
  @Post('upload/:id')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/xml',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }),
  }))
  async uploadNfeFile(@Param('id') id: number, @UploadedFile() file: Express.Multer.File): Promise<StockImportResponse> {
    return this.stockService.importStockFromNfeXml(file.path, id);
  }

  @ApiOperation({ summary: 'Obter estoque liquído' })
  @Get('liquid')
  async getEstoqueLiquido(): Promise<StockLiquid[]> {
    return this.stockService.getStockLiquid()
  }

  @ApiOperation({ summary: 'Obter distribuidores' })
  @Get('dist')
  async getDistribuidores(): Promise<Distribuidor[]> {
    return this.stockService.findAllDistributors();
  }

  @ApiOperation({ summary: 'update estoque'})
  @Post('update-stock')
  async updateStock(): Promise<string> {
    return this.stockService.updateStockFromJson();
  }

}