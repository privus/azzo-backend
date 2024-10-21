import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../../../infrastructure/database/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
  ) {}

  async findAll(): Promise<Usuario[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<Usuario> {
    return this.userRepository.findOne({ where: { usuario_id: id } });
  }

  async create(user: Partial<Usuario>): Promise<Usuario> {
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
