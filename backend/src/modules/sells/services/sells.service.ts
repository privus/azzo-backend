import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { Produto, Venda, ParcelaCredito, StatusPagamento, StatusVenda, Syncro, TipoPedido } from '../../../infrastructure/database/entities';
import { SellsApiResponse, UpdateSellStatusDto } from '../dto';
import { ICustomersRepository, ISellersRepository, IRegionsRepository, ISellsRepository } from '../../../domain/repositories';

@Injectable()
export class SellsService implements ISellsRepository {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly apiTag = 'orders';

  constructor(
    @Inject('ICustomersRepository') private readonly clienteService: ICustomersRepository,
    @Inject('ISellersRepository') private readonly sellersSevice: ISellersRepository,
    @Inject('IRegionsRepository') private readonly regiaoService: IRegionsRepository,
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(ParcelaCredito) private readonly parcelaRepository: Repository<ParcelaCredito>,
    @InjectRepository(StatusPagamento) private readonly statusPagamentoRepository: Repository<StatusPagamento>,
    @InjectRepository(StatusVenda) private readonly statusVendaRepository: Repository<StatusVenda>,
    @InjectRepository(Syncro) private readonly syncroRepository: Repository<Syncro>,
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
    @InjectRepository(TipoPedido) private readonly tipoPedidoRepository: Repository<TipoPedido>,
    private readonly httpService: HttpService,
  ) {
    this.token = process.env.SELLENTT_API_TOKEN;
    this.apiUrl = process.env.SELLENTT_API_URL;
  }

  async syncroSells(): Promise<string> {
    const messages: string[] = [];
    const syncedSales: string[] = [];
    const updatedSales: string[] = [];

    try {
      const lastSync = await this.getLastSyncDate('sells');
      const lastUpdate = await this.getLastUpdateDate('sells');

      console.log('Última sincronização:', lastSync);
      console.log('Última atualização:', lastUpdate);

      // Construa os parâmetros manualmente
      const params = [];
      if (lastSync) {
        params.push(`after_created=${this.formatDateWithTime(lastSync)}`);
      }
      if (lastUpdate) {
        params.push(`after_updated=${this.formatDateWithTime(lastUpdate)}`);
      }

      // Construa a URL manualmente
      const url = `${this.apiUrl}${this.apiTag}?${params.join('&')}`;
      console.log('URL gerada para a requisição:', url);

      const response = await this.httpService.axiosRef.get<{ data: SellsApiResponse[] }>(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const sellsData = response.data.data;

      for (const sell of sellsData) {
        const result = await this.processSell(sell);

        // Acumule os códigos de vendas sincronizadas ou atualizadas
        if (result?.includes('Atualizada')) {
          updatedSales.push(result.split(' ')[1]); // Extrai o código da venda atualizada
        } else if (result?.includes('Recebida')) {
          syncedSales.push(result.split(' ')[2]); // Extrai o código da venda sincronizada
        }
      }

      const now = new Date();
      await this.updateLastSyncDate('sells', now);
      await this.updateLastUpdateDate('sells', now);

      // Adicione mensagens de resumo
      if (syncedSales.length > 0) {
        messages.push(`Código das vendas sincronizadas: ${syncedSales.join(', ')}.`);
      }
      if (updatedSales.length > 0) {
        messages.push(`Código das vendas atualizadas: ${updatedSales.join(', ')}.`);
      }

      console.log(messages.join(' | '));

      return messages.join(' | '); // Retorna a mensagem consolidada
    } catch (error) {
      console.error('Erro ao sincronizar vendas:', error);
      return 'Erro ao sincronizar vendas.';
    }
  }

  private formatDateWithTime(date: Date): string {
    const offset = -3 * 60; // UTC-3 in minutes
    const brazilDate = new Date(date.getTime() + offset * 60 * 1000);
    return brazilDate.toISOString().slice(0, 19).replace('T', ' '); // Formato "YYYY-MM-DD HH:mm:ss"
  }

  private async getLastSyncDate(moduleName: string): Promise<Date | null> {
    const metadata = await this.syncroRepository.findOne({ where: { module_name: moduleName } });
    if (metadata?.last_sync) {
      // Certifique-se de que o valor recuperado seja uma data sem horas
      return new Date(metadata.last_sync);
    }
    return null;
  }

  private async updateLastSyncDate(moduleName: string, date: Date): Promise<void> {
    let metadata = await this.syncroRepository.findOne({ where: { module_name: moduleName } });

    if (!metadata) {
      metadata = this.syncroRepository.create({ module_name: moduleName, last_sync: date });
    } else {
      metadata.last_sync = date; // Salva a data completa com a hora
    }

    await this.syncroRepository.save(metadata);
  }

  // Método adicional para buscar a última atualização
  private async getLastUpdateDate(moduleName: string): Promise<Date | null> {
    const metadata = await this.syncroRepository.findOne({ where: { module_name: moduleName } });
    if (metadata?.last_update) {
      return new Date(metadata.last_update);
    }
    return null;
  }

  // Método para atualizar a última atualização
  private async updateLastUpdateDate(moduleName: string, date: Date): Promise<void> {
    let metadata = await this.syncroRepository.findOne({ where: { module_name: moduleName } });

    if (!metadata) {
      metadata = this.syncroRepository.create({ module_name: moduleName, last_update: date });
    } else {
      metadata.last_update = date; // Salva a data completa com a hora
    }

    await this.syncroRepository.save(metadata);
  }

  private async processSell(sell: SellsApiResponse): Promise<string> {
    const existingSell = await this.vendaRepository.findOne({ where: { codigo: Number(sell.code) } });

    if (existingSell) {
      // Verifique se há alterações no registro (com base na lógica de atualização)
      const updatedDate = new Date(sell.updated_at); // Use o campo correto de atualização
      if (updatedDate > existingSell.data_criacao) {
        // Compare com o campo de última atualização no banco
        console.log(`Atualizando venda existente => ${sell.code}`);

        // Atualize os campos necessários
        existingSell.observacao = sell.obs;
        existingSell.status_venda = await this.statusVendaRepository.findOne({ where: { status_venda_id: sell.status.id } });

        // Atualizar itens de venda, parcelas, e outras associações, se necessário
        await this.vendaRepository.save(existingSell);

        return `Venda ${sell.code} Atualizada`;
      } else {
        console.log(`Venda já existente e atualizada => ${sell.code}`);
      }
      return;
    }

    // Se a venda não existir, crie-a
    console.log('Criando nova venda =>', sell.code);

    // Busque e associe os dados necessários
    const cliente = await this.clienteService.findCostumerByCode(sell.store ? Number(sell.store.erp_id) : 0);
    const vendedor = await this.sellersSevice.findBy({ codigo: Number(sell.seller_code) });
    const status_pagamento = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id: 1 },
    });
    const status_venda = await this.statusVendaRepository.findOne({
      where: { status_venda_id: sell.status.id },
    });
    const regiao = await this.regiaoService.getRegionByCode(sell.region);

    const paymentTerms = sell.payment_term_text ? sell.payment_term_text.match(/\d+/g) : null;
    const paymentDays = paymentTerms ? paymentTerms.map(Number) : []; // Converte para números
    // Garantir que o número de dias de prazo seja igual ao número de parcelas (installment_qty)
    const numberOfInstallments = sell.installment_qty;
    const validPaymentDays = paymentDays.slice(0, numberOfInstallments); // Usa apenas os primeiros `installment_qty` dias

    // Calcular as datas de vencimento com base nos dias de prazo
    const baseDate = new Date(sell.order_date);
    const datasVencimentoArray = validPaymentDays.map((days) => {
      const data = new Date(baseDate);
      data.setDate(data.getDate() + days);
      return data.toISOString().split('T')[0]; // Formato "YYYY-MM-DD"
    });

    // Agora é um array de strings, não um array de arrays
    const datas_vencimento = datasVencimentoArray;

    // Criar as parcelas de crédito
    const parcela_credito = validPaymentDays.map((days, index) => {
      const data = new Date(baseDate);
      data.setDate(data.getDate() + days); // Adiciona os dias de prazo
      return this.parcelaRepository.create({
        numero: index + 1,
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

    const tipo_pedido = await this.tipoPedidoRepository.findOne({ where: { tipo_pedido_id: sell.order_type_id } });

    const novaVenda = this.vendaRepository.create({
      codigo: Number(sell.code),
      observacao: sell.obs,
      numero_parcelas: sell.installment_qty,
      valor_parcela: Number(sell.installment_value),
      metodo_pagamento: sell.payment_method_text || '',
      forma_pagamento: sell.payment_term_text || '',
      data_criacao: sell.order_date,
      valor_pedido: Number(sell.amount),
      valor_final: Number(sell.amount_final),
      flex_gerado: Number(sell.no_financial) || 0,
      desconto: sell.discount_total | 0,
      datas_vencimento,
      cliente,
      vendedor,
      itensVenda,
      parcela_credito,
      regiao,
      status_venda,
      status_pagamento,
      tipo_pedido,
    });

    await this.vendaRepository.save(novaVenda);
    console.log('Venda sincronizada =>', novaVenda);
    return `Venda código ${sell.code} foi Recebida`;
  }

  async sellsByDate(fromDate?: string): Promise<Venda[]> {
    if (fromDate) {
      return this.vendaRepository.find({
        where: {
          data_criacao: MoreThanOrEqual(new Date(fromDate)),
        },
        relations: ['cliente', 'vendedor', 'status_pagamento', 'status_venda', 'itensVenda.produto', 'tipo_pedido'],
      });
    }
    return this.vendaRepository.find({
      relations: ['cliente', 'vendedor', 'status_pagamento', 'status_venda', 'itensVenda.produto', 'tipo_pedido'],
    });
  }

  async getSellById(id: number): Promise<Venda> {
    return this.vendaRepository.findOne({
      where: { venda_id: id },
      relations: [
        'cliente',
        'vendedor',
        'itensVenda',
        'itensVenda.produto',
        'status_pagamento',
        'status_venda',
        'parcela_credito',
        'parcela_credito.status_pagamento',
        'tipo_pedido',
      ],
    });
  }

  async updateSellStatus(UpdateSellStatusDto: UpdateSellStatusDto): Promise<string> {
    const { venda_id, status_venda_id } = UpdateSellStatusDto;

    const venda = await this.vendaRepository.findOne({
      where: { venda_id },
      relations: ['status_venda'],
    });

    if (!venda) {
      throw new Error(`Venda com ID ${venda_id} não encontrada.`);
    }

    const novoStatus = await this.statusVendaRepository.findOne({ where: { status_venda_id } });

    if (!novoStatus) {
      throw new Error(`Status de venda com ID ${status_venda_id} não encontrado.`);
    }

    venda.status_venda = novoStatus;
    await this.vendaRepository.save(venda);

    return `Status da venda ${venda.codigo} atualizado para ${novoStatus.nome}.`;
  }
}
