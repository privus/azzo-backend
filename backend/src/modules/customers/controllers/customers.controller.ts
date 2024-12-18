import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from '../services/customers.service';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'Sincronizar todos os clientes' })
  @Get('syncro')
  async syncroAllCostumers() {
    return this.customersService.syncroCostumers();
  }

  @ApiOperation({ summary: 'Listar todos os clientes' })
  @Get()
  async findAllCostumers() {
    return this.customersService.findAllCostumers();
  }

  @ApiOperation({ summary: 'Buscar cliente por Código' })
  @Get(':id')
  async findCostumerById(@Param('id') codigo: number) {
    return this.customersService.findCostumerById(codigo);
  }
}
