import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Montagem, ItensVenda, ItensMontagem } from '../../../infrastructure/database/entities';
import { AssemblyStatusDto } from '../dto';
import { ISellsRepository } from '../../../domain/repositories';

@Injectable()
export class OrderAssemblyService {
  private readonly logger = new Logger(OrderAssemblyService.name);

  constructor(
    @InjectRepository(ItensVenda) private readonly itensVendaRepository: Repository<ItensVenda>,
    @InjectRepository(Montagem) private readonly montagemRepository: Repository<Montagem>,
    @InjectRepository(ItensMontagem) private readonly itensMontagemRepository: Repository<ItensMontagem>,
    @Inject('ISellsRepository') private readonly sellsSevice: ISellsRepository
  ) {}

  async updateAssemblyStatus(dto: AssemblyStatusDto): Promise<string> {
    let montagem: Montagem;
    this.logger.log(`Atualizando montagem com dados: ${JSON.stringify(dto)}`);

    if (!dto.montagemId) {
      montagem = this.montagemRepository.create({
        status: dto.status,
        responsavel: dto.responsavel,
      });
    } else {
      montagem = await this.montagemRepository.findOne({
        where: { montagem_id: dto.montagemId },
        relations: ['itensMontagem'],
      });
      if (!montagem) throw new NotFoundException('Montagem não encontrada');
      this.logger.log(`Montagem encontrada: ${montagem.montagem_id}`);
    }

    // Atualiza status e datas
    montagem.status = dto.status;
    if (dto.status === 'finalizada') {
      montagem.data_fim = new Date();
      montagem.motivo_pausa = null;
    } else if (dto.status === 'pausada') {
      montagem.motivo_pausa = dto.motivoPausa || null;
    } else if (dto.status === 'iniciada') {
      montagem.motivo_pausa = null;
    }

    montagem = await this.montagemRepository.save(montagem);

    // Salva itens bipados se houver
    if (['iniciada', 'finalizada'].includes(dto.status) && dto.itens?.length) {
      const itensVenda = await this.itensVendaRepository.findBy({
        itens_venda_id: In(dto.itens.map(i => i.itensVendaId)),
      });

      for (const itemDto of dto.itens) {
        const itemVenda = itensVenda.find(i => i.itens_venda_id === itemDto.itensVendaId);
        if (!itemVenda) continue;

        let itemMontagem = await this.itensMontagemRepository.findOne({
          where: {
            montagem: { montagem_id: montagem.montagem_id },
            itensVenda: { itens_venda_id: itemDto.itensVendaId },
          },
        });

        if (itemMontagem) {
          itemMontagem.quantidade_bipada = itemDto.scannedCount;
        } else {
          itemMontagem = this.itensMontagemRepository.create({
            itensVenda: itemVenda,
            montagem: montagem,
            quantidade_bipada: itemDto.scannedCount,
          });
        }

        await this.itensMontagemRepository.save(itemMontagem);
      }
    }

    return `Montagem ${montagem.montagem_id} atualizada para status "${dto.status}"`;
  }

  async getProgressByVendaCodigos(codigos: number[]) {
    const vendas = await Promise.all(
      codigos.map(codigo => this.sellsSevice.getSellByCode(codigo))
    );

    const result = [];

    for (const venda of vendas) {
      if (!venda) continue;

      const montagem = await this.montagemRepository
        .createQueryBuilder('m')
        .innerJoin('m.itensMontagem', 'im')
        .innerJoin('im.itensVenda', 'iv')
        .where('iv.venda_id = :vendaId', { vendaId: venda.venda_id })
        .select(['m.montagem_id', 'm.status'])
        .getOne();

      const itensVendaIds = venda.itensVenda.map(i => i.itens_venda_id);

      if (!itensVendaIds.length) {
        result.push({
          codigo: venda.codigo,
          progresso: [],
          status: montagem?.status || null,
        });
        continue;
      }

      const itensMontagem = await this.itensMontagemRepository
        .createQueryBuilder('im')
        .select('im.itens_venda_id', 'itensVendaId')
        .addSelect('SUM(im.quantidade_bipada)', 'scannedCount')
        .where('im.itens_venda_id IN (:...itensVendaIds)', { itensVendaIds })
        .groupBy('im.itens_venda_id')
        .getRawMany();

      const progress = venda.itensVenda.map(item => {
        const found = itensMontagem.find(im => +im.itensVendaId === item.itens_venda_id);
        return {
          itensVendaId: item.itens_venda_id,
          scannedCount: found ? Number(found.scannedCount) : 0,
        };
      });

      result.push({
        codigo: venda.codigo,
        progress,
        status: montagem?.status || null,
      });
    }

    return result;
  }
}
