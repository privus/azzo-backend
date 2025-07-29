import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OrderAssemblyService } from '../services/order-assembly.service';
import { ApiOperation } from '@nestjs/swagger';
import { AssemblyStatusDto } from '../dto';

@Controller('assembly')
export class AssemblyController {
  constructor(private readonly montagemService: OrderAssemblyService) {}

  @Get('progress')
  @ApiOperation({ summary: 'Trazer progresso de montagem de múltiplos pedidos' })
  async getMultiAssemblyProgress(
    @Query('orders') orders: string
  ) {
    // Exemplo: orders=2328,2327,2123
    const codes = orders.split(',').map(c => Number(c.trim())).filter(n => !isNaN(n));
    return this.montagemService.getProgressByVendaCodigos(codes);
  }

  @ApiOperation({ summary: 'Atualiza status e progresso da montagem' })
  @Post()
  async updateAssemblyStatus(@Body() dto: AssemblyStatusDto) {
    await this.montagemService.updateAssemblyStatus(dto);
    return { message: 'Status atualizado' };
  }
}