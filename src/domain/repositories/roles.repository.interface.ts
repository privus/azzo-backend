import { PermissaoDTO } from '../../modules/roles/dto/pormission-role.dto';
import { Cargo, Permissao, Usuario } from '../../infrastructure/database/entities';

export interface IRolesRepository {
  findRoles(): Promise<Cargo[]>;
  createRole(cargo: { nome: string }, permissoes: PermissaoDTO[]): Promise<Cargo>;
  updateRole(id: number, cargo: { nome: string }, permissoes?: PermissaoDTO[]): Promise<Cargo>;
  findRoleById(id: number): Promise<Cargo>;
  deleteRole(id: number): Promise<{ message: string }>;
  findUsersByRole(cargo_id: number): Promise<Usuario[]>;
  findPermissions(): Promise<Permissao[]>;
}
