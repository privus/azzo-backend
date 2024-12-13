import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from '../services/customers.service';

@ApiTags('costumers')
@Controller('costumers')
export class CustomersController {
  constructor(private readonly costumersService: CustomersService) {}

  @ApiOperation({ summary: 'Sincronizar todos os clientes' })
  @Get('syncro')
  async syncroAllCostumers() {
    return this.costumersService.syncroCostumers();
  }

  @ApiOperation({ summary: 'Listar todos os clientes' })
  @Get()
  async findAllCostumers() {
    return this.costumersService.findAllCostumers();
  }

  @ApiOperation({ summary: 'Buscar cliente por Código' })
  @Get(':id')
  async findCostumerById(@Param('id') codigo: number) {
    return this.costumersService.findCostumerById(codigo);
  }
}
