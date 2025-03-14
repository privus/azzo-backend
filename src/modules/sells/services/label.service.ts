import { Injectable } from '@nestjs/common';
import { SellsService } from './sells.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class LabelService {
  constructor(private readonly sellsService: SellsService) {}

  async generateLabel(orderId: number, totalVolumes: number, responsible: string): Promise<Buffer> {
    const order = await this.sellsService.getSellById(orderId);

    if (!order) {
      throw new Error(`Pedido ID ${orderId} não encontrado.`);
    }

    // Caminho do logo
    const logoPath = path.resolve('src/utils/azzo.svg');
    const logoSvg = await fs.readFile(logoPath, 'utf8');

    // Criar PDF com o tamanho exato 10cm x 15cm
    const doc = new PDFDocument({
      size: [100, 150], // 10cm x 15cm
      margins: { top: 5, left: 5, right: 5, bottom: 5 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});

    // Criar etiquetas por volume
    for (let volume = 1; volume <= totalVolumes; volume++) {
      if (volume > 1) doc.addPage();
      this.createLabelPdf(doc, logoSvg, order, volume, totalVolumes, responsible);
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }

  private createLabelPdf(
    doc: PDFDocument,
    logoSvg: string,
    order: any,
    volume: number,
    totalVolumes: number,
    responsible: string
  ) {
    // Adicionar logo (SVG precisa ser convertido para PNG antes)
    doc.image('src/utils/azzo.png', 30, 20, { width: 40 });

    // Informações do pedido
    doc.fontSize(16).text(`Pedido: #${order.codigo}`, { align: 'center' }).moveDown(0.5);
    doc.fontSize(12).text(`Cliente: ${order.cliente?.nome_empresa ?? 'Não informado'}`, { align: 'center' }).moveDown(0.2);
    doc.text(order.cliente?.endereco ?? 'Endereço não informado', { align: 'center' }).moveDown(0.2);
    doc.text(`${order.cliente?.cidade?.nome ?? ''}, ${order.cliente?.cidade?.estado?.sigla ?? ''} - ${order.cliente?.cep ?? ''}`, { align: 'center' }).moveDown(0.2);
    doc.text(`Telefone: ${order.cliente?.telefone_comercial ?? 'Não informado'}`, { align: 'center' }).moveDown(0.5);

    // Responsável
    doc.fontSize(12).text(`Responsável: ${responsible}`, { align: 'center' }).moveDown(0.5);

    // Volume
    doc.fontSize(14).text(`Volume: ${volume} / ${totalVolumes}`, { align: 'center' }).moveDown(0.5);
  }
}
