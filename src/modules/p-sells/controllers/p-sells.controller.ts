import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get, Query, Patch, Body, Param, Post } from '@nestjs/common';
import { PSellsService } from '../services/p-sell.service';
import { InstallmentsDto, UpdateSellDto } from '../dto';
import { OmieService } from '../services/omie.service';


@ApiTags('pSells')
@Controller('pSells')
export class PSellsController {
  constructor(private readonly pSellsService: PSellsService, private readonly omieService: OmieService) {}

  @ApiOperation({ summary: 'Vendas por data' })
  @Get()
  async sellsByDate(@Query('fromDate') fromDate?: string) {
    return this.pSellsService.sellsByDate(fromDate);
  }

  @ApiOperation({ summary: 'Todas as formas de pagamento' })
  @Get('paymentMethods')
  async getPaymentMethods() {
    return this.pSellsService.findAllPaymentMethods();
  }

  @ApiOperation({ summary: 'Atualiza códigos Omie nas vendas' })
  @Get('omie-codes')
  async updateOmieCodes() {
    return this.omieService.insertOmieCod();
  }

  @ApiOperation({ summary: 'Sincroniza com a tabela pSell' })
  @Get('syncro')
  async relatationsSells() {
    return this.pSellsService.createSells();
  }

  @ApiOperation({ summary: 'Cria parcelas de uma venda' })
  @Post('installments')
  async createInstallments(
    @Body() body: { venda_id: number; parcelas: InstallmentsDto[] }
  ) {
    return this.pSellsService.generateInstallments(body.venda_id, body.parcelas);
  }

  @ApiOperation({ summary: 'Atualizar status de uma venda' })
  @Patch('status')
  async updateSellStatus(@Body() updateStatusDto: UpdateSellDto) {
    const resultMessage = await this.pSellsService.updateSell(updateStatusDto);
    return { message: resultMessage };
  }

  @ApiOperation({ summary: 'Obter venda por ID' })
  @Get(':id')
  async getSellById(@Param('id') id: number) {
    return this.pSellsService.getSellById(id);
  }
}