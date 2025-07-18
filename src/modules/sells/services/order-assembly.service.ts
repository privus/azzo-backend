import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ItensVenda, Montagem } from '../../../infrastructure/database/entities';
import { Repository } from 'typeorm';
import { OrderAssemblyDto } from '../dto';

@Injectable()
export class OrderAssemblyService {
  constructor(
    @InjectRepository(ItensVenda) private readonly itensVendaRepository: Repository<ItensVenda>,
    @InjectRepository(Montagem) private readonly montagemRepository: Repository<Montagem>
  ) {}

  async startAssembly(assemblyDto: OrderAssemblyDto): Promise<string> {
    const { responsavel, itens } = assemblyDto;
    const montagem = this.montagemRepository.create({
      status: 'iniciada',
      responsavel,
      data_inicio: new Date(),
      itensVenda: itens
    });
    await this.montagemRepository.save(montagem);
    return 'Montagem iniciada';
  }

  async pauseAssembly(montagemId: number, motivo: string): Promise<void> {
    await this.montagemRepository.update(montagemId, {
      status: 'pausada',
      motivo_pausa: motivo
    });
  }

  async resumeAssembly(montagemId: number): Promise<void> {
    await this.montagemRepository.update(montagemId, {
      status: 'iniciada',
      motivo_pausa: null
    });
  }

  async finishAssembly(montagemId: number): Promise<void> {
    await this.montagemRepository.update(montagemId, {
      status: 'finalizada',
      data_fim: new Date()
    });
  }
}

