export class CreateCampaignDto {
  subject: string;
  htmlContent: string;
  from: string;
  to?: string[];
  templateId?: string;
}
