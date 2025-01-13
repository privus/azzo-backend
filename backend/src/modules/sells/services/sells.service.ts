import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { Produto, Venda, ParcelaCredito, StatusPagamento, StatusVenda } from '../../../infrastructure/database/entities';
import { ConfigService } from '@nestjs/config';
import { SellsApiResponse } from '../dto/sells.dto';
import { ICustomersRepository, ISellersRepository, IRegionsRepository, ISellsRepository } from '../../../domain/repositories';

@Injectable()
export class SellsService implements ISellsRepository {
  private readonly apiUrl = 'https://app.pedidosdigitais.com.br/api/v2/orders';
  private readonly token: string;

  constructor(
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
    @Inject('ICustomersRepository') private readonly clienteService: ICustomersRepository,
    @Inject('ISellersRepository') private readonly sellersSevice: ISellersRepository,
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(ParcelaCredito) private readonly parcelaRepository: Repository<ParcelaCredito>,
    @InjectRepository(StatusPagamento) private readonly statusPagamentoRepository: Repository<StatusPagamento>,
    @InjectRepository(StatusVenda) private readonly statusVendaRepository: Repository<StatusVenda>,
    @Inject('IRegionsRepository') private readonly regiaoService: IRegionsRepository,
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
    const existingSell = await this.vendaRepository.findOne({ where: { codigo: Number(sell.code) } });
    if (existingSell) {
      console.log('Venda já existente =>', sell.code);
      return;
    }
    // 1) Busca o cliente e o vendedor
    const cliente = await this.clienteService.findCostumerByCode(Number(sell.store.erp_id));
    const vendedor = await this.sellersSevice.findBy({ nome: sell.user.name });

    // 2) Status de pagamento padrão
    const status_pagamento = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id: 1 },
    });

    const status_venda = await this.statusVendaRepository.findOne({ where: { nome: sell.status.name } });

    // 3) Busca a região
    const regiao = await this.regiaoService.getRegionById(sell.region);

    // 4) Monta array de data de vencimento, incrementando 7 dias para cada parcela
    const baseDate = new Date(sell.order_date);
    const datasVencimentoArray = Array.from({ length: sell.installment_qty }, (_, i) => {
      const data = new Date(baseDate);
      data.setDate(data.getDate() + 7 * (i + 1));
      return data.toISOString().split('T')[0]; // ex: "2025-01-15"
    });

    // Converte para array de arrays
    const datasVencimentoMatriz = datasVencimentoArray.map((data) => [data]);

    // Criação das parcelas
    const parcela = Array.from({ length: sell.installment_qty }, (_, i) => {
      const data = new Date(baseDate);
      data.setDate(data.getDate() + 7 * (i + 1));
      return this.parcelaRepository.create({
        numero: i + 1,
        valor: Number(sell.installment_value),
        data_criacao: sell.order_date,
        data_vencimento: data,
        status_pagamento,
      });
    });

    // 5) Montar relação de itens de venda (se existirem produtos)
    let itensVenda = [];
    if (sell.products && sell.products.length > 0) {
      const productCodes = sell.products.map((item) => item.code);
      const produtosEncontrados = await this.produtoRepository.find({
        where: { codigo: In(productCodes) },
      });

      itensVenda = sell.products.map((item) => {
        const produtoEncontrado = produtosEncontrados.find((p) => p.codigo === item.code);
        return {
          quantidade: Number(item.quantity),
          valor_unitario: Number(item.unit_price),
          valor_total: Number(item.total_price),
          produto: produtoEncontrado,
        };
      });
    }

    // 6) Cria a nova venda com o array de arrays de datas de vencimento
    const novaVenda = this.vendaRepository.create({
      codigo: Number(sell.code),
      observacao: sell.obs,
      numero_parcelas: sell.installment_qty,
      valor_parcela: Number(sell.installment_value),
      metodo_pagamento: sell.payment_method_text,
      forma_pagamento: sell.payment_term_text,
      data_criacao: sell.order_date,
      valor_total: Number(sell.amount_final),
      desconto: Number(sell.amount_final_discount) || 0,
      datas_vencimento: datasVencimentoMatriz,
      cliente,
      vendedor,
      itensVenda,
      parcela,
      regiao,
      status_string: sell.status.name,
    });

    // 7) Salva a venda no banco
    await this.vendaRepository.save(novaVenda);
    console.log('Venda sincronizada =>', novaVenda);
  }

  async sellsByDate(fromDate?: string): Promise<Venda[]> {
    if (fromDate) {
      return this.vendaRepository.find({
        where: {
          data_criacao: MoreThanOrEqual(new Date(fromDate)),
        },
        relations: ['cliente', 'vendedor', 'itensVenda'],
      });
    }
    return this.vendaRepository.find({
      relations: ['cliente', 'vendedor', 'itensVenda', 'statusPagamento'],
    });
  }

  async getSellById(id: number): Promise<Venda> {
    return this.vendaRepository.findOne({
      where: { venda_id: id },
      relations: ['cliente', 'vendedor', 'itensVenda'],
    });
  }
}
