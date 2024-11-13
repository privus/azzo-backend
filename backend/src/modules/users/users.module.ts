import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cargo, Usuario } from '../../infrastructure/database/entities';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Cargo]), SharedModule],
  controllers: [UsersController],
  providers: [UsersService, { provide: 'IUserRepository', useClass: UsersService }],
  exports: [UsersService, 'IUserRepository'], // Exportar ambos para outros módulos
})
export class UsersModule {}
