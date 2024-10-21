// src/infrastructure/database/repositories/user-repository.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entities';
import { UserRepository } from './user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])], // Certifique-se de que a entidade Usuario está registrada
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UserRepositoryModule {}
