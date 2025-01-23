import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditsService } from './services/credits.service';
import { ParcelaCredito } from '../../infrastructure/database/entities';
import { CreditsController } from './controllers/credits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParcelaCredito])],
  controllers: [CreditsController],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}
