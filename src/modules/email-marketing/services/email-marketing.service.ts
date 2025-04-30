import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from '../../../infrastructure/database/entities';
import { IsNull, Not, Repository } from 'typeorm';
import { Resend } from 'resend';
import { IEmailMarketingService } from '../../../domain/repositories/email-marketingrepository.interface';
import { CreateCampaignDto } from '../dto/campaign.dto';

@Injectable()
export class EmailMarketingService implements IEmailMarketingService {
  private readonly logger = new Logger(EmailMarketingService.name);
  private readonly resend: Resend;

  constructor(@InjectRepository(Cliente) private clienteRepo: Repository<Cliente>) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendCampaign(campaign: CreateCampaignDto): Promise<void> {
    const clientes = await this.clienteRepo.find({
      where: { email: Not(IsNull()), ativo: 1 },
    });

    const uniqueEmails = campaign.to?.length
    ? campaign.to
    : Array.from(
        new Set(clientes.map((c) => c.email.trim().toLowerCase()))
      ).filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  

    this.logger.log(`Enviando para ${uniqueEmails.length} emails válidos`);

    for (const email of uniqueEmails) {
      try {
        await this.resend.emails.send({
          from: campaign.from,
          to: email,
          subject: campaign.subject,
          html: campaign.htmlContent,
        });
        this.logger.log(`Email enviado para: ${email}`);
      } catch (err) {
        this.logger.error(`Erro ao enviar para ${email}`, err);
      }
    }
    
  }

}
