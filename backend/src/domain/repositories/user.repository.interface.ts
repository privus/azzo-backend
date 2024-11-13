import { Cargo, Usuario } from 'src/infrastructure/database/entities';

export interface IUserRepository {
  findByEmail(email: string): Promise<Usuario>;
  findById(id: number): Promise<Partial<Usuario>>;
  register(user: Partial<Usuario>): Promise<Usuario>;
  findAll(): Promise<Usuario[]>;
  remove(id: number): Promise<{ message: string }>;
  update(id: number, user: Partial<Usuario>): Promise<Usuario>;
  findRoles(): Promise<Cargo[]>;
  createRole(cargo: Cargo): Promise<Cargo>;
  updateRole(id: number, cargo: Cargo): Promise<Cargo>;
  findRoleById(id: number): Promise<Cargo>;
}
