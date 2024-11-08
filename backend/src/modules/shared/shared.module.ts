import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cargo, Cidade, Regiao } from '../../infrastructure/database/entities';
import { SharedService } from './services/shared.service';
import { SharedController } from './controllers/shared.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cargo, Cidade, Regiao]), // Repositórios necessários
  ],
  providers: [SharedService, { provide: 'ISharedRepository', useClass: SharedService }], // Registra o SharedService
  exports: ['ISharedRepository'], // Exporta o serviço para outros módulos
  controllers: [SharedController], // Registra o SharedController
})
export class SharedModule {}
