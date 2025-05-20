import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

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

  @Post('upload/:id')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/xml',
      filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
      },
    }),
  }))
  async uploadNfeFile(@Param('id') id: number, @UploadedFile() file: Express.Multer.File): Promise<string> {
    return this.stockService.importStockFromNfeXml(file.path, id);
  }

}