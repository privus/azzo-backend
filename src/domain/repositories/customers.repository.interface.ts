import { Cliente, StatusCliente } from '../../infrastructure/database/entities';

export interface ICustomersRepository {
  syncroCostumers(): Promise<void>;
  findAllCostumers(): Promise<Cliente[]>;
  findCostumerByCode(codigo: number): Promise<Cliente>;
  findCostumersByStatus(id: number): Promise<StatusCliente[]>;
  syncroIdTiny(): Promise<void>;
}
