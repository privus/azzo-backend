import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Distribuidor, Produto, SaidaEstoque } from '../../../infrastructure/database/entities';
import { StockImportResponse, StockLiquid, StockOutDto, StockDurationDto } from '../dto';

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

  @ApiOperation({ summary: 'update estoque'})
  @Get('updateStock')
  async updateStock(): Promise<string> {
    return this.stockService.updateStockFromJson();
  }

  @ApiOperation({ summary: 'Registrar saída estoque' })
  @Post('stockOut')
  async stockOut(@Body() stockOutDto: StockOutDto) {
    const message = await this.stockService.getStockOut(stockOutDto);
    return { message };
  }

  @ApiOperation({ summary: 'Importar estoque por XML' })
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

  @ApiOperation({ summary: 'Obter ultimas 10 saidas do produto' })
  @Get('out/:id')
  async findProductOut(@Param('id') id: number): Promise<SaidaEstoque[]> {
    return this.stockService.findProductOut(id);
  }

  @ApiOperation({ summary: 'Atualiza o CEST dos produtos via XML NF-e (buffer, sem salvar)' })
  @Post('cest')
  @UseInterceptors(FileInterceptor('file'))
  async updateCestByXml(@UploadedFile() file: Express.Multer.File): Promise<{ message: string, updated: number, notFound: string[] }> {
    return this.stockService.getCestByXmlBuffer(file.buffer);
  }

  @ApiOperation({ summary: 'Calcular quantos dias o estoque de um produto irá durar' })
  @Get('duration/:produtoId')
  async getStockDuration(
    @Param('produtoId') produtoId: number,
    @Query('periodoAnalise') periodoAnalise?: number
  ): Promise<StockDurationDto> {
    return this.stockService.getStockDuration(produtoId, periodoAnalise || 30);
  }
}