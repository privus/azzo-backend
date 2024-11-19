import { Cargo, Usuario } from '../../infrastructure/database/entities';

export interface IRolesRepository {
  findRoles(): Promise<Cargo[]>;
  createRole(cargo: Cargo): Promise<Cargo>;
  updateRole(id: number, cargo: Cargo): Promise<Cargo>;
  findRoleById(id: number): Promise<Cargo>;
  deleteRole(id: number): Promise<{ message: string }>;
  findUsersByRole(cargo_id: number): Promise<Usuario[]>;
}
