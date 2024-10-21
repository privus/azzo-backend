import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { RegisterUserDto } from '../../auth/dto/register-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  async create(@Body() registerUserDto: RegisterUserDto) {
    return this.usersService.create(registerUserDto);
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
