// src/infrastructure/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Usuario } from '../../../infrastructure/database/entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly userEntityRepository: Repository<Usuario>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const userEntity = await this.userEntityRepository.findOne({ where: { email } });
    if (!userEntity) return undefined;
    return this.toDomain(userEntity);
  }

  async findById(id: number): Promise<User | undefined> {
    const userEntity = await this.userEntityRepository.findOne({ where: { usuario_id: id } });
    if (!userEntity) return undefined;
    return this.toDomain(userEntity);
  }

  async create(user: User): Promise<User> {
    const userEntity = this.userEntityRepository.create(user);
    const savedUser = await this.userEntityRepository.save(userEntity);
    return this.toDomain(savedUser);
  }

  private toDomain(userEntity: Usuario): User {
    const user: User = {
      usuario_id: userEntity.usuario_id,
      nome: userEntity.nome,
      email: userEntity.email,
      senha: userEntity.senha,
      celular: userEntity.celular,
      endereco: userEntity.endereco,
      data_nascimento: userEntity.data_nascimento,
      username: userEntity.username,
      cidade_id: userEntity.cidade.cidade_id,
      cargo_id: userEntity.cargo.cargo_id,
      regiao_id: userEntity.regiao.regiao_id,
    };
    return user;
  }
}
