// src/infrastructure/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/userModule/repositories/user.repository.interface';
import { Usuario } from '../entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(@InjectRepository(Usuario) private readonly userEntityRepository: Repository<Usuario>) {}

  async findByEmail(email: string): Promise<Usuario | undefined> {
    const userEntity = await this.userEntityRepository.findOne({ where: { email } });
    if (!userEntity) return undefined;
    return userEntity;
  }

  async findById(id: number): Promise<Usuario> {
    const userEntity = await this.userEntityRepository.findOne({ where: { usuario_id: id } });
    if (!userEntity) return undefined;
    return userEntity;
  }

  async create(user: Usuario): Promise<Usuario> {
    const userEntity = this.userEntityRepository.create(user);
    const savedUser = await this.userEntityRepository.save(userEntity);
    return savedUser;
  }
}
