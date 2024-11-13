import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ISharedRepository } from '../../../domain/repositories/shared.repository.interface';
import { Cargo, Cidade } from 'src/infrastructure/database/entities';


@ApiTags('shared')
@Controller('shared')
export class SharedController {
  constructor(@Inject('ISharedRepository') private readonly sharedService: ISharedRepository) {}

  @ApiOperation({ summary: 'Obter todas as cidades' })
  @Get('cities')
  async findAllCities(): Promise<Cidade[]> {
    return this.sharedService.findAllCities();
  }

  @ApiOperation({ summary: 'Busca a cidade por nome' })
  @Get('cities/partial')
  async findAllPartial(@Query('q') query: string): Promise<Cidade[]> {
    return this.sharedService.findPartial(query || '');
  }
}
