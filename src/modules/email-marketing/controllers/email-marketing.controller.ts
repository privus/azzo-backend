import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EmailMarketingService } from '../services/email-marketing.service';
import { CreateCampaignDto } from '../dto/campaign.dto';

@Controller('email-marketing')
export class EmailMarketingController {
  constructor(private readonly emailMarketingService: EmailMarketingService) {}

  @Post('campaigns')
  async createCampaign(@Body() campaign: CreateCampaignDto) {
    await this.emailMarketingService.sendCampaign(campaign);
    return { message: 'Campanha iniciada com sucesso' };
  }
}
