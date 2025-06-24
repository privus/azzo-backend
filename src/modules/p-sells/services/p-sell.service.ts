import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PSellsService {
  // constructor(
  //   @InjectRepository(PVenda) private readonly pSellsRepository: Repository<PVenda>,
  // ) {}
  
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // normalizeSells() {
  //   const orders = this.pSellsRepository.find()
    
  // }
}