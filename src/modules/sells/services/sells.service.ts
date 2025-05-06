import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Produto, Venda, ParcelaCredito, StatusPagamento, StatusVenda, Syncro, TipoPedido, Cliente, ItensVenda } from '../../../infrastructure/database/entities';
import { OrderTinyDto, SellsApiResponse, UpdateSellStatusDto, BrandSales, Commissions, RakingSellsResponse, BrandPositivity, ReportBrandPositivity, PositivityResponse, RankingItem, SalesComparisonReport, NfeDto, InvoiceTinyDto } from '../dto';
import { ICustomersRepository, ISellersRepository, IRegionsRepository, ISellsRepository, ITinyAuthRepository } from '../../../domain/repositories';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SellsService implements ISellsRepository {
  private readonly apiUrlSellentt: string;
  private readonly apiUrlTiny: string;
  private readonly tokenSellentt: string;
  private readonly apiTagSellentt = 'orders';
  private readonly orderTag = 'pedidos';
  private readonly nfeTag = 'notas';
  private readonly contasReceberTag = 'contas-receber';
  

  constructor(
    @Inject('ICustomersRepository') private readonly clienteService: ICustomersRepository,
    @Inject('ISellersRepository') private readonly sellersSevice: ISellersRepository,
    @Inject('IRegionsRepository') private readonly regiaoService: IRegionsRepository,
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @InjectRepository(ItensVenda) private readonly itensVendaRepository: Repository<ItensVenda>,
    @InjectRepository(ParcelaCredito) private readonly parcelaRepository: Repository<ParcelaCredito>,
    @InjectRepository(StatusPagamento) private readonly statusPagamentoRepository: Repository<StatusPagamento>,
    @InjectRepository(StatusVenda) private readonly statusVendaRepository: Repository<StatusVenda>,
    @InjectRepository(Syncro) private readonly syncroRepository: Repository<Syncro>,
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
    @InjectRepository(TipoPedido) private readonly tipoPedidoRepository: Repository<TipoPedido>,
    @Inject('ITinyAuthRepository') private readonly tinyAuthService: ITinyAuthRepository,
    private readonly httpService: HttpService,
  ) {
    this.tokenSellentt = process.env.SELLENTT_API_TOKEN;
    this.apiUrlSellentt = process.env.SELLENTT_API_URL;
    this.apiUrlTiny= process.env.TINY_API_URL;
  }

  async syncroSells(): Promise<string> {
    const messages: string[] = [];
    const syncedSales: string[] = [];
    const updatedSales: string[] = [];

    await this.clienteService.syncroLastPageCustomers();
  
    try {
      const lastSync = await this.getLastSyncDate('sells');
      const lastUpdate = await this.getLastUpdateDate('sells-update');
  
      console.log('Última sincronização:', lastSync);
      console.log('Última atualização:', lastUpdate);
  
      // Build query parameters
      const params = [];
      if (lastSync) params.push(`after_created=${this.formatDateWithTime(lastSync)}`);
      if (lastUpdate) params.push(`after_updated=${this.formatDateWithTime(lastUpdate)}`);
  
      let currentPage = 1;
      let lastPage = 1;
      const maxPage = 12;
  
      do {
        // Construct URL with pagination
        const url = `${this.apiUrlSellentt}${this.apiTagSellentt}?${params.join('&')}&page=${currentPage}`;
        console.log('Fetching URL:', url);
  
        const response = await this.httpService.axiosRef.get<{ data: SellsApiResponse[], meta: { current_page: number, last_page: number } }>(url, {
          headers: { Authorization: `Bearer ${this.tokenSellentt}` },
        });
  
        const sellsData = response.data.data;
        lastPage = response.data.meta.last_page;
  
        for (const sell of sellsData) {
          const result = await this.processSell(sell);
  
          if (result?.includes('Atualizada')) {
            updatedSales.push(result.split(' ')[1]);
          } else if (result?.includes('Recebida')) {
            syncedSales.push(result.split(' ')[2]);
          }
        }
  
        currentPage++;
  
      } while (currentPage <= lastPage && currentPage <= maxPage);
  
      // Update sync timestamps
      const now = new Date();
      await this.updateLastSyncDate('sells', now);
      await this.updateLastUpdateDate('sells-update', now);

      if (syncedSales.length > 0) {
        messages.push(`Código das vendas sincronizadas: ${syncedSales.join(', ')}.`);
      }
      if (updatedSales.length > 0) {
        messages.push(`Código das vendas atualizadas: ${updatedSales.join(', ')}.`);
      }
      
      this.syncroStatusSells();
      console.log(messages.join(' | '));
      return messages.join(' | ');
  
    } catch (error) {
      console.error('Erro ao sincronizar vendas:', error);
      return 'Erro ao sincronizar vendas.';
    }
  }

  async syncroStatusSells(): Promise<void> {
    let currentPage = 1;
    const maxPage = 8;
  
    try {
      while (currentPage <= maxPage) {
        const url = `${this.apiUrlSellentt}${this.apiTagSellentt}?page=${currentPage}`;
        console.log(`📄 Fetching page ${currentPage} -> ${url}`);
  
        const response = await this.httpService.axiosRef.get<{
          data: SellsApiResponse[];
          meta: { current_page: number; last_page: number };
        }>(url, {
          headers: { Authorization: `Bearer ${this.tokenSellentt}` },
        });
  
        const sellsData = response.data.data;
  
        if (!sellsData.length) {
          console.warn(`⚠️ Página ${currentPage} sem vendas. Encerrando...`);
          break;
        }
  
        for (const sell of sellsData) {
          const existingSell = await this.vendaRepository.findOne({
            where: { codigo: Number(sell.code) },
          });
  
          if (existingSell) {
            const newStatus = await this.statusVendaRepository.findOne({
              where: { status_venda_id: sell.status.id },
            });
            existingSell.status_venda = newStatus;
            await this.vendaRepository.save(existingSell);
              console.log(`✅ Status updated for venda: ${sell.code}`);
            }
        }  
        currentPage++;
      }
    } catch (error) {
      console.error('❌ Erro ao sincronizar status de vendas:', error);
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
    const cliente = await this.clienteService.findCustomerByCode(sell.store ? Number(sell.store.erp_id) : 0);

    const status_venda = await this.statusVendaRepository.findOne({
      where: { status_venda_id: sell.status.id },
    });

    const vendedor = await this.sellersSevice.findBy(Number(sell.seller_code));

    const status_pagamento = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id: 1 },
    });

    let itensVenda = [];
    
    if(existingSell) {    
      existingSell.status_venda = status_venda;
      existingSell.observacao = sell.obs;
      existingSell.comisao = Number(sell.commission) || 0;
        if (existingSell.nfe_id && !existingSell.nfe_link) {
          const link = await this.getNflink(existingSell.nfe_id, cliente.cidade.estado.sigla);
          existingSell.nfe_link = link;
          console.log('Link NFE ==========>', link);
        }
          if (sell.amount_final != existingSell.valor_final || sell.installment_qty != existingSell.numero_parcelas) {
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
                observacao: item.notes,
              };
            });
            await this.itensVendaRepository.delete({ venda: existingSell });

            existingSell.itensVenda = itensVenda;
            existingSell.valor_pedido = Number(sell.amount);
            existingSell.valor_final = Number(sell.amount_final);
            existingSell.desconto = sell.discount_total || 0
            existingSell.valor_parcela = Number(sell.installment_value)
            cliente.valor_ultima_compra = Number(sell.amount_final);

            const paymentTerms = sell.payment_term_text ? sell.payment_term_text.match(/\d+/g) : null;
            const paymentDays = paymentTerms ? paymentTerms.map(Number) : []; // Converte para números
            // Garantir que o número de dias de prazo seja igual ao número de parcelas (installment_qty)
            const numberOfInstallments = sell.installment_qty;
            const validPaymentDays = paymentDays.slice(0, numberOfInstallments); // Usa apenas os primeiros `installment_qty` dias
        
            // Calcular as datas de vencimento com base nos dias de prazo
            const baseDate = new Date(sell.order_date);
            const datasVencimentoArray = validPaymentDays.map((days) => {
              const data = new Date(baseDate);
              data.setDate(data.getDate() + days + 1); // Adiciona um dia extra
              return data.toISOString().split('T')[0]; // Formato "YYYY-MM-DD"
            });
            
          
            // Agora é um array de strings, não um array de arrays
            const datas_vencimento = datasVencimentoArray;
        
            // Criar as parcelas de crédito
            const parcela_credito = validPaymentDays.map((days, index) => {
              const data = new Date(baseDate);
              data.setDate(data.getDate() + days + 1); // Adiciona um dia extra
              return this.parcelaRepository.create({
                  numero: index + 1,
                  valor: Number(sell.installment_value),
                  data_criacao: sell.order_date,
                  data_vencimento: data,
                  status_pagamento,
              });
            });
            
            existingSell.datas_vencimento = datas_vencimento;
            existingSell.parcela_credito = parcela_credito;

            await this.vendaRepository.save(existingSell);
            await this.clienteService.saveCustomer(cliente);
          
            return `Venda ${sell.code} Atualizada`;
          } else {
          console.log(`Venda já existente e atualizada => ${sell.code}`);
          }
          
      await this.vendaRepository.save(existingSell);
      await this.clienteService.saveCustomer(cliente);
      return `Venda ${sell.code} Atualizada`;
    }

    // Se a venda não existir, crie-a
    console.log('Criando nova venda =>', sell.code);


    const regiao = await this.regiaoService.getRegionByCode(sell.region);

    let datas_vencimento = [];
    let parcela_credito = [];

    if (sell.status.id !== 11468) {
      const paymentTerms = sell.payment_term_text ? sell.payment_term_text.match(/\d+/g) : null;
      const paymentDays = paymentTerms ? paymentTerms.map(Number) : [];
      const numberOfInstallments = sell.installment_qty;
      const validPaymentDays = paymentDays.slice(0, numberOfInstallments);

      // Calcular as datas de vencimento com base nos dias de prazo
      const baseDate = new Date(sell.order_date);
      datas_vencimento = validPaymentDays.map((days) => {
          const data = new Date(baseDate);
          data.setDate(data.getDate() + days + 1);
          return data.toISOString().split('T')[0];
      });

      // Criar as parcelas de crédito
      parcela_credito = validPaymentDays.map((days, index) => {
          const data = new Date(baseDate);
          data.setDate(data.getDate() + days + 1);
            return this.parcelaRepository.create({
                numero: index + 1,
                valor: Number(sell.installment_value),
                data_criacao: sell.order_date,
                data_vencimento: data,
                status_pagamento,
          });
      });
    }
  
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
          observacao: item.notes,
        };
      });
    }

    const tipo_pedido = await this.tipoPedidoRepository.findOne({ where: { tipo_pedido_id: sell.order_type_id } });

    if (sell.status.id !== 11468) {
      cliente.ultima_compra = new Date(sell.order_date);
      cliente.valor_ultima_compra = Number(sell.amount_final);
      await this.clienteService.saveCustomer(cliente);
    }

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
      comisao: Number(sell.commission) || 0,
    });

    await this.vendaRepository.save(novaVenda);
    return `Venda código ${sell.code} foi Recebida`;
  }

  async sellsByDate(fromDate?: string): Promise<Venda[]> {
    if (fromDate) {
      return this.vendaRepository.find({
        where: {
          data_criacao: MoreThanOrEqual(new Date(fromDate)),
        },
        relations: ['cliente.cidade.estado', 'vendedor', 'status_pagamento', 'status_venda', 'itensVenda.produto', 'itensVenda.produto.fornecedor', 'tipo_pedido'],
      });
    }
    return this.vendaRepository.find({
      relations: ['cliente.cidade.estado', 'vendedor', 'status_pagamento', 'status_venda', 'itensVenda.produto', 'itensVenda.produto.fornecedor', 'tipo_pedido'],
    });
  }

  async sellsBetweenDates(fromDate: string, toDate?: string): Promise<Venda[]> {
    const start = new Date(fromDate);
    start.setHours(21, 0, 0, 0);
  
    let end: Date;
    if (toDate) {
      end = new Date(toDate);
      end.setHours(44, 59, 59, 999);
    } else {
      end = new Date(fromDate);
      end.setHours(48, 59, 59, 999);
    }
    console.log('Start END ===============>', start, end);
  
    return this.vendaRepository.find({
      where: {
        data_criacao: Between(start, end)
      },
      relations: [
        'cliente.cidade.estado',
        'vendedor',
        'status_pagamento',
        'status_venda',
        'itensVenda.produto',
        'itensVenda.produto',
        'itensVenda.produto.fornecedor', 
        'tipo_pedido'
      ],
    });
  }  

  async getSellById(id: number): Promise<Venda> {
    return this.vendaRepository.findOne({
      where: { venda_id: id },
      relations: [
        'vendedor',
        'itensVenda.produto',
        'status_pagamento',
        'status_venda',
        'parcela_credito.status_pagamento',
        'tipo_pedido',
        'cliente.cidade.estado',
        'cliente.categoria_cliente',
      ],
    });
  }

  async updateSellStatus(UpdateSellStatusDto: UpdateSellStatusDto): Promise<string> {
    const { venda_id, status_venda_id, numero_nfe } = UpdateSellStatusDto;

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
    venda.numero_nfe = numero_nfe;
    await this.vendaRepository.save(venda);

    return `Status da venda ${venda.codigo} atualizado para ${novoStatus.nome}, Nf-e nº ${numero_nfe}.`;
  }

  async exportTiny(id: number): Promise<string> {
    try {
        const order = await this.vendaRepository.findOne({
            where: { venda_id: id },
            relations: ['cliente.cidade.estado', 'itensVenda.produto', 'parcela_credito', 'tipo_pedido'],
        });

        if (!order) {
            throw new BadRequestException({ message: `🚨 Pedido com ID ${id} não encontrado.` });
        }

        if (!order.cliente) {
            throw new BadRequestException({ message: `🚨 Cliente não encontrado para o pedido ${id}.` });
        }

        const itensComErro = order.itensVenda.filter(item => !item.produto.tiny_mg || !item.produto.tiny_sp);

        if (itensComErro.length > 0) {
            let errorMessage = "Os seguintes produtos não possuem ID:\n\n";

            itensComErro.forEach(item => {
                const nomeProduto = item.produto.nome || 'NOME DESCONHECIDO';
                console.error(`❌ Produto: ${nomeProduto}`);
                errorMessage += `• ${nomeProduto}\n`;
            });

            throw new BadRequestException({ message: errorMessage });
        }

        let idContato = order.cliente.tiny_id || 0;
        if (!idContato) {
            idContato = await this.clienteService.registerCustomerTiny(order.cliente.codigo);
        }

        if (!order.cliente.cidade?.estado?.sigla) {
            throw new BadRequestException({ message: `🚨 Estado não definido para o cliente ${order.cliente.codigo}.` });
        }
        const uf = order.cliente.cidade.estado.sigla;
        const accessToken = await this.tinyAuthService.getAccessToken(uf);

        if (!accessToken) {
            throw new BadRequestException({ message: "🚨 Não foi possível obter um token válido para exportação." });
        }

        const body: OrderTinyDto = {
            idContato: idContato,
            numeroOrdemCompra: `${order.codigo}_sell`,
            data: (order.data_criacao ? new Date(order.data_criacao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
            meioPagamento: 2,
            parcelas: order.datas_vencimento.map((dataVencimento, index) => ({
                dias: Math.floor(
                    (new Date(dataVencimento).getTime() - new Date(order.data_criacao).getTime()) / (1000 * 60 * 60 * 24)
                ),
                data: new Date(dataVencimento),
                valor: order.parcela_credito?.[index]?.valor || 0,
            })),
            itens: order.itensVenda?.map(item => ({
                produto: {
                    id: uf === 'MG' ? item.produto.tiny_mg : item.produto.tiny_sp,
                },
                quantidade: item.quantidade,
                valorUnitario: item.valor_unitario,
            })) || [],
        };

        order.exportado = 1;
        await this.vendaRepository.save(order);

        const apiUrl = this.apiUrlTiny + this.orderTag;

        console.log('Body ===========>', body);

        await this.httpService.axiosRef.post(apiUrl, body, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        return `Pedido ${order.codigo} exportado com sucesso para o Tiny ${uf}`;
    } catch (error) {
        console.error("Erro ao exportar pedido:", error.response?.data || error.message);
        throw new BadRequestException({ message: error.message || 'Erro desconhecido ao exportar pedido' });
    }
}


  async deleteSell(code: number): Promise<string> {
    // Verifica se a venda existe
    const venda = await this.vendaRepository.findOne({ where: { codigo: code } });

    if (!venda) {
        throw new Error(`Venda com ID ${code} não encontrada.`);
    }

    // Exclui a venda diretamente (parcelas serão excluídas automaticamente pelo cascade)
    await this.vendaRepository.remove(venda);

    return `Venda com ID ${code} e suas parcelas foram excluídas com sucesso.`;
  }
  
  async getDailyRakingSells(): Promise<RakingSellsResponse> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const yesterday = new Date(today);
  
    // Se ontem (today - 1) foi domingo, buscar dados de sexta-feira (today - 3)
    const tempYesterday = new Date(today);
    tempYesterday.setDate(today.getDate() - 1);
    if (tempYesterday.getDay() === 0) {
      // Domingo
      yesterday.setDate(today.getDate() - 4); // sexta-feira
    } else {
      // Caso contrário, considera ontem normalmente
      yesterday.setDate(today.getDate() - 2);
    }
  
    const todaySales = await this.sellsByDate(today.toISOString());
    const yesterdaySales = await this.sellsBetweenDates(yesterday.toISOString());

    const buildRanking = (sells: Venda[], date: Date) => {
      const rankingMap: Record<number, RankingItem> = {};
  
      for (const sell of sells) {
        const { vendedor, tipo_pedido } = sell;
        const isValidSeller = vendedor && vendedor.vendedor_id !== 12 && vendedor.vendedor_id !== 13;
        const isValidOrderType = tipo_pedido.tipo_pedido_id === 10438;
        if (!isValidSeller || !isValidOrderType) continue;
  
        const id = vendedor.vendedor_id;
        if (!rankingMap[id]) {
          rankingMap[id] = {
            nome: vendedor.nome,
            total: 0,
            numero_vendas: 0,
            codigos_vendas: []
          };
        }
  
        rankingMap[id].total += Number(sell.valor_final);
        rankingMap[id].numero_vendas += 1;
        rankingMap[id].codigos_vendas.push(Number(sell.codigo));
      }
  
      return Object.entries(rankingMap)
        .map(([id, data]) => ({ id: Number(id), ...data }))
        .sort((a, b) => b.total - a.total);
    };
  
    return {
      today: buildRanking(todaySales, today),
      yesterday: buildRanking(yesterdaySales, yesterday),
    };
  } 
  
  async reportBrandSalesBySeller(fromDate: string, toDate?: string): Promise<BrandSales> {
    const vendas = await this.sellsBetweenDates(fromDate, toDate);
  
    const relatorio: BrandSales = {};
  
    // Inicializa o agrupamento total por empresa
    relatorio["Azzo"] = {
      totalPedidos: 0,
      totalFaturado: 0,
      marcas: {},
    };
  
    for (const venda of vendas) {
      if (venda.tipo_pedido.tipo_pedido_id !== 10438) continue;
  
      const vendedorNome = venda.vendedor?.nome || 'Desconhecido';
  
      if (!relatorio[vendedorNome]) {
        relatorio[vendedorNome] = {
          totalPedidos: 0,
          totalFaturado: 0,
          marcas: {},
        };
      }
  
      relatorio[vendedorNome].totalPedidos += 1;
      relatorio[vendedorNome].totalFaturado += Number(venda.valor_final) || 0;
  
      relatorio["Azzo"].totalPedidos += 1;
      relatorio["Azzo"].totalFaturado += Number(venda.valor_final) || 0;
  
      for (const item of venda.itensVenda) {
        const marca = item?.produto?.fornecedor?.nome || 'Desconhecida';
  
        const quantidade = Number(item.quantidade);
        const valor = Number(item.valor_total);
  
        if (!relatorio[vendedorNome].marcas[marca]) {
          relatorio[vendedorNome].marcas[marca] = { quantidade: 0, valor: 0 };
        }
        relatorio[vendedorNome].marcas[marca].quantidade += quantidade;
        relatorio[vendedorNome].marcas[marca].valor += valor;
  
        if (!relatorio["Azzo"].marcas[marca]) {
          relatorio["Azzo"].marcas[marca] = { quantidade: 0, valor: 0 };
        }
        relatorio["Azzo"].marcas[marca].quantidade += quantidade;
        relatorio["Azzo"].marcas[marca].valor += valor;
      }
    }

    for (const key in relatorio) {
      relatorio[key].totalFaturado = Number(relatorio[key].totalFaturado.toFixed(2));
  
      for (const marca in relatorio[key].marcas) {
        relatorio[key].marcas[marca].valor = Number(relatorio[key].marcas[marca].valor.toFixed(2));
      }
    }
  
    return relatorio;
  }
  
  
  async reportPositivityByBrand(fromDate: string, toDate?: string): Promise<ReportBrandPositivity> {
    const vendas = (await this.sellsBetweenDates(fromDate, toDate))
      .filter(v => v.tipo_pedido?.tipo_pedido_id === 10438);
  
    const clientes = await this.clienteService.findAllCustomers();
  
    const allSellers = (await this.sellersSevice.findAllSellers())
      .filter(v => v.ativo);
  
    const relatorio: ReportBrandPositivity = {};
  
    const clientesPorVendedor = new Map<number, Cliente[]>();
    for (const cliente of clientes) {
      const vendedorId = cliente.vendedor?.vendedor_id;
      if (vendedorId !== undefined) {
        if (!clientesPorVendedor.has(vendedorId)) {
          clientesPorVendedor.set(vendedorId, []);
        }
        clientesPorVendedor.get(vendedorId)!.push(cliente);
      }
    }
  
    for (const vendedor of allSellers) {
      const vendedorId = vendedor.vendedor_id;
      const vendedorNome = vendedor.nome;
  
      const carteira = clientesPorVendedor.get(vendedorId) ?? clientes;
      const usandoCarteiraCompleta = !clientesPorVendedor.has(vendedorId);
      const totalClientes = usandoCarteiraCompleta ? 1 : carteira.length;
  
      const marcasPorCliente = new Map<number, Set<string>>();
  
      for (const venda of vendas) {
        const clienteId = venda.cliente?.cliente_id;
        if (!clienteId) continue;
  
        const pertenceAoVendedor = venda.vendedor?.vendedor_id === vendedorId &&
          carteira.some(c => c.cliente_id === clienteId);
        if (!pertenceAoVendedor) continue;
  
        if (!marcasPorCliente.has(clienteId)) {
          marcasPorCliente.set(clienteId, new Set());
        }
  
        for (const item of venda.itensVenda) {
          const marca = item.produto?.fornecedor?.nome;
          if (marca) {
            marcasPorCliente.get(clienteId)!.add(marca);
          }
        }
      }
  
      const marcas: Record<string, BrandPositivity> = {};
      const clientesPositivadosSet = new Set<number>();
  
      for (const cliente of carteira) {
        const clienteId = cliente.cliente_id;
        const marcasCliente = marcasPorCliente.get(clienteId);
        if (!marcasCliente || marcasCliente.size === 0) continue;
  
        clientesPositivadosSet.add(clienteId);
  
        for (const marca of marcasCliente) {
          if (!marcas[marca]) {
            marcas[marca] = {
              clientesPositivados: 0,
              positivacaoMarca: 0,
              contribuicaoPercentual: 0,
            };
          }
          marcas[marca].clientesPositivados += 1;
        }
      }
  
      const clientesPositivados = clientesPositivadosSet.size;
      const positivacaoGeral = Number(((clientesPositivados / totalClientes) * 100).toFixed(2));
  
      for (const marca in marcas) {
        marcas[marca].positivacaoMarca = Number(((marcas[marca].clientesPositivados / totalClientes) * 100).toFixed(2));
      }
  
      const soma = Object.values(marcas).reduce((acc, m) => acc + m.positivacaoMarca, 0);
  
      for (const marca in marcas) {
        const m = marcas[marca];
        m.contribuicaoPercentual = soma > 0 ? Number(((m.positivacaoMarca / soma) * 100).toFixed(2)) : 0;
      }
  
      if (clientesPositivados > 0 && totalClientes > 0) {
        relatorio[vendedorNome] = {
          totalClientes,
          clientesPositivados,
          positivacaoGeral,
          marcas,
        };
      }
    }
  
    return relatorio;
  }
  
  
  async getPositivityAzzo(fromDate: string, toDate: string): Promise<PositivityResponse> {
    const vendas = await this.sellsBetweenDates(fromDate, toDate);
    const clientes = await this.clienteService.findAllCustomers();
  
    const totalClientes = clientes.length;
  
    const marcasPorCliente = new Map<number, Set<string>>();
    const clientesPositivadosSet = new Set<number>();
  
    for (const venda of vendas) {
      const clienteId = venda.cliente?.cliente_id;
      if (!clienteId) continue;
  
      clientesPositivadosSet.add(clienteId);
  
      if (!marcasPorCliente.has(clienteId)) {
        marcasPorCliente.set(clienteId, new Set());
      }
  
      for (const item of venda.itensVenda) {
        const marca = item.produto?.fornecedor?.nome;
        if (marca) {
          marcasPorCliente.get(clienteId)!.add(marca);
        }
      }
    }
  
    const marcas: Record<string, BrandPositivity> = {};
  
    for (const cliente of clientes) {
      const clienteId = cliente.cliente_id;
      const marcasCliente = marcasPorCliente.get(clienteId);
      if (!marcasCliente || marcasCliente.size === 0) continue;
  
      for (const marca of marcasCliente) {
        if (!marcas[marca]) {
          marcas[marca] = {
            clientesPositivados: 0,
            positivacaoMarca: 0,
            contribuicaoPercentual: 0,
          };
        }
        marcas[marca].clientesPositivados += 1;
      }
    }
  
    const clientesPositivados = clientesPositivadosSet.size;
    const positivacaoGeral = Number(((clientesPositivados / totalClientes) * 100).toFixed(2));
  
    for (const marca in marcas) {
      marcas[marca].positivacaoMarca = Number(((marcas[marca].clientesPositivados / totalClientes) * 100).toFixed(2));
    }
  
    const soma = Object.values(marcas).reduce((acc, m) => acc + m.positivacaoMarca, 0);
  
    for (const marca in marcas) {
      const m = marcas[marca];
      m.contribuicaoPercentual = soma > 0 ? Number(((m.positivacaoMarca / soma) * 100).toFixed(2)) : 0;
    }
  
    return {
      totalClientes,
      clientesPositivados,
      positivacaoGeral,
      marcas,
    };
  }
  

  async commissionBySeller(fromDate: string, toDate?: string): Promise<Commissions[]> {
    const vendasMes = await this.sellsBetweenDates(fromDate, toDate);
    const vendedorMap = new Map<number, Commissions>();
  
    for (const venda of vendasMes) {
      if (venda.tipo_pedido.tipo_pedido_id !== 10438) continue;
  
      const vendedorId = venda.vendedor.vendedor_id;
  
      const vendedorNome = venda.vendedor.nome;
  
      if (!vendedorMap.has(vendedorId)) {
        vendedorMap.set(vendedorId, {
          vendedor: vendedorNome,
          faturado: 0,
          pedidos: 0,
          comissao: 0,
          ticketMedio: 0,
          comissaoMedia: 0,
        });
      }
  
      const vendedorData = vendedorMap.get(vendedorId)!;
      vendedorData.faturado += Number(venda.valor_final);
      vendedorData.pedidos += 1;
      vendedorData.comissao += Number(venda.comisao);
    }
  
    return Array.from(vendedorMap.values()).map(v => ({
      ...v,
      faturado: Number(v.faturado.toFixed(2)),
      comissao: Number(v.comissao.toFixed(2)),
      ticketMedio: Number((v.faturado / v.pedidos).toFixed(2)),
      comissaoMedia: Number((v.comissao / v.pedidos).toFixed(2)),
    }));
  }

  addVolumeSell(id: number, volume: number): Promise<string> {
    return this.vendaRepository.update({ venda_id: id }, { volume })
      .then(() => `Volume de venda ${id} atualizado para ${volume}.`)
      .catch((error) => {
        console.error('Erro ao atualizar o volume da venda:', error);
        throw new Error(`Erro ao atualizar o volume da venda ${id}: ${error.message}`);
    });
  }

  async performanceSalesPeriods(
    fromDate1: string,
    toDate1: string,
    fromDate2: string,
    toDate2: string
  ): Promise<SalesComparisonReport> {
    const vendasPeriodo1 = await this.sellsBetweenDates(fromDate1, toDate1);
    const vendasPeriodo2 = await this.sellsBetweenDates(fromDate2, toDate2);
  
    const tipoId = 10438;
    const vendasValidasPeriodo1 = vendasPeriodo1.filter(v => v.tipo_pedido?.tipo_pedido_id === tipoId);
    const vendasValidasPeriodo2 = vendasPeriodo2.filter(v => v.tipo_pedido?.tipo_pedido_id === tipoId);
  
    const totalPeriodo1 = vendasValidasPeriodo1.reduce((acc, venda) => acc + Number(venda.valor_final || 0), 0);
    const totalPeriodo2 = vendasValidasPeriodo2.reduce((acc, venda) => acc + Number(venda.valor_final || 0), 0);
  
    const variacao = totalPeriodo1 === 0
      ? (totalPeriodo2 > 0 ? 100 : 0)
      : ((totalPeriodo2 - totalPeriodo1) / totalPeriodo1) * 100;
  
    let direcao: 'aumento' | 'queda' | 'neutro' = 'neutro';
    if (variacao > 0) direcao = 'aumento';
    else if (variacao < 0) direcao = 'queda';
  
    // === Dados do mês atual ===
    const agora = new Date();

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().slice(0, 10);
    const hj = agora.toISOString().slice(0, 10);
    console.log('Inicio do mês ====>', inicioMes);
  
    const relatorioMesAtual = await this.reportBrandSalesBySeller(inicioMes, hj);
    const azzoData = relatorioMesAtual["Azzo"];
    console.log('Azzo Data ====>', azzoData);
    const faturamentoMesAtual = azzoData.totalFaturado;
  
    const faturamentoPorMarcaMesAtual: { [marca: string]: number } = {};
    for (const marca in azzoData.marcas) {
      faturamentoPorMarcaMesAtual[marca] = Number(azzoData.marcas[marca].valor.toFixed(2));
    }
  
    return {
      totalPeriodo1: Number(totalPeriodo1.toFixed(2)),
      totalPeriodo2: Number(totalPeriodo2.toFixed(2)),
      variacaoPercentual: Number(variacao.toFixed(2)),
      direcao,
      faturamentoMesAtual,
      faturamentoPorMarcaMesAtual
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async syncroTinyInvoiceNf(): Promise<string> {
    console.log("🔄 Iniciando sincronização de clientes do Tiny MG e SP...");

    const updatedSales = new Set<string>();

    await this.syncroInvoiceNfForState("MG", this.apiUrlTiny);
    await this.syncroInvoiceNfForState("SP", this.apiUrlTiny);
    await this.getAccessKeyNf("MG", this.apiUrlTiny, updatedSales);
    await this.getAccessKeyNf("SP", this.apiUrlTiny, updatedSales);

    console.log("✅ Sincronização de clientes concluída!");

    return `Sincronização de boletos e nf-e concluída! Vendas atualizadas: ${Array.from(updatedSales).join(", ")}`;
  }

  private async syncroInvoiceNfForState(uf: string, apiUrl: string): Promise<void> {
    let offset = 0;
    const limit = 100;
    const token = await this.tinyAuthService.getAccessToken(uf);

    if (!token) {
      console.error(`❌ Erro ao obter token para ${uf}. Pulando sincronização.`);
      return;
    }

    while (true) {
      try {
        const url = `${apiUrl}${this.contasReceberTag}?dataInicialEmissao=2025-03-11&offset=${offset}&limit=${limit}`;
        const response = await this.httpService.axiosRef.get<{ itens: InvoiceTinyDto[] }>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const invoiceData = response.data.itens;

        if (!invoiceData || invoiceData.length === 0) {
          console.log(`🚫 Nenhuma conta encontrada para ${uf} no offset ${offset}.`);
          break;
        }

        for (const invoice of invoiceData) {
          const historico = invoice.historico;
          if (!historico.includes('sell')) continue;

          const matchNota = historico.match(/NF nº (\d+)/);
          const matchPedido = historico.match(/nº (\d+)_sell/);
          const matchParcela = historico.match(/\(parcela (\d+)\/(\d+)\)/);

          if (!matchNota || !matchPedido) {
            console.warn(`⚠️ Histórico sem formato válido: ${historico}`);
            continue;
          }

          const numeroNota = matchNota[1];
          const codigoPedido = Number(matchPedido[1]);
          const numeroParcela = matchParcela ? Number(matchParcela[1]) : 1;

          const venda = await this.vendaRepository.findOne({
            where: { codigo: codigoPedido },
            relations: ['cliente', 'parcela_credito.status_pagamento'],
          });

          if (!venda) {
            console.warn(`⚠️ Venda não encontrada para código ${codigoPedido}, cliente tiny_id ${invoice.cliente.id}`);
            continue;
          }

          const parcela = venda.parcela_credito.find(
            (p) => Math.floor(Number(p.valor)) === Math.floor(invoice.valor) && p.numero === numeroParcela
          );

          if (parcela && invoice.situacao === 'pago') {
            const statusPago = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 2 } });
            parcela.status_pagamento = statusPago;
            parcela.data_pagamento = new Date(invoice.dataVencimento);
            await this.parcelaRepository.save(parcela);
            console.log(`💰 Parcela ${parcela.numero} da venda ${codigoPedido} marcada como paga.`);
          } else {
            console.warn(`⚠️ Nenhuma parcela correspondente para valor ${invoice.valor} no pedido ${codigoPedido}`);
          }

          venda.numero_nfe = Number(numeroNota);
          await this.vendaRepository.save(venda);
          console.log(`✅ Nota fiscal ${numeroNota} vinculada à venda ${codigoPedido}`);
        }

        offset += limit;
      } catch (error) {
        console.error(`❌ Erro ao buscar faturas para ${uf}:`, error.message);
        break;
      }
    }
  }

  private async getAccessKeyNf(uf: string, apiUrl: string, updatedSales: Set<string>): Promise<void> {
    let offset = 0;
    const limit = 100;
    const token = await this.tinyAuthService.getAccessToken(uf);

    if (!token) {
      console.error(`❌ Erro ao obter token para ${uf}. Pulando sincronização.`);
      return;
    }

    let hj = new Date();
    hj.setDate(hj.getDate() - 2);
    const data = hj.toISOString().split('T')[0];

    while (true) {
      try {
        const url = `${apiUrl}${this.nfeTag}?dataInicial=${data}&offset=${offset}&limit=${limit}`;
        const response = await this.httpService.axiosRef.get<{ itens: NfeDto[] }>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const nfData = response.data.itens;

        if (!nfData || nfData.length === 0) {
          console.log(`🚫 Nenhuma conta encontrada para ${uf} no offset ${offset}.`);
          break;
        }

        for (const nf of nfData) {
          const nfNumero = nf.numero.replace(/^0+/, '');
          const venda = await this.vendaRepository.findOne({ where: { numero_nfe: Number(nfNumero) } });

          if (!venda || venda.chave_acesso) {
            console.warn(`⚠️ Venda não encontrada ou ja está vinculada nf-e: ${nf.numero}`);
            continue;
          }

          venda.chave_acesso = nf.chaveAcesso;
          venda.data_emissao_nfe = new Date(nf.dataEmissao);
          venda.nfe_emitida = 1;
          venda.nfe_id = nf.id;
          venda.nfe_link = await this.getNflink(nf.id, uf);
          await this.vendaRepository.save(venda);
          updatedSales.add(venda.codigo.toString());
          console.log(`✅ Chave de acesso ${nf.chaveAcesso} vinculada à venda ${venda.codigo}`);
        }

        offset += limit;
      } catch (error) {
        console.error(`❌ Erro ao buscar contas para ${uf}:`, error.message);
        break;
      }
    }
  }

  private async getNflink(id: number, uf: string): Promise<string | null> {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const url = `${this.apiUrlTiny}${this.nfeTag}/${id}/link`;
    const token = await this.tinyAuthService.getAccessToken(uf);

    try {
      await sleep(1000);
      const response = await this.httpService.axiosRef.get<{ link: string }>(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.link;
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn('⚠️ 429 recebido. Aguardando 5 segundos antes de tentar novamente...');
        await sleep(5000);
        return this.getNflink(id, uf);
      } else {
        console.error(`❌ Erro ao buscar link da nota para ${uf}:`, error.message);
        throw new BadRequestException({ message: error.message });
      }
    }
  } 

  async reportUniqueEanBySegment(): Promise<Record<string, { totalVendas: number, faturamento: number, fornecedores: Record<string, { uniqueEansCount: number, margem: number, participacao: number }> }>> {
    const vendas = await this.vendaRepository.find({
      relations: ['cliente.categoria_cliente', 'itensVenda', 'itensVenda.produto', 'itensVenda.produto.fornecedor'],
    });
  
    const segmentoMap: Record<string, {
      totalVendas: number,
      faturamento: number,
      fornecedores: Record<string, {
        eans: Set<string>,
        receita: number,
        custo: number
      }>
    }> = {};
  
    for (const venda of vendas) {
      const categoria = venda.cliente?.categoria_cliente?.nome;
      if (!categoria) continue;
  
      if (!segmentoMap[categoria]) {
        segmentoMap[categoria] = {
          totalVendas: 0,
          faturamento: 0,
          fornecedores: {},
        };
      }
  
      segmentoMap[categoria].totalVendas += 1;
  
      for (const item of venda.itensVenda) {
        const ean = item.produto?.ean?.toString();
        const fornecedor = item.produto?.fornecedor?.nome;
        const precoCusto = Number(item.produto?.preco_custo);
        const quantidade = Number(item.quantidade);
        const receita = Number(item.valor_total);
        const custoTotal = precoCusto * quantidade;
  
        if (!ean || receita <= 0) continue;
  
        segmentoMap[categoria].faturamento += receita;
  
        if (!segmentoMap[categoria].fornecedores[fornecedor]) {
          segmentoMap[categoria].fornecedores[fornecedor] = {
            eans: new Set<string>(),
            receita: 0,
            custo: 0,
          };
        }
  
        const fornecedorData = segmentoMap[categoria].fornecedores[fornecedor];
        fornecedorData.eans.add(ean);
        fornecedorData.receita += receita;
        fornecedorData.custo += custoTotal;
      }
    }
  
    const result: Record<string, {
      totalVendas: number,
      faturamento: number,
      fornecedores: Record<string, {
        uniqueEansCount: number,
        margem: number,
        participacao: number
      }>
    }> = {};
  
    for (const categoria in segmentoMap) {
      const totalFaturamento = segmentoMap[categoria].faturamento;
      const fornecedorData: Record<string, { uniqueEansCount: number, margem: number, participacao: number }> = {};
  
      for (const fornecedor in segmentoMap[categoria].fornecedores) {
        const data = segmentoMap[categoria].fornecedores[fornecedor];
        const receita = Number(data.receita);
        const custo = Number(data.custo);
        const margem = receita > 0 ? Number((((receita - custo) / receita) * 100).toFixed(2)) : 0;
        const participacao = totalFaturamento > 0 ? Number(((receita / totalFaturamento) * 100).toFixed(2)) : 0;
  
        fornecedorData[fornecedor] = {
          uniqueEansCount: data.eans.size,
          margem,
          participacao,
        };
      }
  
      result[categoria] = {
        totalVendas: segmentoMap[categoria].totalVendas,
        faturamento: Number(totalFaturamento.toFixed(2)),
        fornecedores: fornecedorData,
      };
    }
  
    console.log('relatorio ====>', result);
  
    return result;
  } 

    async reportSalesByBrandAndProduct(): Promise<
    Record<string, Record<string, { quantidade: number; valor: number }>>
  > {
    const vendas = await this.sellsBetweenDates('2025-04-01', '2025-04-30')

    const relatorio: Record<string, Record<string, { quantidade: number; valor: number }>> = {};

    for (const venda of vendas) {
      for (const item of venda.itensVenda) {
        const produto = item?.produto;
        const marca = produto?.fornecedor?.nome || 'Desconhecida';
        const nomeProduto = produto?.nome || 'Produto sem nome';
        const quantidade = Number(item.quantidade);
        const valor = Number(item.valor_total);

        if (!relatorio[marca]) {
          relatorio[marca] = {};
        }

        if (!relatorio[marca][nomeProduto]) {
          relatorio[marca][nomeProduto] = { quantidade: 0, valor: 0 };
        }

        relatorio[marca][nomeProduto].quantidade += quantidade;
        relatorio[marca][nomeProduto].valor += valor;
      }
    }

    for (const marca in relatorio) {
      for (const produto in relatorio[marca]) {
        relatorio[marca][produto].valor = Number(
          relatorio[marca][produto].valor.toFixed(2)
        );
      }
    }

    return relatorio;
  }

  updateStatusSell(id: number): Promise<void> {
    const url = `${this.apiUrlTiny}${this.orderTag}/${id}`;
    try {
      return this.httpService.axiosRef.put(url, { status_id: 11541 }, {
        headers: {
          Authorization: `Bearer ${this.tokenSellentt}`,
          'Content-Type': 'application/json',
        },
      }).then(() => {
        console.log(`Status da venda ${id} atualizado com sucesso.`);
      });
    }
    catch (error) {
      console.error(`Erro ao atualizar o status da venda ${id}:`, error.message);
      throw new BadRequestException({ message: error.message });
    }
  }
}