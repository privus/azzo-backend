import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SellsService } from '../services/sells.service';
import { UpdateSellStatusDto } from '../dto';
import { LabelService } from '../services/label.service';
import { PrintOrderService } from '../services/print-order.service';

@ApiTags('sells')
@Controller('sells')
export class SellsController {
  constructor(
    private readonly sellsService: SellsService, 
    private readonly labelService: LabelService, 
    private readonly printOrderService: PrintOrderService
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

  @ApiOperation({ summary: 'Atualizar status de uma venda' })
  @Patch('status')
  async updateSellStatus(@Body() updateStatusDto: UpdateSellStatusDto) {
    const resultMessage = await this.sellsService.updateSellStatus(updateStatusDto);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Obter ranking de vendas do dia' })
  @Get('ranking')
  async getDailyRakingSells() {
    return this.sellsService.getDailyRakingSells();
  }

  @ApiOperation({ summary: 'Quanto vendido por marca' })
  @Get('brand')
  async sellsByBrand() {
    return this.sellsService.reportBrandSalesBySeller()
  }

  @ApiOperation({ summary: 'Quanto vendido por marca' })
  @Get('brandPositivity')
  async sellsByBrandPositivity() {
    return this.sellsService.reportPositivityByBrand()
  }

  // @ApiOperation({ summary: 'Vendas por data e vendedor' })
  // @Get('seller/:id')
  // async getSellsBySeller(@Param('id') id: number, @Query('fromDate') fromDate: string, @Query('toDate') toDate?: string) {
  //   return this.sellsService.sellsBySeller(id, fromDate, toDate);
  // }

  @ApiOperation({ summary: 'Exportar pedido para o Tiny'})
  @Get('export/:id')
  async exportToTiny(@Param('id') id: number) {
    const resultMessage = await this.sellsService.exportTiny(id);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Sincronizar todas as vendas' })
  @Get('syncro')
  async syncroAllSells() {
    const resultMessage = await this.sellsService.syncroSells();
    return { message: resultMessage };
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
    return this.sellsService.getSellById(id);
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
    res.setHeader('Content-Disposition', 'inline; filename=' + fileName); // 👈 inline, não attachment
    return res.send(pdfBuffer);
  }   
}
