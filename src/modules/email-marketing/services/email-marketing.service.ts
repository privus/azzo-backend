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
  private readonly spam550Emails = new Set<string>();

  constructor(
    @InjectRepository(Cliente)
    private clienteRepo: Repository<Cliente>,
  ) {
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

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async sendInBatches(emails: string[], batchSize: number, delay: number, send: (email: string) => Promise<void>) {
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const promises = batch.map(send);
      await Promise.allSettled(promises);
      if (i + batchSize < emails.length) {
        this.logger.log(`🕒 Aguardando ${delay / 1000}s antes do próximo lote...`);
        await this.sleep(delay);
      }
    }
  }

  async sendCampaign(campaign: CreateCampaignDto): Promise<void> {
    const clientes = await this.clienteRepo.find();

    const emails = [
      ...(campaign.to || []),
    ]
      .filter(Boolean)
      .map(email => email.trim().toLowerCase())
      .filter((v, i, a) => a.indexOf(v) === i)
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      .filter(email => !this.spam550Emails.has(email));

    this.logger.log(`📦 Enviando campanha para ${emails.length} destinatários`);

    await this.sendInBatches(emails, 100, 60000, async (email: string) => {
      try {
        const info = await this.transporter.sendMail({
          from: campaign.from,
          to: email,
          subject: campaign.subject,
          html: campaign.htmlContent,
        });
        this.logger.log(`✅ Email enviado para: ${email}`);
      } catch (err: any) {
        if (typeof err.message === 'string' && err.message.includes('550 This message was classified as rSPAM')) {
          this.logger.error(`❌ Falha ao enviar para: ${email}`);
          this.logger.error(`Error: ${err.message}`);
          this.spam550Emails.add(email);
        } else {
          this.logger.error(`❌ Erro inesperado ao enviar para ${email}`, err);
        }
      }
    });
  }
}
