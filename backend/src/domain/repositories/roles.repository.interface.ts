import { Cargo, Permissao, Usuario } from '../../infrastructure/database/entities';

export interface IRolesRepository {
  findRoles(): Promise<Cargo[]>;
  createRole(cargo: { nome: string }, permissoes: { id: number; ler: number; editar: number; criar: number }[]): Promise<Cargo>;
  updateRole(id: number, cargo: { nome: string }, permissoes?: { id: number; ler: number; editar: number; criar: number }[]): Promise<Cargo>;
  findRoleById(id: number): Promise<Cargo>;
  deleteRole(id: number): Promise<{ message: string }>;
  findUsersByRole(cargo_id: number): Promise<Usuario[]>;
  findPermissions(): Promise<Permissao[]>;
}
