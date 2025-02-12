import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cargo, Permissao, CargoPermissao } from '../../infrastructure/database/entities';
import { RolesService } from './services/roles.service';
import { RolesController } from './controllers/roles.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cargo, Permissao, CargoPermissao]), UsersModule],
  controllers: [RolesController],
  providers: [RolesService, { provide: 'IRolesRepository', useClass: RolesService }],
  exports: [RolesService, 'IRolesRepository'],
})
export class RolesModule {}
