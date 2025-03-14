import { Injectable } from '@nestjs/common';
import { SellsService } from './sells.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as PdfPrinter from 'pdfmake';

@Injectable()
export class LabelService {
  constructor(private readonly sellsService: SellsService) {}

  async generateLabel(orderId: number, totalVolumes: number, responsible: string): Promise<Buffer> {
    const order = await this.sellsService.getSellById(orderId);

    if (!order) {
      throw new Error(`Pedido ID ${orderId} não encontrado.`);
    }

    // Caminho do logo (converta para PNG ou JPG se necessário)
    const logoPath = path.resolve('src/utils/azzo.png');
    const logoBase64 = await this.getBase64Image(logoPath);

    // Criar PDF com as etiquetas
    const pdfBuffer = await this.createPdf(order, totalVolumes, responsible, logoBase64);
    return pdfBuffer;
  }

  private async createPdf(order: any, totalVolumes: number, responsible: string, logoBase64: string): Promise<Buffer> {
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/fonts/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/fonts/Roboto-Bold.ttf',
      },
    };

    const printer = new PdfPrinter(fonts);
    const docDefinition = {
      pageSize: { width: 100, height: 150 }, // 10cm x 15cm
      pageMargins: [10, 10, 10, 10],
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

  private createLabel(order: any, volume: number, totalVolumes: number, responsible: string, logoBase64: string) {
    return {
      stack: [
        { image: logoBase64, width: 80, alignment: 'center' },
        { text: `Pedido: #${order.codigo}`, fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
        { text: `Cliente: ${order.cliente?.nome_empresa ?? 'Não informado'}`, fontSize: 10, margin: [0, 2, 0, 2] },
        { text: `Endereço: ${order.cliente?.endereco ?? 'Endereço não informado'}`, fontSize: 9 },
        { text: `${order.cliente?.cidade?.nome ?? ''} - ${order.cliente?.estado?.sigla ?? ''} - ${order.cliente?.cep ?? ''}`, fontSize: 9 },
        { text: `Telefone: ${order.cliente?.telefone_comercial ?? 'Não informado'}`, fontSize: 9, margin: [0, 2, 0, 2] },
        { text: `Responsável: ${responsible}`, fontSize: 9, margin: [0, 2, 0, 2] },
        { text: `Volume: ${volume} / ${totalVolumes}`, fontSize: 12, bold: true, margin: [0, 10, 0, 0], alignment: 'center' },
      ],
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
