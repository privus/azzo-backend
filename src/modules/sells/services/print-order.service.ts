import { Inject, Injectable } from '@nestjs/common';
import { ISellsRepository } from '../../../domain/repositories';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as PdfPrinter from 'pdfmake';

@Injectable()
export class PrintOrderService {
  constructor(@Inject('ISellsRepository') private readonly sellsSevice: ISellsRepository) {}

  async printOrder(orderId: number, responsible: string): Promise<{ fileName: string; pdfBuffer: Buffer }> {
    const order = await this.sellsSevice.getSellById(orderId);
    if (!order) {
      throw new Error(`Pedido ID ${orderId} não encontrado.`);
    }

    const logoPath = path.resolve('src/utils/azzo.png');
    const logoBase64 = await this.getBase64Image(logoPath);

    const pdfBuffer = await this.createPdf(order, logoBase64, responsible);
    const fileName = `pedido_${order.codigo}.pdf`;
    return { fileName, pdfBuffer };
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

  private async createPdf(order: any, logoBase64: string, responsible: string): Promise<Buffer> {
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
      },
    };
  
    const printer = new PdfPrinter(fonts);
  
    const docDefinition = {
      pageSize: 'A4',
      // 👇 Aumenta margem superior pois a logo será pintada acima
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        font: 'Helvetica',
      },
      background: [
        {
          image: logoBase64,
          width: 100,
          absolutePosition: { x: 250 - 50, y: 10 }, // Centraliza horizontalmente
        },
      ],
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'black',
        },
        table: {
          margin: [0, 5, 0, 15],
          fontSize: 9,
        },
      },
      content: [
        this.createHeader(order, logoBase64, responsible),
  
        this.createProductsTable(order),
  
        {
          text: `Total do Pedido: R$ ${order.valor_final}`,
          alignment: 'right',
          bold: true,
          margin: [0, 10, 0, 0],
        },
  
        {
          canvas: [{
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 1,
          }],
        },
        { text: ' ', margin: [0, 20] },
      ],
    };
  
    return this.generatePdfBuffer(printer, docDefinition);
  }
  
  private createProductsTable(order: any) {
    const header = [
      { text: 'Código / EAN', style: 'tableHeader' },
      { text: 'Produto', style: 'tableHeader' },
      { text: 'Qtd.', style: 'tableHeader', alignment: 'center' },
      { text: 'V. Uni', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' },
    ];

    const sortedItens = order.itensVenda.slice().sort((a, b) => {
      return (a.fornecedor_id ?? 0) - (b.fornecedor_id ?? 0);
    });

    const rows: any[] = [];
    const caixaRowIndexes: number[] = [];

    sortedItens.forEach((item, idx) => {
      const produto = item.produto;
      const isCaixa = produto?.descricao_uni?.toUpperCase()?.includes('CAIXA');

      const row = [
        {
          stack: [
            { text: produto?.codigo ?? '-', fontSize: 9 },
            { text: produto?.ean ?? '-', fontSize: 8, color: '#666' },
          ],
        },
        produto?.nome ?? '-',
        { text: item.quantidade?.toString() ?? '0', alignment: 'center' },
        { text: `R$ ${Number(item.valor_unitario).toFixed(2)}`, alignment: 'right' },
        { text: `R$ ${Number(item.valor_total).toFixed(2)}`, alignment: 'right' },
      ];

      if (isCaixa) {
        caixaRowIndexes.push(rows.length + 1); // +1 por causa do header
      }

      rows.push(row);
    });

    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto', 'auto'],
        body: [header, ...rows],
      },
      layout: {
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#eeeeee'; // Cabeçalho
          return caixaRowIndexes.includes(rowIndex) ? '#dbe9f5' : null; // Fundo azul claro
        },
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#aaaaaa',
        vLineColor: () => '#aaaaaa',
      },
      style: 'table',
      margin: [0, 10, 0, 0],
    };
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

  private createHeader(order: any, logoBase64: string, responsible: string) {
    const length = order.forma_pagamento
    const forma_pagamento = order.forma_pagamento.slice(0, length.length - 24 )
    const doc = order.cliente.tipo_doc === 'cnpj' ? `CNPJ: ${order.cliente.numero_doc}` : `CPF: ${order.cliente.numero_doc}`
    return {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'Cliente', bold: true, fontSize: 10, margin: [0, 0, 0, 2] },
            { text: order.cliente?.nome_empresa, fontSize: 9 },
            { text: `${doc}`, fontSize: 9 },
            { text: `${order.cliente?.endereco ?? '-'} Nº ${order.cliente?.num_endereco ?? ''}`, fontSize: 9 },
            { text: order.cliente?.complemento ? `Complemento: ${order.cliente?.complemento}` : '', fontSize: 9 },
            { text: `Bairro: ${order.cliente?.bairro ?? '-'}`, fontSize: 9 },
            { text: `Cidade: ${order.cliente?.cidade_string ?? '-'} - ${order.cliente?.cidade?.estado?.sigla ?? ''}`, fontSize: 9 },
            { text: `CEP: ${order.cliente?.cep ?? '-'}`, fontSize: 9 },
          ],
        },
        {
          width: '50%',
          stack: [
            { text: 'Pedido', bold: true, fontSize: 10, margin: [0, 0, 0, 2] },
            { text: `Código: #${order.codigo}`, fontSize: 9 },
            { text: `Data: ${new Date(order.data_criacao).toLocaleDateString('pt-BR')}`, fontSize: 9 },
            { text: `Pagamento: ${forma_pagamento}`, fontSize: 9 },
            { text: `Vendedor: ${order.vendedor?.nome ?? '-'}`, fontSize: 9 },
            { text: `Responsável: ${responsible}`, fontSize: 9 },
          ],
          alignment: 'right',
        },
      ],
      columnGap: 10,
      margin: [0, 0, 0, 20],
    };
  }
  
}
