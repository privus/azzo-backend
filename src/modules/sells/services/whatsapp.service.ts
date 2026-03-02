import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from 'src/infrastructure/database/entities/cliente';
import { IWhatsAppRepository } from '../../../domain/repositories';

@Injectable()
export class WhatsAppService implements IWhatsAppRepository {
  private readonly logger = new Logger(WhatsAppService.name);

  private readonly messageTag = 'messages/send';
  private readonly apiMktUrl: string;
  private readonly apiMktToken: string;

  private readonly defaultFrom = '5535998770726';
  private readonly defaultContactName = 'Azzo Distribuidora';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Cliente) private readonly clienteRepository: Repository<Cliente>,
  ) {
    this.apiMktUrl = process.env.MKT_API_URL;
    this.apiMktToken = process.env.TOKEN_MKT_PRIVUS;
  }

  async sendMessage(codigo: number, to: string, message: string): Promise<void> {

    const cliente = await this.clienteRepository.findOne({ where: { codigo }});

    if (!cliente) {
      this.logger.warn(`Cliente não encontrado para codigo=${codigo}. Abortando envio WhatsApp.`);
      return;
    }

    const normalizedPhone = this.normalizeBrMobile(to);

    if (!normalizedPhone) {
      this.logger.warn(`Telefone inválido ou não celular BR. codigo=${codigo} telefone=${to}`);

      cliente.revisar = 1;
      await this.clienteRepository.save(cliente);

      return;
    }

    const url = `${this.apiMktUrl}${this.messageTag}`;

    try {
      await this.httpService.axiosRef.post(
        url,
        {
          to: normalizedPhone,
          from: this.defaultFrom,
          message,
          contact_name: this.defaultContactName,
        },
        {
          timeout: 15000,
          headers: {
            Authorization: `Bearer ${this.apiMktToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`WhatsApp enviado com sucesso. codigo=${codigo} to=${normalizedPhone}`);

      cliente.celular = normalizedPhone;

      await this.clienteRepository.save(cliente);
    } catch (error: any) {
      this.logger.error(
        `Erro ao enviar WhatsApp. codigo=${codigo} to=${normalizedPhone}`,
        error?.response?.data || error?.message || error,
      );

      cliente.revisar = 1;
      await this.clienteRepository.save(cliente);
    }
  }

  private onlyDigits(input: string): string {
    return (input || '').replace(/\D/g, '');
  }

  private normalizeBrMobile(input: string): string | null {
    if (!input) return null;

    let digits = this.onlyDigits(input);

    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('55')) digits = digits.slice(2);

    digits = digits.replace(/^0+/, '');

    if (digits.length !== 11) return null;

    const ddd = Number(digits.substring(0, 2));
    const firstDigitAfterDDD = digits.substring(2, 3);

    if (ddd < 11 || ddd > 99) return null;
    if (firstDigitAfterDDD !== '9') return null;

    if (/^(\d)\1+$/.test(digits)) return null;

    return `55${digits}`;
  }
}