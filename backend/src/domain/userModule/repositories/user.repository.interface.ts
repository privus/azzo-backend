import { Usuario } from 'src/infrastructure/database/entities';

export interface IUserRepository {
  findByEmail(email: string): Promise<Usuario>;
  findById(id: number): Promise<Usuario>;
  create(user: Usuario): Promise<Usuario>;
}
