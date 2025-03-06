import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SellsService } from '../services/sells.service';
import { UpdateSellStatusDto } from '../dto';

@ApiTags('sells')
@Controller('sells')
export class SellsController {
  constructor(private readonly sellsService: SellsService) {}

  @ApiOperation({ summary: 'Sincronizar vendas por data' })
  @Get()
  async sellsByDate(@Query('fromDate') fromDate?: string) {
    return this.sellsService.sellsByDate(fromDate);
  }

  @ApiOperation({ summary: 'Atualizar status de uma venda' })
  @Patch('status')
  async updateSellStatus(@Body() updateStatusDto: UpdateSellStatusDto) {
    const resultMessage = await this.sellsService.updateSellStatus(updateStatusDto);
    return { message: resultMessage };
  }

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
}
