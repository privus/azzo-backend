import { CreateCampaignDto } from '../../modules/email-marketing/dto/campaign.dto';

export interface IEmailMarketingService {
  sendCampaign(campaign: CreateCampaignDto): Promise<void>;
} 