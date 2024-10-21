// src/domain/userModule/repositories/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from '../../../infrastructure/database/repositories/user.repository';
import { Usuario } from '../../../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [
    {
      provide: 'IUserRepository', // Define um token para IUserRepository
      useClass: UserRepository, // Usa UserRepository como a implementação
    },
  ],
  exports: ['IUserRepository'], // Exporta o token para que outros módulos possam utilizá-lo
})
export class UserModule {}
