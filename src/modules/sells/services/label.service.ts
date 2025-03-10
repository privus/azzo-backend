import { Injectable } from '@nestjs/common';
import { SellsService } from './sells.service';
import { SellsApiResponse } from '../dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LabelService {
  constructor(private readonly sellsService: SellsService) {}

  async generateLabelHtml(orderId: number, totalVolumes: number, responsible: string): Promise<string> {
    const order = await this.sellsService.getSellById(orderId);

    if (!order) {
      throw new Error(`Pedido ID ${orderId} não encontrado.`);
    }

    // Caminho do logo
    const logoPath = path.resolve('src/utils/azzo.svg');
    const logoSvg = await fs.readFile(logoPath, 'utf8');

    // Armazenar todos os HTMLs de volumes
    const htmlPages: string[] = [];

    for (let volume = 1; volume <= totalVolumes; volume += 2) {
      const firstLabel = this.createLabelHtml(logoSvg, order, volume, totalVolumes, responsible);
      const secondLabel = volume + 1 <= totalVolumes 
        ? this.createLabelHtml(logoSvg, order, volume + 1, totalVolumes, responsible) 
        : ''; // Se for ímpar, deixa a segunda etiqueta vazia

      const html = `
        <html>
        <head>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              justify-content: center;
            }
            .label-container {
              width: 148mm;
              height: 100mm;
              padding: 10mm;
              box-sizing: border-box;
              border: 1px solid #333;
              display: inline-block;
              margin: 0;
              flex: 0 0 50%;
              box-shadow: 0 0 5px rgba(0,0,0,0.1);
              page-break-inside: avoid;
            }
            .logo {
              width: 50mm;
              height: auto;
              margin-bottom: 5mm;
            }
            .info {
              font-size: 14px;
              line-height: 1.4;
            }
            .info h3 {
              margin: 0 0 5px 0;
              font-size: 18px;
            }
            .info p {
              margin: 2px 0;
            }
            .volume {
              font-weight: bold;
              font-size: 16px;
              margin-top: 5mm;
            }
            @media print {
              body * { visibility: hidden; }
              .label-container, .label-container * { visibility: visible; }
              .label-container { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${firstLabel}
          ${secondLabel}
        </body>
        </html>
      `;
      htmlPages.push(html);
    }

    // Retorna todos os HTMLs concatenados
    return htmlPages.join('');
  }

  // Método auxiliar para criar uma etiqueta HTML
  private createLabelHtml(
    logoSvg: string,
    order: any,
    volume: number,
    totalVolumes: number,
    responsible: string
  ): string {
    return `
      <div class="label-container">
        <div class="logo">${logoSvg}</div>
        <div class="info">
          <h3>Pedido: #${order.codigo}</h3>
          <p><strong>Cliente:</strong> ${order.cliente?.nome_empresa ?? 'Não informado'}</p>
          <p>${order.cliente?.endereco ?? 'Endereço não informado'}</p>
          <p>${order.cliente?.cidade?.nome ?? ''}</p>
          <p>${order.cliente?.cidade?.estado?.sigla ?? ''} - ${order.cliente?.cep ?? ''}</p>
          <p><strong>Responsável:</strong> ${responsible}</p>
          <p><strong>Telefone:</strong> ${order.cliente?.telefone_comercial ?? 'Não informado'}</p>
        </div>
        <div class="volume">Volume: ${volume} / ${totalVolumes}</div>
      </div>
    `;
  }
}
