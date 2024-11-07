import { Controller, Get, Post, Body, Param, Put, Delete, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(@Inject('IUserRepository') private readonly usersService: IUserRepository) {}

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
