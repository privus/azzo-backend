import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { IWhatsAppRepository } from '../../../domain/repositories';

@Injectable()
export class WhatsAppService implements IWhatsAppRepository {

  private readonly logger = new Logger(WhatsAppService.name);

  private readonly messageTag = 'messages/send';
  private readonly apiMktUrl: string;
  private readonly apiMktToken: string;

  private readonly defaultFrom = '5535997782896';
  private readonly defaultContactName = 'Azzo Distribuidora';

  constructor(private readonly httpService: HttpService) {
    this.apiMktUrl = process.env.MKT_API_URL;
    this.apiMktToken = process.env.TOKEN_MKT_PRIVUS;
  }

  async sendMessage(to: string, message: string): Promise<void> {

    const normalizedPhone = this.normalizeBrMobile(to);

    if (!normalizedPhone) {
      this.logger.warn(`Telefone inválido ou não celular BR: ${to}`);
      return;
    }

    const url = this.apiMktUrl.endsWith('/')
      ? `${this.apiMktUrl}${this.messageTag}`
      : `${this.apiMktUrl}/${this.messageTag}`;

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

      this.logger.log(`WhatsApp enviado com sucesso para ${normalizedPhone}`);

    } catch (error: any) {
      this.logger.error(
        `Erro ao enviar WhatsApp para ${normalizedPhone}`,
        error?.response?.data || error.message,
      );
    }
  }

  private normalizeBrMobile(input: string): string | null {

    if (!input) return null;

    // Remove tudo que não é número
    let digits = input.replace(/\D/g, '');

    // Remove prefixo internacional
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }

    // Remove DDI 55 se vier
    if (digits.startsWith('55')) {
      digits = digits.slice(2);
    }

    // Remove zeros iniciais
    while (digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    // Deve ter exatamente 11 dígitos: DDD + 9 + 8
    if (digits.length !== 11) {
      return null;
    }

    const ddd = digits.substring(0, 2);
    const firstDigitAfterDDD = digits.substring(2, 3);

    // Celular BR obrigatoriamente começa com 9
    if (firstDigitAfterDDD !== '9') {
      return null;
    }

    // DDD precisa ser número válido (opcional mas mais seguro)
    const dddNumber = Number(ddd);
    if (dddNumber < 11 || dddNumber > 99) {
      return null;
    }

    return `55${digits}`;
  }
}