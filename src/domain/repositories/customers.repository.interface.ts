import { Cliente, StatusCliente } from '../../infrastructure/database/entities';

export interface ICustomersRepository {
  syncroCustomers(): Promise<void>;
  findAllCustomers(): Promise<Cliente[]>;
  findCustomerByCode(codigo: number): Promise<Cliente>;
  findCustomersByStatus(id: number): Promise<StatusCliente[]>;
  syncroIdTiny(): Promise<void>;
  registerCustomerTiny(id: number): Promise<number>;
  saveCustomer(customer: Cliente): Promise<void>;
  syncroLastPageCustomers(): Promise<void>;
  registerBling(codigo: number): Promise<number>;
}
