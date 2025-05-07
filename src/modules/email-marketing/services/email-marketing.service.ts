import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cliente } from '../../../infrastructure/database/entities';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { IEmailMarketingService } from '../../../domain/repositories/email-marketingrepository.interface';
import { CreateCampaignDto } from '../dto/campaign.dto';

@Injectable()
export class EmailMarketingService implements IEmailMarketingService {
  private readonly logger = new Logger(EmailMarketingService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(@InjectRepository(Cliente) private clienteRepo: Repository<Cliente>) {
    this.transporter = nodemailer.createTransport({
      host: 'relay.mailbaby.net',
      port: 587,
      secure: false,
      auth: {
        user: 'mb74806',
        pass: 'A9R4ZrSdmwrfvJwaqQy8',
      },
    });
  }

  async sendCampaign(campaign: CreateCampaignDto): Promise<void> {
    const clientes = await this.clienteRepo.find();

    const emails = [
      ...(campaign.to || []),
    ]
      .filter(Boolean)
      .map(email => email.trim().toLowerCase())
      .filter((v, i, a) => a.indexOf(v) === i)
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    this.logger.log(`Enviando campanha para ${emails.length} destinatários`);

    for (const email of emails) {
      try {
        const info = await this.transporter.sendMail({
          from: campaign.from,
          to: email,
          subject: campaign.subject,
          html: campaign.htmlContent,
        });
        this.logger.log(`✅ Email enviado para: ${email} | Resposta: ${JSON.stringify(info)}`);
        
        this.logger.log(`✅ Email enviado para: ${email}`);
      } catch (err) {
        this.logger.error(`❌ Erro ao enviar para ${email}`, err);
      }
    }
  }
}
