import { Inject, Injectable } from '@nestjs/common';
import { ISellsRepository } from '../../../domain/repositories';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as PdfPrinter from 'pdfmake';
import { Venda } from '../../../infrastructure/database/entities';

@Injectable()
export class LabelService {
  constructor(
    @Inject('ISellsRepository') private readonly sellsSevice: ISellsRepository,
  ) {}

  async generateLabel(orderId: number, totalVolumes: number, responsible: string): Promise<Buffer> {
    const order = await this.sellsSevice.getSellByCode(orderId);
    if (!order) {
      throw new Error(`Pedido ID ${orderId} não encontrado.`);
    }

    // Caminho do logo
    const logoPath = path.resolve('src/utils/azzo.png');
    const logoBase64 = await this.getBase64Image(logoPath);
    if (order.status_venda.status_venda_id !== 11491) {
      await this.sellsSevice.updateStatusSellentt(order.codigo, 11541);
    }
    await this.sellsSevice.registerAssemblyCommission(order);

    return await this.createPdf(order, totalVolumes, responsible, logoBase64);
  }

  private async createPdf(order: any, totalVolumes: number, responsible: string, logoBase64: string): Promise<Buffer> {
    // Definição da fonte Helvetica corretamente
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
      },
    };

    const printer = new PdfPrinter(fonts);
    const docDefinition = {
      pageSize: { width: 150, height: 100 }, // 📌 Corrigido para Paisagem (15cm x 10cm)
      pageOrientation: 'landscape', // ✅ Garante que fique na posição horizontal
      pageMargins: [10, 10, 10, 10],
      defaultStyle: {
        font: 'Helvetica', // Usa a fonte Helvetica corretamente definida
      },
      content: [],
    };

    for (let volume = 1; volume <= totalVolumes; volume++) {
      docDefinition.content.push(this.createLabel(order, volume, totalVolumes, responsible, logoBase64));
      if (volume < totalVolumes) {
        docDefinition.content.push({ text: '', pageBreak: 'after' });
      }
    }

    return this.generatePdfBuffer(printer, docDefinition);
  }

  private createLabel(order: Venda, volume: number, totalVolumes: number, responsible: string, logoBase64: string) {
    const endereco = order.cliente.endereco + ' Nº ' + (order.cliente.num_endereco ?? '');
    const complemento = order.cliente.complemento ? order.cliente.complemento : '';
    const estado = order.cliente.cidade ? order.cliente.cidade.estado.sigla : '';
    const cidade = order.cliente.cidade_string + ' - ' + estado + ' - ' + order.cliente.cep;
    const telefoneFixo = '(35) 99877 - 0726';
    const categoriaCliente = order.cliente.categoria_cliente ? order.cliente.categoria_cliente.nome : 'Supermercado';
    return {
      stack: [
        {
          columns: [
            // 📌 Imagem à esquerda
            { image: logoBase64, width: 60, margin: [0, -10, 0, 5] },

            // 📌 Telefone à direita
            {
              text: telefoneFixo,
              fontSize: 4,
              bold: true,
              alignment: 'right',
              margin: [0, -5, 0, 0],
            },
          ],
        },
        // Pedido e Cliente
        {
          columns: [
            { text: `${categoriaCliente}`, fontSize: 5, bold: true, alignment: 'left' },
            { text: `Pedido: ${order.codigo}`, fontSize: 5, bold: true, alignment: 'right' },
          ],
        },        
        { text: `Cliente: ${order.cliente.nome_empresa}`, fontSize: 5, alignment: 'left', margin: [0, 10, 0, 2] },
        // Endereço
        { text: `Endereço: ${endereco} ${complemento}`, fontSize: 5, alignment: 'left', margin: [0, 2, 0, 2]},
        { text: `Bairro: ${order.cliente.bairro}`, fontSize: 5, alignment: 'left', margin: [0, 2, 0, 2]},
        { text: `${cidade}`, fontSize: 5, alignment: 'left', margin: [0, 2, 0, 2] },
        {
          columns: [
            // 📌 Imagem à esquerda
            { text: `Responsável: ${responsible}`, fontSize: 5, margin: [0, 0, 0, 0], alignment: 'left', bold: true },

            // 📌 Telefone à direita
            { text: `Volume: ${volume} / ${totalVolumes}`, fontSize: 5, bold: true, margin: [0, 0, 0, 0], alignment: 'right' },
          ],
        },
      ],
      margin: [5, 5, 5, 5],
    };
  }

  private async getBase64Image(imagePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      return `data:image/png;base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      return '';
    }
  }

  private generatePdfBuffer(printer: any, docDefinition: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', err => reject(err));

      pdfDoc.end();
    });
  }
}
