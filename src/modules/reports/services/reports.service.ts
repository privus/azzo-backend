import { Injectable, OnModuleInit } from '@nestjs/common';
import * as jsreport from 'jsreport-core';
import * as handlebars from 'jsreport-handlebars';
import * as chromePdf from 'jsreport-chrome-pdf';
import * as htmlToXlsx from 'jsreport-html-to-xlsx';

export interface WeeklyReportData {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: {
    totalVendas: number;
    valorTotal: number;
    ticketMedio: number;
    numeroVendas: number;
  };
  vendedores: Array<{
    nome: string;
    vendas: number;
    valor: number;
    percentual: number;
  }>;
  vendas: Array<{
    codigo: number;
    data: string;
    cliente: string;
    vendedor: string;
    valor: number;
    status: string;
  }>;
  graficos: {
    vendasPorDia: Array<{ dia: string; valor: number; quantidade: number }>;
    topVendedores: Array<{ nome: string; valor: number }>;
  };
}

@Injectable()
export class ReportsService implements OnModuleInit {
  private jsreport: any;
  private isJsReportReady = false;

  constructor() {}

  async onModuleInit() {
    try {
      // Configurar JsReport com configuração mais simples
      this.jsreport = jsreport({
        extensions: {
          chrome: {
            strategy: 'chrome-pool',
            numberOfWorkers: 1,
            timeout: 30000,
            launchOptions: {
              args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
            }
          }
        }
      });

      // Registrar extensões
      this.jsreport.use(handlebars());
      this.jsreport.use(chromePdf());
      this.jsreport.use(htmlToXlsx());

      await this.jsreport.init();
      this.isJsReportReady = true;
      console.log('✅ JsReport inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro na inicialização do JsReport:', error);
      this.isJsReportReady = false;
    }
  }

  async generateWeeklyReport(startDate: string, endDate: string, format: 'pdf' | 'xlsx' = 'pdf'): Promise<Buffer> {
    if (!this.isJsReportReady) {
      throw new Error('JsReport não está pronto ainda. Tente novamente em alguns segundos.');
    }

    const data = await this.getWeeklyReportData(startDate, endDate);
    
    const template = this.getWeeklyReportTemplate();
    
    const result = await this.jsreport.render({
      template: {
        content: template,
        engine: 'handlebars',
        recipe: format === 'pdf' ? 'chrome-pdf' : 'html-to-xlsx',
        chrome: format === 'pdf' ? {
          format: 'A4',
          marginTop: '1cm',
          marginBottom: '1cm',
          marginLeft: '1cm',
          marginRight: '1cm'
        } : undefined,
        htmlToXlsx: format === 'xlsx' ? {
          htmlEngine: 'chrome',
          waitForJS: true
        } : undefined
      },
      data
    });

    return result.content;
  }

  private async getWeeklyReportData(startDate: string, endDate: string): Promise<WeeklyReportData> {
    // Dados mockados para demonstração
    const mockData: WeeklyReportData = {
      periodo: {
        inicio: startDate,
        fim: endDate
      },
      resumo: {
        totalVendas: 15,
        valorTotal: 45678.90,
        ticketMedio: 3045.26,
        numeroVendas: 15
      },
      vendedores: [
        { nome: 'João Silva', vendas: 8, valor: 24000.00, percentual: 52.5 },
        { nome: 'Maria Santos', vendas: 4, valor: 12000.00, percentual: 26.3 },
        { nome: 'Pedro Costa', vendas: 3, valor: 9678.90, percentual: 21.2 }
      ],
      vendas: [
        { codigo: 1001, data: startDate, cliente: 'Cliente A', vendedor: 'João Silva', valor: 1500.00, status: 'Concluída' },
        { codigo: 1002, data: startDate, cliente: 'Cliente B', vendedor: 'Maria Santos', valor: 2300.00, status: 'Concluída' },
        { codigo: 1003, data: startDate, cliente: 'Cliente C', vendedor: 'Pedro Costa', valor: 890.00, status: 'Pendente' },
        { codigo: 1004, data: startDate, cliente: 'Cliente D', vendedor: 'João Silva', valor: 4200.00, status: 'Concluída' },
        { codigo: 1005, data: startDate, cliente: 'Cliente E', vendedor: 'Maria Santos', valor: 1800.00, status: 'Concluída' }
      ],
      graficos: {
        vendasPorDia: [
          { dia: 'Segunda', valor: 8500.00, quantidade: 3 },
          { dia: 'Terça', valor: 12300.00, quantidade: 4 },
          { dia: 'Quarta', valor: 9800.00, quantidade: 2 },
          { dia: 'Quinta', valor: 15078.90, quantidade: 6 }
        ],
        topVendedores: [
          { nome: 'João Silva', valor: 24000.00 },
          { nome: 'Maria Santos', valor: 12000.00 },
          { nome: 'Pedro Costa', valor: 9678.90 }
        ]
      }
    };

    return mockData;
  }

  private getWeeklyReportTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório Semanal de Vendas</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
        }
        .period {
            color: #666;
            font-size: 14px;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
        }
        .summary-item {
            text-align: center;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
            min-width: 150px;
        }
        .summary-value {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        .summary-label {
            color: #666;
            font-size: 12px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background-color: #007bff;
            color: white;
            font-weight: bold;
        }
        .status-concluida {
            color: #28a745;
            font-weight: bold;
        }
        .status-pendente {
            color: #ffc107;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Relatório Semanal de Vendas</h1>
        <div class="period">{{periodo.inicio}} a {{periodo.fim}}</div>
    </div>

    <div class="summary">
        <div class="summary-item">
            <div class="summary-value">{{resumo.numeroVendas}}</div>
            <div class="summary-label">Total de Vendas</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">R$ {{resumo.valorTotal}}</div>
            <div class="summary-label">Valor Total</div>
        </div>
        <div class="summary-item">
            <div class="summary-value">R$ {{resumo.ticketMedio}}</div>
            <div class="summary-label">Ticket Médio</div>
        </div>
    </div>

    <div class="section">
        <h2>🏆 Performance dos Vendedores</h2>
        <table>
            <thead>
                <tr>
                    <th>Vendedor</th>
                    <th class="text-right">Vendas</th>
                    <th class="text-right">Valor Total</th>
                    <th class="text-right">Participação</th>
                </tr>
            </thead>
            <tbody>
                {{#each vendedores}}
                <tr>
                    <td>{{this.nome}}</td>
                    <td class="text-right">{{this.vendas}}</td>
                    <td class="text-right">R$ {{this.valor}}</td>
                    <td class="text-right">{{this.percentual}}%</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>📋 Detalhes das Vendas</h2>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Vendedor</th>
                    <th class="text-right">Valor</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {{#each vendas}}
                <tr>
                    <td>{{this.codigo}}</td>
                    <td>{{this.data}}</td>
                    <td>{{this.cliente}}</td>
                    <td>{{this.vendedor}}</td>
                    <td class="text-right">R$ {{this.valor}}</td>
                    <td class="{{#if (eq this.status 'Concluída')}}status-concluida{{else}}status-pendente{{/if}}">
                        {{this.status}}
                    </td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>📈 Vendas por Dia da Semana</h2>
        <table>
            <thead>
                <tr>
                    <th>Dia</th>
                    <th class="text-right">Quantidade</th>
                    <th class="text-right">Valor Total</th>
                </tr>
            </thead>
            <tbody>
                {{#each graficos.vendasPorDia}}
                <tr>
                    <td>{{this.dia}}</td>
                    <td class="text-right">{{this.quantidade}}</td>
                    <td class="text-right">R$ {{this.valor}}</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Relatório gerado automaticamente em {{formatDate (new Date)}} | Sistema Azzo</p>
    </div>
</body>
</html>
`;
  }
}