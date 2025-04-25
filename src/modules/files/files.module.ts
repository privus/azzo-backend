import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './controllers/files.controller';
import { FileService } from './services/files.service';
import { Arquivo, Venda } from '../../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Arquivo, Venda])],
  controllers: [FileController],
  providers: [FileService,],
  exports: [FileService],
})
export class FilesModule {}
