import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SellsService } from '../services/sells.service';
import { RomaneioDto, UpdateSellStatusDto } from '../dto';
import { LabelService } from '../services/label.service';
import { PrintOrderService } from '../services/print-order.service';
import { RomaneioService } from '../services/romaneio.service';
import { PrintOrderResumeService } from '../services/print-order-resume.service';
import { FileInterceptor } from '@nestjs/platform-express';


@ApiTags('sells')
@Controller('sells')
export class SellsController {
  constructor(
    private readonly sellsService: SellsService, 
    private readonly labelService: LabelService, 
    private readonly printOrderService: PrintOrderService,
    private readonly romaneioService: RomaneioService,
    private readonly printOrderResumeService: PrintOrderResumeService,
  ) {}

  @ApiOperation({ summary: 'Vendas por data' })
  @Get()
  async sellsByDate(@Query('fromDate') fromDate?: string) {
    return this.sellsService.sellsByDate(fromDate);
  }

  @ApiOperation({ summary: 'Vendas entre datas' })
  @Get('between')
  async sellsBetweenDates(@Query('fromDate') fromDate: string, @Query('toDate') toDate?: string) {
    return this.sellsService.sellsBetweenDates(fromDate, toDate);
  }

  @ApiOperation({ summary: 'Relatorio de vendas por grupo clientes' })
  @Get('groupCustomers')
  async sellsByGroupCustomers(@Query('groupId') groupId: number, @Query('supplierId') supplierId: number, @Query('fromDate') fromDate: string, @Query('toDate') toDate: string) {
    return this.sellsService.groupConsumption({ groupId, supplierId, fromDate, toDate })
  }

  @ApiOperation({ summary: 'Obter ranking de vendas do dia' })
  @Get('ranking')
  async getDailyRakingSells() {
    return this.sellsService.getDailyRakingSells();
  }

  @ApiOperation({ summary: 'Obter mix' })
  @Get('mix')
  async getMix() {
    return this.sellsService.reportSalesByBrandAndProduct();
  }

  @ApiOperation({ summary: 'Quanto faturado por marca' })
  @Get('brand')
  async sellsByBrand(@Query('fromDate') fromDate: string, @Query('toDate') toDate?: string) {
    return this.sellsService.reportBrandSalesBySeller(fromDate, toDate)
  }

  @ApiOperation({ summary: 'Quanto vendido e positivado por marca vendedores' })
  @Get('brandPositivity')
  async sellsByBrandPositivity(@Query('fromDate') fromDate: string, @Query('toDate') toDate?: string) {
    return this.sellsService.reportPositivityByBrand(fromDate, toDate)
  }

  @ApiOperation({ summary: 'Quanto vendido e positivado por marca Azzo' })
  @Get('brandPositivityAzzo')
  async sellsByBrandPositivityAzzo(@Query('fromDate') fromDate: string, @Query('toDate') toDate?: string) {
    return this.sellsService.getPositivityAzzo(fromDate, toDate)
  }

  @ApiOperation({ summary: 'Comissão por vendedor' })
  @Get('commissions')
  async getCommissions(@Query('fromDate') fromDate: string, @Query('toDate') toDate?: string) {
    return this.sellsService.commissionBySeller(fromDate, toDate);
  }

  @ApiOperation({ summary: 'Bonificação por vendedor' })
  @Get('weeklyBonus')
  async getBonus(@Query('fromDate') fromDate: string, @Query('toDate') toDate?: string) {
    return this.sellsService.calculateWeeklyAid(fromDate, toDate)
  }

  @ApiOperation({ summary: 'Projeção estoque por periodo' })
  @Get('projectStock')
  async getProjectStock() {
    return this.sellsService.projectStockByProduct();
  }

  @ApiOperation({ summary: 'Dados vendas por período' })
  @Get('salesPerformance')
  async getPerformance(@Query('fromDate1') fromDate1: string, @Query('toDate1') toDate1: string, @Query('fromDate2') fromDate2: string, @Query('toDate2') toDate2: string) {
    return this.sellsService.performanceSalesPeriods(fromDate1, toDate1, fromDate2, toDate2);
  }

  @ApiOperation({ summary: 'Dados vendas por período' })
  @Get('customersPureli')
  async getCustomersPureli() {
    return this.sellsService.customersPureli();
  }

  @ApiOperation({ summary: 'Atualizar status de uma venda' })
  @Patch('status')
  async updateSellStatus(@Body() updateStatusDto: UpdateSellStatusDto) {
    const resultMessage = await this.sellsService.updateSellStatus(updateStatusDto);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Gerar romaneio' })
  @Post('romaneio')
  async generateRomaneio(@Body() romaneioDto: RomaneioDto) {
    const resultMessage = await this.romaneioService.generateRomaneio(romaneioDto);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Obter romaneios' })
  @Get('romaneio')
  async getRomaneios() {
    return this.romaneioService.getRomaneios();
  }

  @Post('import-fretes/:romaneioId')
  @UseInterceptors(FileInterceptor('file'))
  async importFretes(
    @UploadedFile() file: Express.Multer.File,
    @Param('romaneioId') romaneioId: number,
  ) {
    const message = await this.romaneioService.importFretesFromExcel(file.buffer, +romaneioId);
    return { message };
  }

  @ApiOperation({ summary: 'Abter transportadoras' })
  @Get('trans')
  async getTransportadoras() {
    return this.romaneioService.getTransportadoras();
  }

  @ApiOperation({ summary: 'Obter quantidade de pedidos em montagem' })
  @Get('prod')
  async getProd() {
    const sells = await this.sellsService.getSellsByStatus([11139]);
    return sells.length;
  }

  @ApiOperation({ summary: 'Limpar dados Nf-e' })
  @Get('clearNf/:id')
  async clearNf(@Param('id') id: number) {
    const resultMessage = await this.sellsService.clearNfeData(id);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Exportar pedido para o Tiny'})
  @Get('export/:id')
  async exportToTiny(@Param('id') id: number) {
    const resultMessage = await this.sellsService.exportTiny(id);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Adiciona Volume no pedido'})
  @Get('vol/:id')
  async volumeSell(@Param('id') id: number, @Query('volume') volume: number) {  
    const resultMessage = await this.sellsService.addVolumeSell(id, volume);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Sincronizar boletos e Nfs' })
  @Get('syncroInvoiceNfe')
  async syncroAllInvoiceNfs() {
    const resultMessage = await this.sellsService.syncroTinyInvoiceNf();
    return { message: resultMessage };
  }  

  @ApiOperation({ summary: 'Sincronizar todas as vendas' })
  @Get('syncro')
  async syncroAllSells() {
    const resultMessage = await this.sellsService.syncroSells();
    return { message: resultMessage };
  }

  @Post('printResume')
  async printOrderResume(
    @Body('ids') ids: number[],
    @Res() res: Response,
  ) {
    let fileName: string;
    let pdfBuffer: Buffer;
  
    if (ids.length === 1) {
      ({ fileName, pdfBuffer } = await this.printOrderService.printOrder(ids[0], 'Resumo'));
    } else {
      ({ fileName, pdfBuffer } = await this.printOrderResumeService.printOrderResume(ids));
    }
  
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=' + fileName);
    return res.send(pdfBuffer);
  }
  

  @ApiOperation({ summary: 'Excluir venda e suas parcelas' })
  @Delete(':id')
  async deleteSell(@Param('id') id: number) {
    const resultMessage = await this.sellsService.deleteSell(id);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Obter venda por ID' })
  @Get(':id')
  async getSellById(@Param('id') id: number) {
    return this.sellsService.getSellByCode(id);
  }

  @ApiOperation({ summary: 'Gerar etiquetas para um pedido específico via POST' })
  @Post(':id/label')
  async postLabel(
    @Param('id') id: number,
    @Body('totalVolumes') totalVolumes: number,
    @Body('responsible') responsible: string,
    @Res() res: Response
  ) {
      const html = await this.labelService.generateLabel(id, totalVolumes, responsible);

      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
  }

  @Post(':id/print')
  async printOrder(
    @Param('id') id: number,
    @Body('responsible') responsible: string,
    @Res() res: Response,
  ) {
    const { fileName, pdfBuffer } = await this.printOrderService.printOrder(id, responsible);
  
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=' + fileName);
    return res.send(pdfBuffer);
  }
  
}
