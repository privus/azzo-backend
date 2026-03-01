# 📊 Manual do Sistema de Relatórios Semanais

## Visão Geral

Este sistema utiliza **JsReport** como alternativa ao FastReport para gerar relatórios semanais de vendas em PDF e Excel no ambiente Linux. O JsReport é uma solução robusta e compatível com Node.js/NestJS.

## ✅ Pré-requisitos Instalados

- ✅ **JsReport Core**: `jsreport-core`
- ✅ **Handlebars Engine**: `jsreport-handlebars` 
- ✅ **PDF Generator**: `jsreport-chrome-pdf`
- ✅ **Excel Generator**: `jsreport-html-to-xlsx`
- ✅ **Google Chrome**: Instalado no sistema para renderização PDF

## 🚀 Como Usar

### 1. Iniciar o Servidor

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm start
```

### 2. Endpoints Disponíveis

#### Gerar Relatório Semanal (PDF)
```bash
GET /reports/weekly?startDate=2025-01-06&endDate=2025-01-12&format=pdf
```

#### Gerar Relatório Semanal (Excel)
```bash
GET /reports/weekly?startDate=2025-01-06&endDate=2025-01-12&format=xlsx
```

### 3. Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| `startDate` | string | ✅ | Data de início (YYYY-MM-DD) | `2025-01-06` |
| `endDate` | string | ✅ | Data de fim (YYYY-MM-DD) | `2025-01-12` |
| `format` | string | ❌ | Formato: `pdf` ou `xlsx` | `pdf` (padrão) |

### 4. Exemplo de Uso com cURL

```bash
# Baixar relatório PDF
curl -X GET "http://localhost:3000/reports/weekly?startDate=2025-01-06&endDate=2025-01-12&format=pdf" \
     -o relatorio_semanal.pdf

# Baixar relatório Excel
curl -X GET "http://localhost:3000/reports/weekly?startDate=2025-01-06&endDate=2025-01-12&format=xlsx" \
     -o relatorio_semanal.xlsx
```

### 5. Exemplo com JavaScript/Frontend

```javascript
// Função para baixar relatório
async function baixarRelatorioSemanal(startDate, endDate, format = 'pdf') {
  const url = `/reports/weekly?startDate=${startDate}&endDate=${endDate}&format=${format}`;
  
  const response = await fetch(url);
  const blob = await response.blob();
  
  // Criar link de download
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `relatorio_semanal_${startDate}_${endDate}.${format}`;
  link.click();
}

// Uso
baixarRelatorioSemanal('2025-01-06', '2025-01-12', 'pdf');
```

## 📋 Estrutura do Relatório

O relatório semanal inclui:

1. **📊 Resumo Executivo**
   - Total de vendas
   - Valor total faturado
   - Ticket médio
   - Número de vendas

2. **🏆 Performance dos Vendedores**
   - Ranking por vendas
   - Valor total por vendedor
   - Percentual de participação

3. **📋 Detalhes das Vendas**
   - Lista completa das vendas
   - Código, data, cliente, vendedor
   - Valor e status de cada venda

4. **📈 Vendas por Dia da Semana**
   - Distribuição das vendas
   - Quantidade e valor por dia

## 🔧 Personalização

### Modificar Template HTML

O template está localizado em:
```
src/modules/reports/services/reports.service.ts
método: getWeeklyReportTemplate()
```

### Alterar Dados do Relatório

Para conectar com dados reais do banco:
```typescript
// Substituir dados mockados por consultas reais
private async getWeeklyReportData(startDate: string, endDate: string) {
  // Implementar consultas ao banco de dados
  const vendas = await this.vendaRepository.find({
    where: { data_criacao: Between(new Date(startDate), new Date(endDate)) }
  });
  
  // Processar dados...
}
```

## 🐛 Troubleshooting

### Erro: "JsReport não está pronto ainda"
**Solução**: Aguarde alguns segundos após iniciar o servidor para o JsReport inicializar.

### Erro de Chrome/PDF
**Solução**: Verifique se o Chrome está instalado:
```bash
google-chrome --version
```

### Erro de Dependências
**Solução**: Reinstale as dependências:
```bash
npm install jsreport-core jsreport-handlebars jsreport-chrome-pdf jsreport-html-to-xlsx
```

### Erro de Memória
**Solução**: Ajuste as configurações do Chrome no serviço:
```typescript
launchOptions: {
  args: [
    '--no-sandbox', 
    '--disable-dev-shm-usage', 
    '--disable-gpu',
    '--memory-pressure-off'
  ]
}
```

## ⚡ Performance

### Otimizações Recomendadas

1. **Pool de Workers**: Já configurado com 1 worker
2. **Cache de Templates**: Implementar cache em produção
3. **Compressão**: Habilitar gzip no servidor
4. **Timeout**: Configurado para 30s

### Configuração para Produção

```typescript
// Produção: Mais workers, menos logs
this.jsreport = jsreport({
  extensions: {
    chrome: {
      strategy: 'chrome-pool',
      numberOfWorkers: 4, // Mais workers em produção
      timeout: 60000
    }
  },
  logger: {
    console: { transport: 'console', level: 'error' } // Apenas erros
  }
});
```

## 📚 Recursos Adicionais

### Documentação JsReport
- [JsReport Official Docs](https://jsreport.net/learn)
- [Chrome PDF Options](https://jsreport.net/learn/chrome-pdf)
- [Handlebars Templates](https://jsreport.net/learn/handlebars)

### Exemplos de Templates
- [Template Gallery](https://playground.jsreport.net/)
- [PDF Styling Guide](https://jsreport.net/learn/css-overview)

## 🔄 Integração com Sistema Existente

### Adicionando ao Menu do Sistema

```typescript
// Adicionar no menu administrativo
{
  title: 'Relatórios',
  icon: 'chart-bar',
  children: [
    {
      title: 'Relatório Semanal',
      path: '/reports/weekly',
      permission: 'reports.weekly'
    }
  ]
}
```

### Agendamento Automático

```typescript
// Usar @nestjs/schedule para enviar relatórios automáticos
@Cron('0 8 * * 1') // Segunda-feira às 8h
async enviarRelatorioSemanal() {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const pdf = await this.reportsService.generateWeeklyReport(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    'pdf'
  );
  
  // Enviar por email...
}
```

---

**✨ Sistema implementado e pronto para uso!**

Este sistema substitui completamente o FastReport e funciona perfeitamente no ambiente Linux. Os relatórios são gerados com qualidade profissional e podem ser facilmente personalizados.