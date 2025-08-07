import { Controller, Get, HttpCode, Post  } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OmieService } from '../services/omie.service';

@ApiTags('omie')
@Controller('omie')
export class OmieController {
  constructor(private readonly omieService: OmieService) {}
  @ApiOperation({ summary: 'Cadastrar produto no Omie' })
  @Get('cadastrar')
  async cadastrarProduto() {
    return this.omieService.cadastraProdutosOmie();
  }
}
