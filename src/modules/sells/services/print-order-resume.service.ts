import { Inject, Injectable } from '@nestjs/common';
import { ISellsRepository } from '../../../domain/repositories';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as PdfPrinter from 'pdfmake';

@Injectable()
export class PrintOrderResumeService {
  constructor(@Inject('ISellsRepository') private readonly sellsService: ISellsRepository) {}

  async printOrderResume(orderIds: number[]): Promise<{ fileName: string; pdfBuffer: Buffer }> {
    const orders = await Promise.all(orderIds.map(id => this.sellsService.getSellByCode(id)));
    const validOrders = orders.filter(order => order);

    if (validOrders.length === 0) throw new Error('Nenhum pedido encontrado.');

    const orderCodes = validOrders.map(order => order.codigo).join(', ');
    const logoPath = path.resolve('src/utils/azzo.png');
    const logoBase64 = await this.getBase64Image(logoPath);
    const aggregatedProducts = this.aggregateProducts(validOrders);
    console.log('Produtos agregados:', aggregatedProducts);

    const pdfBuffer = await this.createPdf(orderCodes, aggregatedProducts, logoBase64);
    const fileName = `resumo_pedidos_${Date.now()}.pdf`;

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

  private aggregateProducts(orders: any[]): any[] {
    const productMap = new Map();

    orders.forEach(order => {
      order.itensVenda.forEach(item => {
        const key = item.produto?.ean || item.produto?.codigo;
        if (!key) return;

        if (!productMap.has(key)) {
          productMap.set(key, { ...item, quantidade: 0, valor_total: 0, marca: item.produto?.fornecedor?.nome });
        }

        const agg = productMap.get(key);
        agg.quantidade += item.quantidade;
        agg.valor_total += item.valor_total;
      });
    });

    return Array.from(productMap.values());
  }

  private async createPdf(orderCodes: string, products: any[], logoBase64: string): Promise<Buffer> {
    const fonts = {
      Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold' },
    };
    const printer = new PdfPrinter(fonts);

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: { font: 'Helvetica' },
      content: [
        { image: logoBase64, width: 100, alignment: 'center', margin: [0, 0, 0, 10] },
        { text: `Resumo de Pedidos: ${orderCodes}`, style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
        this.createProductsTable(products)
      ],
      styles: {
        header: { fontSize: 14, bold: true },
        tableHeader: { bold: true, fontSize: 10 },
        table: { margin: [0, 5, 0, 15], fontSize: 9 },
      }
    };

    return this.generatePdfBuffer(printer, docDefinition);
  }

  private createProductsTable(products: any[]) {
    const header = [
      { text: 'Código / EAN', style: 'tableHeader' },
      { text: 'Produto', style: 'tableHeader' },
      { text: 'Qtd.', style: 'tableHeader', alignment: 'center' },
      { text: 'Marca', style: 'tableHeader', alignment: 'center' },
    ];
  
    const caixaRowIndexes: number[] = [];
    const rows = products.map((item, index) => {
      const produto = item.produto ?? {};
      const isCaixa = produto?.descricao_uni?.toUpperCase()?.includes('CAIXA') || produto.quantidade > 11;
      const obs = item.observacao ? `obs: ${item.observacao}` : '';
  
      if (isCaixa) caixaRowIndexes.push(index + 1); // +1 pelo header
  
      return [
        {
          stack: [
            { text: produto.codigo ?? '-', fontSize: 10 },
            { text: produto.ean ?? '-', fontSize: 9, color: '#666' },
          ],
        },
        {
          stack: [
            { text: produto.nome ?? '-', fontSize: 10 },
            { text: obs, fontSize: 9, color: '#fe4c40' },
          ],
        },
        { text: `${Number(item.quantidade ?? 0)}`, alignment: 'center', fontSize: 10 },
        { text: produto?.fornecedor?.nome ?? '-', alignment: 'center', fontSize: 10 },
      ];
    });
  
    return {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto'], // 3 colunas agora!

        body: [header, ...rows],
      },
      layout: {
        fillColor: (rowIndex: number) => {
          if (rowIndex === 0) return '#eeeeee';
          return caixaRowIndexes.includes(rowIndex) ? '#dbe9f5' : null;
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
}