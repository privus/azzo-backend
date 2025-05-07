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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async sendInBatches(emails: string[], batchSize: number, delay: number, campaign: CreateCampaignDto): Promise<void> {
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      this.logger.log(`📦 Enviando lote de ${batch.length} emails (${i + 1} - ${i + batch.length})`);

      const results = await Promise.allSettled(
        batch.map(email => this.transporter.sendMail({
          from: campaign.from,
          to: email,
          subject: campaign.subject,
          html: campaign.htmlContent,
          headers: {
            'List-Unsubscribe': '<https://azzodistribuidora.com.br/unsubscribe>'
          }
        }))
      );

      results.forEach((result, idx) => {
        const target = batch[idx];
        if (result.status === 'fulfilled') {
          this.logger.log(`✅ Email enviado para: ${target}`);
        } else {
          this.logger.error(`❌ Falha ao enviar para: ${target}`, result.reason);
        }
      });

      if (i + batchSize < emails.length) {
        this.logger.log(`🕒 Aguardando ${delay / 1000}s antes do próximo lote...`);
        await this.sleep(delay);
      }
    }
  }

  async sendCampaign(campaign: CreateCampaignDto): Promise<void> {
    const clientes = await this.clienteRepo.find(); // mantido caso você use em outro lugar
    const emails = [
      ...clientes.map(c => c.email),
      ...(campaign.to || []),
    ]
      .filter(Boolean)
      .map(email => email.trim().toLowerCase())
      .filter((v, i, a) => a.indexOf(v) === i)
      .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    this.logger.log(`📨 Iniciando envio para ${emails.length} destinatários`);

    await this.sendInBatches(emails, 100, 60000, campaign);
  }
}
