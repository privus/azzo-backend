import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Distribuidor, NfeResumo, SaidaEstoque } from '../../../infrastructure/database/entities';
import { Discrepancy, StockImportResponse, StockInItemDto, StockLiquid, StockOutDto, StockOverview, StockValue, StockValuePermancence } from '../dto';

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

  @ApiOperation({ summary: 'Duração estoque em dias por produto e valor estoque' })
  @Get('overview')
  async getOverviewStock(): Promise<StockOverview> {
    return this.stockService.stockOverview();
  }

  @ApiOperation({ summary: 'Registrar saída estoque' })
  @Post('stockOut')
  async stockOut(@Body() stockOutDto: StockOutDto) {
    const message = await this.stockService.getStockOut(stockOutDto);
    return { message };
  }

  @ApiOperation({ summary: 'Obter nfe resumo de todas as nfes importadas'})
  @Get('nfsResume')
  async getNfsResumo(): Promise<NfeResumo[]> {
    return this.stockService.findAllXml();
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

  @ApiOperation({ summary: 'Obter valor do estoque em data retroativa' })
  @Get('value/retro')
  async getRetroValue(): Promise<StockValuePermancence[]> {
    return this.stockService.getHistoricalStockValue();
  }

  @ApiOperation({ summary: 'Obter valor atual do estoque com percentual sobre faturamento' })
  @Get('value')
  async getStockValue(): Promise<StockValue> {
    return this.stockService.getStockValue();
  }

  @ApiOperation({ summary: 'Obter discrepâncias de estoque' })
  @Get('discrepancies')
  async getDiscrepancies(): Promise<Discrepancy[]> {
    return this.stockService.getStockDiscrepancies();
  }

  @ApiOperation({ summary: 'Indicar que a mercadoria referente a nf chegou' })
  @Get('arrived/:nf')
  async arrivedStock(@Param('nf') nf: string) {
    const resultMessage = await this.stockService.productsArrive(nf)
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Reimportar a mercadoria referente a nf' })
  @Get('reimport/:nf')
  async reimportNf(@Param('nf') nf: string) {
    const resultMessage = await this.stockService.reimportNf(nf)
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Obter entradas por número da Nfe' })
  @Get('in/:id')
  async findStockIn(@Param('id') id: string): Promise<StockInItemDto[]> {
    return this.stockService.findStockIn(id);
  }
}