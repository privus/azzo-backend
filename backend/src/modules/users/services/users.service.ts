import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../../infrastructure/database/entities';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';

@Injectable()
export class UsersService implements IUserRepository {
  constructor(@InjectRepository(Usuario) private readonly userRepository: Repository<Usuario>) {}

  async findByEmail(email: string): Promise<Usuario> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<Usuario[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<Partial<Usuario>> {
    return this.userRepository.findOne({ where: { usuario_id: id }, relations: ['cargo', 'cidade', 'cidade.estado', 'regiao'] });
  }

  async register(user: Partial<Usuario>): Promise<Usuario> {
    return this.userRepository.save(user);
  }

  async update(id: number, user: Partial<Usuario>): Promise<Usuario> {
    await this.userRepository.update(id, user);
    return this.userRepository.findOne({ where: { usuario_id: id } });
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
