import { Controller, Get, Post, Body, Param, Put, Delete, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Cargo } from 'src/infrastructure/database/entities';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(@Inject('IUserRepository') private readonly usersService: IUserRepository) {}

  @ApiOperation({ summary: 'Obter todos os cargos' })
  @Get('roles')
  async findAllRoles() {
    return this.usersService.findRoles();
  }

  @ApiOperation({ summary: 'Obter um cargo pelo ID' })
  @Get('roles/:id')
  async findRoleById(@Param('id') id: number) {
    return this.usersService.findRoleById(id);
  }

  @ApiOperation({ summary: 'Criar um cargo' })
  @Post('roles/create')
  async createRole(@Body() cargo: Cargo) {
    return this.usersService.createRole(cargo);
  }

  @ApiOperation({ summary: 'Atualizar um cargo' })
  @Put('roles/update/:id')
  async updateRole(@Param('id') id: number, @Body() cargo: Cargo) {
    return this.usersService.updateRole(id, cargo);
  }
  
  @ApiOperation({ summary: 'Obter todos os usuários' })
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Obter um usuário pelo ID' })
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: 'Cadastrar um novo usuario' })
  @Post()
  async create(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.register(registerUserDto);
  }

  @ApiOperation({ summary: 'Atualizar um usuario' })
  @Put(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Deletar um usuario' })
  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
