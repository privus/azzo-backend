import { StatusPagamento } from './../../../infrastructure/database/entities/statusPagamento';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cliente, Produto, Venda, Vendedor, ParcelaCredito } from '../../../infrastructure/database/entities';
import { ConfigService } from '@nestjs/config';
import { SellsApiResponse } from '../dto/sells.dto';

@Injectable()
export class SellsService {
  private readonly apiUrl = 'https://app.pedidosdigitais.com.br/api/v2/orders';
  private readonly token: string;

  constructor(
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
    @InjectRepository(Cliente) private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Vendedor) private readonly vendedorRepository: Repository<Vendedor>,
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(ParcelaCredito) private readonly parcelaRepository: Repository<ParcelaCredito>,
    @InjectRepository(StatusPagamento) private readonly statusPagamentoRepository: Repository<StatusPagamento>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.token = this.configService.get<string>('SELLENTT_API_TOKEN');
  }

  async syncroSells(): Promise<void> {
    try {
      const response = await this.httpService.axiosRef.get<{ data: SellsApiResponse[] }>(this.apiUrl, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const sellsData = response.data.data;
      console.log('Vendas recebidas =>', sellsData);
      for (const sell of sellsData) {
        await this.processSell(sell);
      }
    } catch (error) {
      console.error('Erro ao sincronizar vendas:', error);
      throw error;
    }
  }

  private async processSell(sell: SellsApiResponse): Promise<void> {
    // 1) Busca o cliente e o vendedor
    const cliente = await this.clienteRepository.findOne({
      where: { codigo: sell.store.erp_id },
    });

    const vendedor = await this.vendedorRepository.findOne({
      where: { nome: sell.user.name },
    });

    const status_pagamento = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id: 1 },
    });

    // 3) Gera as datas de vencimento para cada parcela, com intervalo de 7 dias
    // Exemplo: se `installment_qty = 3`, então teremos parcelas para +7, +14, +21 dias
    const baseDate = new Date(sell.order_date);

    // Se quiser armazenar todas as datas num único campo (string) em 'datas_vencimento',
    // podemos criar uma string como "2025-01-07, 2025-01-14, 2025-01-21" (exemplo).
    const datasVencimentoArray = Array.from({ length: sell.installment_qty }, (_, i) => {
      const data = new Date(baseDate);
      data.setDate(data.getDate() + 7 * (i + 1));
      return data.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    });

    // Criação das parcelas propriamente ditas,
    // cada parcela com data_vencimento incrementada (7 * i).
    const parcela = Array.from({ length: sell.installment_qty }, (_, i) => {
      const data = new Date(baseDate);
      data.setDate(data.getDate() + 7 * (i + 1));
      return this.parcelaRepository.create({
        numero: i + 1, // opcional: qual parcela é (1ª, 2ª, 3ª, ...)
        valor: Number(sell.installment_value),
        data_criacao: sell.order_date,
        data_vencimento: data,
        status_pagamento,
      });
    });

    let itensVenda = [];
    if (sell.products && sell.products.length > 0) {
      const productCodes = sell.products.map((item) => item.code);
      const produtosEncontrados = await this.produtoRepository.find({
        where: { codigo: In(productCodes) },
      });

      // 2) Montar a relação de itens (VendaProdutos)
      itensVenda = sell.products.map((item) => {
        const produtoEncontrado = produtosEncontrados.find((p) => p.codigo === item.code);

        return {
          quantidade: Number(item.quantity),
          valor_unitario: Number(item.unit_price),
          valor_total: Number(item.total_price),
          produto: produtoEncontrado, // ← Agora bate com a entidade
        };
      });
    }

    // 4) Cria a nova venda
    const novaVenda = this.vendaRepository.create({
      codigo: Number(sell.code), // se tiver uma coluna 'codigo' na tabela Venda
      observacao: sell.obs,
      numero_parcelas: sell.installment_qty,
      valor_parcela: Number(sell.installment_value),
      metodo_pagamento: sell.payment_method_text,
      forma_pagamento: sell.payment_term_text,
      data_criacao: sell.order_date,
      valor_total: Number(sell.amount_final),
      desconto: Number(sell.amount_final_discount) || 0,
      // Se quiser armazenar TODAS as datas de vencimento em forma de string:
      // Exemplo: "2025-01-07, 2025-01-14, 2025-01-21"
      datas_vencimento: datasVencimentoArray.join(', '),
      cliente,
      vendedor,
      itensVenda, // many-to-many
      parcela, // one-to-many (cascade deve estar ativo na entidade)
      // regiao: se quiser vincular pela API, ajuste aqui
    });

    // 5) Salva tudo no banco
    await this.vendaRepository.save(novaVenda);
    console.log('Venda sincronizada =>', novaVenda);
  }
}
