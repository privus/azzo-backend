import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailMarketingService } from './services/email-marketing.service';
import { EmailMarketingController } from './controllers/email-marketing.controller';
import { Cliente } from '../../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente])],
  controllers: [EmailMarketingController],
  providers: [EmailMarketingService],
  exports: [EmailMarketingService],
})
export class EmailMarketingModule {}
