import { Controller, Get, Post, Body, Param, Put, Delete, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IRolesRepository } from '../../../domain/repositories/roles.repository.interface';
import { Cargo } from '../../../infrastructure/database/entities';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(@Inject('IRolesRepository') private readonly rolesService: IRolesRepository) {}

  @ApiOperation({ summary: 'Obter permissões' })
  @Get('permission')
  async findPermission() {
    return this.rolesService.findPermissions();
  }

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

  @ApiOperation({ summary: 'Criar um cargo com permissões' })
  @Post('create')
  async createRole(
    @Body()
    body: {
      nome: string;
      permissoes: { id: number; ler: number; editar: number; criar: number }[];
    },
  ) {
    const { nome, permissoes } = body;

    return this.rolesService.createRole({ nome } as any, permissoes);
  }

  @ApiOperation({ summary: 'Atualizar um cargo com permissões' })
  @Put('update/:id')
  async updateRole(
    @Param('id') id: number,
    @Body()
    body: {
      cargo: Cargo;
      permissoes?: { id: number; ler: number; editar: number; criar: number }[];
    },
  ) {
    const { cargo, permissoes } = body;

    // Permissões já estão no formato correto
    return this.rolesService.updateRole(id, cargo, permissoes);
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
