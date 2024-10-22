import { Controller, Get, Post, Body, Param, Put, Delete, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';

@Controller('users')
export class UsersController {
  constructor(@Inject('IUserRepository') private readonly usersService: IUserRepository) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.register(registerUserDto);
  }

  @Put(':id')
  async update(@Param('id') id: number, @Body() updateUserDto: Partial<RegisterUserDto>) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
