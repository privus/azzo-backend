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
    return this.customersService.syncroCustomers();
  }

  @ApiOperation({ summary: 'Atualizar Clientes Inativos' })
  @Get('updateInactive')
  async updateInactiveCustomers() {
    return this.customersService.updateCustomersFromJsonFile();
  }

  @ApiOperation({ summary: 'Associa cliente a grupos' })
  @Get('associateGroups')
  async associateCustomersToGroups() {
    return this.customersService.associateCustomersGrup();
  }

  @ApiOperation({ summary: 'Sincronizar todos tiny ids' })
  @Get('syncroTiny')
  async syncroTinyIds() {
    return this.customersService.syncroIdTiny();
  }

  @ApiOperation({ summary: 'Listar todos os clientes' })
  @Get()
  async findAllCostumers() {
    return this.customersService.findAllCustomers();
  }

  @ApiOperation({ summary: 'Buscar cliente por Código' })
  @Get(':id')
  async findCostumerById(@Param('id') codigo: number) {
    return this.customersService.findCustomerByCode(codigo);
  }

  @ApiOperation({ summary: 'Buscar cliente por Status' })
  @Get('/status/:id')
  async findCostumerByStatus(@Param('id') id: number) {
    return this.customersService.findCustomersByStatus(id);
  }
}
