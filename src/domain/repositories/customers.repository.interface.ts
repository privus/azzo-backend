import { Cliente } from '../../infrastructure/database/entities';

export interface ICustomersRepository {
  syncroCostumers(): Promise<void>;
  findAllCostumers(): Promise<Cliente[]>;
  findCostumerByCode(codigo: number): Promise<Cliente>;
}
