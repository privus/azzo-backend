import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ITinyAuthRepository } from 'src/domain/repositories';
import { Produto } from 'src/infrastructure/database/entities';
import { Repository, Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TinyProductService {
  private readonly logger = new Logger(TinyProductService.name);
  private readonly apiUrlTiny: string;
  private readonly productTag = 'produtos';
  private isUpdating = false;

  constructor(
    private readonly httpService: HttpService,
    @Inject('ITinyAuthRepository') private readonly tinyAuthService: ITinyAuthRepository,
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
  ) {
    this.apiUrlTiny = process.env.TINY_API_URL;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async updateTinyProductNames(): Promise<void> {
    if (this.isUpdating) {
      this.logger.warn('⚠️ Uma atualização já está em andamento. Abortando nova execução.');
      return;
    }

    this.isUpdating = true;

    this.logger.log('🔄 Iniciando atualização de nomes de produtos no Tiny MG...');

    const produtos = await this.produtoRepository.find();

    this.logger.log(`📦 ${produtos.length} produtos encontrados com tiny_mg.`);

    const token = await this.tinyAuthService.getAccessToken('MG');

    for (const produto of produtos) {
      if (!produto.nome || !produto.codigo || !produto.tiny_mg) {
        this.logger.warn(`⚠️ Produto ID ${produto.produto_id} sem dados obrigatórios. Pulando...`);
        continue;
      }

      const tinyId = produto.tiny_mg;
      const url = `${this.apiUrlTiny}${this.productTag}/${tinyId}`;

      const body = {
        sku: produto.codigo,
        descricao: produto.nome.trim(),
        ncm: produto.ncm ? produto.ncm.toString() : undefined,
      };

      try {
        this.logger.log(`📝 Atualizando produto ID ${produto.produto_id} (Tiny ID ${tinyId})...`);
        this.logger.debug(`➡️ Corpo da requisição: ${JSON.stringify(body)}`);

        const response = await this.httpService.axiosRef.put(url, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 204 || response.status === 200) {
          this.logger.log(`✅ Produto ${produto.codigo} atualizado com sucesso no Tiny MG.`);
        } else {
          this.logger.error(`❌ Falha ao atualizar produto ${produto.codigo}.`, response.data);
        }

      } catch (error) {
        if (error.response) {
          this.logger.error(`💥 Erro ${error.response.status}: ${error.response.statusText}`);
          this.logger.error('📨 Resposta:', JSON.stringify(error.response.data, null, 2));
        } else {
          this.logger.error(`💥 Erro ao atualizar produto ${produto.codigo}: ${error.message}`);
        }
      }

      await this.sleep(2000);
    }

    this.isUpdating = false;
    this.logger.log('🚀 Atualização de nomes no Tiny MG concluída com sucesso!');
  }
}
