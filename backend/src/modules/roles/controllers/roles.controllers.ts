import { Controller, Get, Post, Body, Param, Put, Delete, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IRolesRepository } from '../../../domain/repositories/roles.repository.interface';
import { Cargo } from '../../../infrastructure/database/entities';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(@Inject('IRolesRepository') private readonly rolesService: IRolesRepository) {}

  @ApiOperation({ summary: 'Obter todos os cargos' })
  @Get()
  async findAllRoles() {
    return this.rolesService.findRoles();
  }

  @ApiOperation({ summary: 'Obter um cargo pelo ID' })
  @Get(':id')
  async findRoleById(@Param('id') id: number) {
    return this.rolesService.findRoleById(id);
  }

  @ApiOperation({ summary: 'Criar um cargo' })
  @Post('create')
  async createRole(@Body() cargo: Cargo) {
    return this.rolesService.createRole(cargo);
  }

  @ApiOperation({ summary: 'Atualizar um cargo' })
  @Put('update/:id')
  async updateRole(@Param('id') id: number, @Body() cargo: Cargo) {
    return this.rolesService.updateRole(id, cargo);
  }

  @ApiOperation({ summary: 'Deletar um cargo' })
  @Delete('delete/:id')
  async deleteRole(@Param('id') id: number) {
    return this.rolesService.deleteRole(id);
  }

  @ApiOperation({ summary: 'Obter usuários por cargo' })
  @Get(':id/users')
  async findUsersByRole(@Param('id') id: number) {
    return this.rolesService.findUsersByRole(id);
  }
}
