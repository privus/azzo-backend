import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Not, Raw, Repository } from 'typeorm';
import { Produto, Venda, ParcelaCredito, StatusPagamento, StatusVenda, Syncro, TipoPedido, Cliente, ItensVenda, SaidaEstoque, MetaVendedor } from '../../../infrastructure/database/entities';
import { OrderTinyDto, SellsApiResponse, UpdateSellStatusDto, BrandSales, Commissions, RakingSellsResponse, BrandPositivity, ReportBrandPositivity, PositivityResponse, RankingItem, SalesComparisonReport, NfeDto, InvoiceTinyDto, ProjectStockDto, GroupSalesResponse, CustomerGroupSalesDto, WeeklyAid, OrdeBlingDto, NfeBlingDTO, OrdersBlingResponseDto, OrderBlingResponseDto } from '../dto';
import { ICustomersRepository, ISellersRepository, IRegionsRepository, ISellsRepository, ITinyAuthRepository, IBlingAuthRepository } from '../../../domain/repositories';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { Ecommerce } from 'src/infrastructure/database/entities/ecommerce';

@Injectable()
export class SellsService implements ISellsRepository {
  private readonly logger = new Logger(SellsService.name);

  private readonly apiUrlSellentt: string;
  private readonly apiUrlTiny: string;
  private readonly tokenSellentt: string;
  private readonly apiTagSellentt = 'orders';
  private readonly orderTag = 'pedidos';
  private readonly orderTagBling = 'pedidos/vendas';
  private readonly nfeTagTiny = 'notas';
  private readonly contasReceberTag = 'contas-receber';
  private readonly nfeTagBling = 'nfe';
  private readonly apiBlingUrl: string;

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
    @InjectRepository(SaidaEstoque) private readonly saidaRepository: Repository<SaidaEstoque>,
    private readonly httpService: HttpService,
    @Inject('IBlingAuthRepository') private readonly blingAuthService: IBlingAuthRepository,
    @InjectRepository(MetaVendedor) private readonly metaRepository: Repository<MetaVendedor>,
    @InjectRepository(Ecommerce) private readonly ecommerceRepository: Repository<Ecommerce>,
  ) {
    this.tokenSellentt = process.env.SELLENTT_API_TOKEN;
    this.apiUrlSellentt = process.env.SELLENTT_API_URL;
    this.apiUrlTiny = process.env.TINY_API_URL;
    this.apiBlingUrl = process.env.BLING_API_URL;
  }

  async syncroSells(): Promise<string> {
    const messages: string[] = [];
    const syncedSales: string[] = [];
    const updatedSales: string[] = [];
  
    await this.clienteService.syncroLastPageCustomers();
  
    const lastSync = await this.getLastSyncDate('sells');
    const lastUpdate = await this.getLastUpdateDate('sells-update');
  
    console.log('Última sincronização:', lastSync);
    console.log('Última atualização:', lastUpdate);
  
    const fetchSells = async (queryParam: string, type: 'created' | 'updated') => {
      let currentPage = 1;
      let lastPage = 1;
      const maxPage = 12;
  
      do {
        const s = lastSync ? '&' : '?';
        const url = `${this.apiUrlSellentt}${this.apiTagSellentt}${queryParam}${s}page=${currentPage}`;
        console.log('Fetching URL:', url);
  
        const response = await this.httpService.axiosRef.get<{
          data: SellsApiResponse[],
          meta: { current_page: number, last_page: number }
        }>(url, {
          headers: { Authorization: `Bearer ${this.tokenSellentt}` },
        });
  
        const sellsData = response.data.data;
        lastPage = response.data.meta.last_page;
        console.log('lastPage ===============>', lastPage);
  
        for (const sell of sellsData) {
          const result = await this.processSell(sell);
  
          if (result?.startsWith('Atualizada')) {
            updatedSales.push(result.replace('Atualizada', '').trim());
          } else if (result?.startsWith('Recebida')) {
            syncedSales.push(result.replace('Recebida', '').trim());
          }          
        }
  
        currentPage++;
      } while (currentPage <= lastPage && currentPage <= maxPage);
    };
  
    try {

      const createdParam = lastSync ? `?after_created=${this.formatDateWithTime(lastSync)}` : ''
      await fetchSells(createdParam, 'created');
      
      if (lastUpdate) {
        const updatedParam = `?after_updated=${this.formatDateWithTime(lastUpdate)}`
        await fetchSells(updatedParam, 'updated');
      }
  
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
      this.associatePairedSells();
      console.log(messages.join(' | '));
      return messages.join(' | ');
    } catch (error) {
      console.error('Erro ao sincronizar vendas:', error);
      return 'Erro ao sincronizar vendas.';
    }
  } 

  async syncroStatusSells(): Promise<void> {
    let currentPage = 1;
    const maxPage = 10;
  
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
    const existingSell = await this.getSellByCode(Number(sell.code));
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
      // existingSell.status_venda = status_venda;
      existingSell.observacao = sell.obs;
      existingSell.comisao = Number(sell.commission) || 0;
      existingSell.fora_politica = sell.politics_out;
        if (existingSell.nfe_id && !existingSell.nfe_link) {
          const link = await this.getNflink(existingSell.nfe_id, cliente.cidade.estado.sigla);
          existingSell.nfe_link = link;
        }
          if (existingSell.valor_final != sell.amount_final || sell.installment_qty != existingSell.numero_parcelas) {
            await this.revertSaleStock(existingSell);
            console.log('Venda já existente e atualizando carrinho =>', sell.code);
            existingSell.itens_atualizacao = new Date();
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
            existingSell.forma_pagamento = sell.payment_term_text || '';
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
                  data_criacao: new Date(),
                  data_vencimento: data,
                  status_pagamento,
                  descricao: `Venda código ${sell.code}`
              });
            });
            
            existingSell.datas_vencimento = datas_vencimento;
            existingSell.parcela_credito = parcela_credito;

            await this.vendaRepository.save(existingSell);
            await this.clienteService.saveCustomer(cliente);
            await this.decrementStockSell(existingSell.codigo);
            const carrinho = existingSell.itens_atualizacao ? ' 🛒' : ''
          
            return `Atualizada ${sell.code + carrinho}`;
          } else {
          console.log(`Venda já existente e atualizada => ${sell.code}`);
          }
          
      await this.vendaRepository.save(existingSell);
      await this.clienteService.saveCustomer(cliente);
      return `Atualizada ${sell.code}`;

    }

    console.log('Criando nova venda =>', sell.code);

    const regiao = await this.regiaoService.getRegionByCode(sell.region);

    let datas_vencimento = [];
    let parcela_credito = [];

    if (sell.order_type_id === 10438) {
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
                descricao: `Venda código ${sell.code}`
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

    if (sell.order_type_id === 10438) {
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
      fora_politica: sell.politics_out,
    });

    await this.vendaRepository.save(novaVenda);
    await this.decrementStockSell(novaVenda.codigo);
    return `Recebida ${sell.code}`;
  }

  private async decrementStockSell(code:number): Promise<void> {
    const venda = await this.getSellByCode(code);

    for (const item of venda.itensVenda) {
      const produtoVenda = item.produto;
      if (!produtoVenda) continue;
  
      // Determina o produto base de controle de estoque
      const produtoEstoque = produtoVenda.unidade || produtoVenda;
  
      // Quantidade convertida para unidades base
      let quantidadeEmUnidadesBase = Number(item.quantidade);
      if (produtoVenda.qt_uni && produtoVenda.unidade) {
        quantidadeEmUnidadesBase *= produtoVenda.qt_uni;
      }    
  
      const saida = this.saidaRepository.create({
        produto: produtoEstoque,
        quantidade: quantidadeEmUnidadesBase,
        data_saida: new Date(),
        venda: venda,
        observacao: `Saída por ${venda.tipo_pedido.nome} - ${venda.codigo}`,
      });
      await this.produtoRepository.decrement({ produto_id: produtoEstoque.produto_id }, 'saldo_estoque', quantidadeEmUnidadesBase);
  
      await this.saidaRepository.save(saida);
    }
    
  }

  async associatePairedSells(): Promise<void> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const t = today.toISOString().split('T')[0];
    const y = yesterday.toISOString().split('T')[0];
  
    const vendasHoje = await this.sellsBetweenDates(y, t);
  
    const vendasPorCliente: Map<number, Venda[]> = new Map();
  
    for (const venda of vendasHoje) {
      const clienteId = venda.cliente?.cliente_id;
      if (!clienteId || clienteId === 558) continue;
      if (!vendasPorCliente.has(clienteId)) {
        vendasPorCliente.set(clienteId, []);
      }
      vendasPorCliente.get(clienteId)!.push(venda);
    }
  
    for (const vendas of vendasPorCliente.values()) {
      if (vendas.length < 2) continue;
  
      const vendaPrincipal = vendas.find(v => v.tipo_pedido?.tipo_pedido_id === 10438);
      const vendaAssociada = vendas.find(v => v.tipo_pedido?.tipo_pedido_id !== 10438);
  
      if (vendaPrincipal && vendaAssociada) {
        vendaPrincipal.associado = vendaAssociada.codigo;
        vendaAssociada.associado = vendaPrincipal.codigo;
        await this.vendaRepository.save([vendaPrincipal, vendaAssociada]);
      }
    }
  }

  async sellsByDate(fromDate?: string): Promise<Venda[]> {
    if (fromDate) {
      return this.vendaRepository.find({
        where: {
          data_criacao: MoreThanOrEqual(new Date(fromDate)),
        },
        relations: ['cliente.cidade.estado', 'vendedor', 'status_pagamento', 'status_venda', 'itensVenda.produto.unidade', 'itensVenda.produto.fornecedor', 'tipo_pedido'],
      });
    }
    return this.vendaRepository.find({
      relations: ['cliente.cidade.estado', 'vendedor', 'status_pagamento', 'status_venda', 'itensVenda.produto.unidade', 'itensVenda.produto.fornecedor', 'tipo_pedido'],
    });
  }

  async sellsBetweenDates(fromDate: string, toDate?: string): Promise<Venda[]> {
    let where: any = {};
    console.log('fromDate==========================>', fromDate, 'toDate =============================>', toDate);
  
    if (toDate) {
      where.data_criacao = Raw(
        alias => `DATE(${alias}) BETWEEN :from AND :to`,
        { from: fromDate, to: toDate }
      );
    } else {
      where.data_criacao = Raw(
        alias => `DATE(${alias}) = :from`,
        { from: fromDate }
      );
    }
  
    return this.vendaRepository.find({
      where,
      relations: [
        'cliente.grupo',
        'cliente.cidade.estado',
        'vendedor',
        'status_pagamento',
        'status_venda',
        'itensVenda.produto',
        'itensVenda.produto.fornecedor', 
        'tipo_pedido'
      ],
    });
  }

  async getSellByCode(id: number): Promise<Venda> {
    return this.vendaRepository.findOne({
      where: { codigo: id },
      relations: [
        'vendedor',
        'itensVenda.produto.fornecedor',
        'status_pagamento',
        'status_venda',
        'parcela_credito.status_pagamento',
        'tipo_pedido',
        'cliente.cidade.estado',
        'cliente.categoria_cliente',
        'cliente.regiao',
        'itensVenda.produto.unidade',
      ],
    });
  }

  async updateSellStatus(UpdateSellStatusDto: UpdateSellStatusDto): Promise<string> {
    const { codigo, status_venda_id, numero_nfe, valor_frete } = UpdateSellStatusDto;

    const venda = await this.getSellByCode(codigo);

    if (!venda) {
      throw new Error(`Venda com ID ${codigo} não encontrada.`);
    }


    if (status_venda_id === 11468) {
      await this.revertSaleStock(venda);
      await this.parcelaRepository.delete({ venda: { venda_id: venda.venda_id } });
      venda.parcela_credito = [];
    }

    const novoStatus = await this.statusVendaRepository.findOne({ where: { status_venda_id } });

    if (!novoStatus) {
      throw new Error(`Status de venda com ID ${status_venda_id} não encontrado.`);
    }

    await this.updateStatus(codigo, status_venda_id);
    venda.numero_nfe = numero_nfe;
    venda.valor_frete = valor_frete;
    venda.status_venda = novoStatus;
    await this.vendaRepository.save(venda);

    return `Status da venda ${venda.codigo} atualizado para ${novoStatus.nome}, Nf-e nº ${numero_nfe}.`;
  }

  async updateStatus(codigo: number, status_venda_id: number): Promise<void> {
    const venda = await this.vendaRepository.findOne({
      where: { codigo },
      relations: ['status_venda'],
    });
    const novoStatus = await this.statusVendaRepository.findOne({ where: { status_venda_id } });
    venda.status_venda = novoStatus;
    await this.updateStatusSellentt(codigo, status_venda_id);
    await this.vendaRepository.save(venda);
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
          const uf = order.cliente.cidade.estado.sigla === 'MG' || order.cliente.cidade.estado.sigla === 'SP' 
            ? order.cliente.cidade.estado.sigla 
            : 'MG';
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
    const venda = await this.getSellByCode(code);

    if (!venda) {
        throw new Error(`Venda com ID ${code} não encontrada.`);
    }

    await this.revertSaleStock(venda);

    // Exclui a venda diretamente (parcelas serão excluídas automaticamente pelo cascade)
    await this.vendaRepository.remove(venda);

    return `Venda com ID ${code} e suas parcelas foram excluídas com sucesso.`;
  }

  private async revertSaleStock(venda: Venda): Promise<void> {
    for (const item of venda.itensVenda) {
      const produtoVenda = item.produto;
      if (!produtoVenda) continue;
  
      const produtoEstoque = produtoVenda.unidade || produtoVenda;
  
      let quantidadeEmUnidadesBase = Number(item.quantidade);
      if (produtoVenda.qt_uni && produtoVenda.unidade) {
        quantidadeEmUnidadesBase *= produtoVenda.qt_uni;
      }
  
      await this.produtoRepository.increment({ produto_id: produtoEstoque.produto_id }, 'saldo_estoque', quantidadeEmUnidadesBase);
    }
  
    // Também apaga os registros de saída de estoque dessa venda
    await this.saidaRepository.delete({ venda });
  }
  
  async getDailyRakingSells(): Promise<RakingSellsResponse> {
    // Ajuste de datas para considerar só o dia
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
  
    const ontem = new Date(hoje);
    // Segunda-feira (1): busca sexta (hoje - 3 dias). Demais dias: busca ontem
    if (hoje.getDay() === 1) {
      ontem.setDate(hoje.getDate() - 3);
    } else {
      ontem.setDate(hoje.getDate() - 1);
    }
  
    const hojeStr = hoje.toISOString().slice(0, 10);   // 'YYYY-MM-DD'
    const ontemStr = ontem.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  
    // Busca as vendas só pela data (ignorando horário)
    const todaySales = await this.sellsBetweenDates(hojeStr);
    const yesterdaySales = await this.sellsBetweenDates(ontemStr);
  
    const allSellers = (await this.sellersSevice.findAllSellers())
      .filter(v => v.ativo && v.vendedor_id !== 12);
  
    const buildRanking = (sells: Venda[]) => {
      const rankingMap: Record<number, RankingItem> = {};
  
      for (const seller of allSellers) {
        rankingMap[seller.vendedor_id] = {
          id: seller.vendedor_id,
          nome: seller.nome,
          total: 0,
          numero_vendas: 0,
          codigos_vendas: [],
          pureli: 0,
        };
      }
  
      const pedidosContabilizadosFornecedor7 = new Set<number>();
  
      for (const sell of sells) {
        const { vendedor, tipo_pedido, itensVenda } = sell;
        if (!vendedor.ativo || vendedor.vendedor_id === 12) continue;
        if (tipo_pedido?.tipo_pedido_id !== 10438) continue;
  
        const id = vendedor.vendedor_id;
        const entry = rankingMap[id];
  
        entry.total += Number(sell.valor_final);
        entry.numero_vendas += 1;
        entry.codigos_vendas.push(Number(sell.codigo));
  
        const temFornecedor7 = itensVenda.some(
          item => item.produto?.fornecedor?.fornecedor_id === 7
        );
  
        if (temFornecedor7 && !pedidosContabilizadosFornecedor7.has(sell.codigo)) {
          entry.pureli += 1;
          pedidosContabilizadosFornecedor7.add(sell.codigo);
        }
      }
  
      return Object.values(rankingMap)
        .sort((a, b) => b.total - a.total);
    };
  
    return {
      today: buildRanking(todaySales),
      yesterday: buildRanking(yesterdaySales),
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
      if (venda.tipo_pedido.tipo_pedido_id !== 10438 || venda.status_venda.status_venda_id === 11468) continue;
  
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

  async commissionBySeller(fromDate: string, toDate: string): Promise<Commissions[]> {
    const vendasMes = await this.sellsBetweenDates(fromDate, toDate);
    const tipoId = 10438;
  
    const todosVendedores = (await this.sellersSevice.findAllSellers())
      .filter(v => v.ativo && ![18, 12, 16].includes(v.vendedor_id));
  
    const vendedorMap = new Map<number, Commissions>();
    for (const vendedor of todosVendedores) {
      vendedorMap.set(vendedor.vendedor_id, {
        vendedor_id: vendedor.vendedor_id,
        vendedor: vendedor.nome,
        faturado: 0,
        pedidos: 0,
        comissao: 0,
        ticketMedio: 0,
      });
    }
  
    for (const venda of vendasMes) {
      if (venda.tipo_pedido?.tipo_pedido_id !== tipoId || venda.status_venda?.status_venda_id === 11468) continue;
  
      const vendedor = venda.vendedor;
      const vendedorId = vendedor.vendedor_id;
  
      if (!vendedorMap.has(vendedorId)) continue;
  
      const data = vendedorMap.get(vendedorId)!;
      data.faturado += Number(venda.valor_final);
      data.pedidos += 1;
      data.comissao += Number(venda.comisao);
    }
  
    const [ano, mes] = fromDate.split('-').map(Number);  
  
    const metas = await this.metaRepository.find({
      where: { mes, ano },
      relations: ['vendedor'],
    });
  
    for (const meta of metas) {
      const vendedorId = meta.vendedor.vendedor_id;
      const progresso = vendedorMap.get(vendedorId);
      if (!progresso) continue;
  
      if (meta.meta_ped > 0 || Number(meta.meta_fat) > 0) {
        progresso.meta_ped = meta.meta_ped;
        progresso.meta_fat = meta.meta_fat;
        progresso.progresso_ped = Number(((progresso.pedidos / meta.meta_ped) * 100).toFixed(2));
        progresso.progresso_fat = Number(((progresso.faturado / Number(meta.meta_fat)) * 100).toFixed(2));
      }
    }
  
    return Array.from(vendedorMap.values()).map(v => ({
      ...v,
      faturado: Number(v.faturado.toFixed(2)),
      comissao: Number(v.comissao.toFixed(2)),
      ticketMedio: v.pedidos > 0 ? Number((v.faturado / v.pedidos).toFixed(2)) : 0,
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
    // Busca vendas dos períodos comparativos
    const vendasPeriodo1 = await this.sellsBetweenDates(fromDate1, toDate1);
    const vendasPeriodo2 = await this.sellsBetweenDates(fromDate2, toDate2);
  
    const tipoId = 10438;
    const statusIgnorar = 11468;
  
    // Filtra tipo de pedido e remove vendas com status 11468
    const vendasValidasPeriodo1 = vendasPeriodo1.filter(
      v =>
        v.tipo_pedido?.tipo_pedido_id === tipoId &&
        v.status_venda?.status_venda_id !== statusIgnorar
    );
  
    const vendasValidasPeriodo2 = vendasPeriodo2.filter(
      v =>
        v.tipo_pedido?.tipo_pedido_id === tipoId &&
        v.status_venda?.status_venda_id !== statusIgnorar
    );
  
    const totalPeriodo1 = vendasValidasPeriodo1.reduce(
      (acc, venda) => acc + Number(venda.valor_final || 0),
      0
    );
    const totalPeriodo2 = vendasValidasPeriodo2.reduce(
      (acc, venda) => acc + Number(venda.valor_final || 0),
      0
    );
  
    const variacao =
      totalPeriodo1 === 0
        ? totalPeriodo2 > 0
          ? 100
          : 0
        : ((totalPeriodo2 - totalPeriodo1) / totalPeriodo1) * 100;
  
    let direcao: 'aumento' | 'queda' | 'neutro' = 'neutro';
    if (variacao > 0) direcao = 'aumento';
    else if (variacao < 0) direcao = 'queda';
  
    // Relatório de marcas usando o período selecionado
    const relatorioPeriodoSelecionado = await this.reportBrandSalesBySeller(fromDate2, toDate2);
    const azzoData = relatorioPeriodoSelecionado["Azzo"] || { totalFaturado: 0, marcas: {} };
    const faturamentoMesAtual = azzoData.totalFaturado || 0;
  
    const faturamentoPorMarcaMesAtual: { [marca: string]: number } = {};
    if (azzoData.marcas) {
      for (const marca in azzoData.marcas) {
        faturamentoPorMarcaMesAtual[marca] = Number(
          azzoData.marcas[marca].valor?.toFixed(2) || 0
        );
      }
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
        const url = `${apiUrl}${this.contasReceberTag}?dataInicialEmissao=2025-06-11&offset=${offset}&limit=${limit}`;
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
    hj.setDate(hj.getDate() - 15);
    const data = hj.toISOString().split('T')[0];

    while (true) {
      try {
        const url = `${apiUrl}${this.nfeTagTiny}?dataInicial=${data}&offset=${offset}&limit=${limit}`;
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
    const url = `${this.apiUrlTiny}${this.nfeTagTiny}/${id}/link`;
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
    const todasAsVendas = await this.sellsBetweenDates('2025-06-02', '2025-06-06')

    const relatorio: Record<string, Record<string, { quantidade: number; valor: number }>> = {};

    for (const venda of todasAsVendas) {
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

  updateStatusSellentt(id: number, status_id: number): Promise<void> {
    const url = `${this.apiUrlSellentt}${this.apiTagSellentt}/${id}`;
    console.log('url ======', url)    
    try {
      return this.httpService.axiosRef.put(url, { status_id }, {
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

  async projectStockByProduct(): Promise<ProjectStockDto[]> {
    const statusVendaIds = [11139, 11138];
    const vendas = await this.vendaRepository.find({
      where: {
        status_venda: {
          status_venda_id: In(statusVendaIds || [])
        }
      },
      relations: ['itensVenda', 'itensVenda.produto', 'cliente'],
    });
  
    const resultMap: Map<string, ProjectStockDto> = new Map();
  
    const stripHtml = (html: string): string =>
      html.replace(/<[^>]+>/g, '').trim();
  
    for (const venda of vendas) {
      for (const item of venda.itensVenda) {
        const produto = item.produto;
        if (!produto?.codigo || !produto.nome) continue;
  
        if (!resultMap.has(produto.codigo)) {
          resultMap.set(produto.codigo, {
            codigo: produto.codigo,
            nome: produto.nome,
            sku: produto.ean,
            quantidade: 0,
            descricao_uni: stripHtml(produto.descricao_uni || ''),
            pedidos: [],
          });
        }
  
        const entry = resultMap.get(produto.codigo)!;
        entry.quantidade += Number(item.quantidade);
        if (venda.codigo) {
          entry.pedidos.push({
            codigo: venda.codigo,
            cliente: venda.cliente?.nome || '',
            data: venda.data_criacao ? new Date(venda.data_criacao).toISOString() : '',
          });
        }
      }
    }
  
    return Array.from(resultMap.values());
  }
  
  async saveSell(venda: Venda): Promise<void> {
    await this.vendaRepository.save(venda);
    return
  }

  async getSellsByStatus(statusIds: number[]): Promise<Venda[]> {
    return this.vendaRepository.find({
      where: {
        status_venda: {
          status_venda_id: In(statusIds)
        }
      },
      relations: ['itensVenda.produto.unidade']
    });
  }
  
  findSellsByRomaneio(romaneio_id: number): Promise<Venda[]> {
    return this.vendaRepository.find({
        where: {
            romaneio: {
                romaneio_id
            }
        },
    });
  }
  
    async customersPureli(): Promise<
    Array<{ 
      codigo: number;
      nome: string;
      cidade: string;
      regiao: string;
      quantidadeVendas: number;
    }>
  > {
    // Busca todas as vendas que têm itens do fornecedor_id 7, já populando as relações necessárias
    const vendas = await this.vendaRepository.find({
      relations: [
        'cliente.cidade',
        'cliente.regiao',
        'itensVenda.produto.fornecedor'
      ],
    });

    // Map para contabilizar por cliente
    const clientesMap = new Map<number, {
      codigo: number;
      nome: string;
      cidade: string;
      regiao: string;
      quantidadeVendas: number;
    }>();

    for (const venda of vendas) {
      if (!venda.cliente || !venda.itensVenda) continue;
      // Verifica se tem algum item desse fornecedor
      const temFornecedor7 = venda.itensVenda.some(
        item => item.produto?.fornecedor?.fornecedor_id === 7
      );
      if (!temFornecedor7) continue;

      const codigo = venda.cliente.codigo;
      if (!clientesMap.has(codigo)) {
        clientesMap.set(codigo, {
          codigo: codigo,
          nome: venda.cliente.nome,
          cidade: venda.cliente.cidade_string,
          regiao: venda.cliente.regiao?.nome || '',
          quantidadeVendas: 1
        });
      } else {
        clientesMap.get(codigo)!.quantidadeVendas += 1;
      }
    }

    return Array.from(clientesMap.values()).sort((a, b) => b.quantidadeVendas - a.quantidadeVendas);
  }

  async clearNfeData(code: number): Promise<string> {
    const venda = await this.vendaRepository.findOne({
      where: { codigo: code },
    })

    venda.numero_nfe = null;
    venda.chave_acesso = null;
    venda.data_emissao_nfe = null;
    venda.nfe_emitida = 0;
    venda.nfe_id = null;
    venda.nfe_link = null;

    await this.vendaRepository.save(venda);

    return `✅ Dados da Nf-e da venda #${code} foram limpos com sucesso.`;
  }

  async deleteParcelasNao10438Orm(): Promise<string> {
    const vendas = await this.vendaRepository.find({
      select: ['venda_id'],
      where: { tipo_pedido: { tipo_pedido_id: Not(10438) } },
      relations: ['tipo_pedido'],
    });
  
    const ids = vendas.map(v => v.venda_id);
    if (!ids.length) return 'Nenhuma parcela para deletar.';
  
    // delete em lotes para não estourar placeholders
    const chunk = 1000;
    let deletadas = 0;
    for (let i = 0; i < ids.length; i += chunk) {
      const slice = ids.slice(i, i + chunk);
      const res = await this.parcelaRepository
        .createQueryBuilder()
        .delete()
        .from(ParcelaCredito)
        .where('venda_id IN (:...ids)', { ids: slice })
        .execute();
      deletadas += res.affected ?? 0;
    }
    return `✅ ${deletadas} parcelas deletadas (tipo_pedido_id != 10438).`;
  }
  
  async groupConsumption(GroupSalesDto): Promise<GroupSalesResponse> {
    const { groupId, supplierId, fromDate, toDate } = GroupSalesDto;
    const vendas = await this.sellsBetweenDates(fromDate, toDate);
  
    const porCliente = new Map<number, CustomerGroupSalesDto>();
    let groupTotal = 0;
  
    for (const venda of vendas) {
      const cliente = venda.cliente;
      if (!cliente?.grupo || cliente.grupo.grupo_cliente_id !== +groupId) continue;
  
      // soma apenas itens do supplierId
      let somaVendaFornecedor = 0;
  
      for (const item of venda.itensVenda || []) {
        const fornecedor = item.produto?.fornecedor;
        if (fornecedor?.fornecedor_id !== +supplierId) continue;
  
        const valor = Number(item.valor_total) || 0;
        somaVendaFornecedor += valor;
  
        // cria cliente no mapa se não existir
        if (!porCliente.has(cliente.codigo)) {
          porCliente.set(cliente.codigo, {
            clienteCodigo: cliente.codigo,
            clienteNome: cliente.nome,
            totalValor: 0,
            pedidos: [],
            linksNfe: [],
          });
        }
  
        const entry = porCliente.get(cliente.codigo)!;
        entry.totalValor += valor;
  
        // adiciona o código do pedido
        const codigo = Number(venda.codigo);
        if (!Number.isNaN(codigo) && !entry.pedidos.includes(codigo)) {
          entry.pedidos.push(codigo);
        }
  
        // adiciona "codigo - link" da NFe (se existir)
        if (venda.nfe_link && !entry.linksNfe.includes(`${codigo} - ${venda.nfe_link}`)) {
          entry.linksNfe.push(`${codigo} - ${venda.nfe_link}`);
        }
      }
  
      groupTotal += somaVendaFornecedor;
    }
  
    // organiza resultado
    const clientes = Array.from(porCliente.values())
      .map(c => ({
        ...c,
        totalValor: Number(c.totalValor.toFixed(2)),
      }))
      .sort((a, b) => b.totalValor - a.totalValor);
  
    return {
      groupTotal: Number(groupTotal.toFixed(2)),
      clientes,
    };
  }
  
  async calculateWeeklyAid(fromDate: string, toDate: string): Promise<WeeklyAid> {
    const vendas = await this.sellsBetweenDates(fromDate, toDate);
    const tipoPedidoAlvo = 10438;
  
    const valorAntigo = 30;
    const valorNovo = 50;
  
    const from = new Date(fromDate);
    const to = new Date(toDate);
  
    const vendedoresAtivos = await this.sellersSevice.findAllSellers();
    const vendedoresMap = new Map(
      vendedoresAtivos
        .filter(v => v.ativo)
        .map(v => [v.vendedor_id, v.nome])
    );
  
    const result: WeeklyAid = {};
  
    for (const venda of vendas) {
      const isPedidoValido =
        venda.tipo_pedido?.tipo_pedido_id === tipoPedidoAlvo &&
        venda.status_venda?.status_venda_id !== 11468;
  
      if (!isPedidoValido) continue;
  
      const vendedor = venda.vendedor;
      if (!vendedor || !vendedoresMap.has(vendedor.vendedor_id)) continue;
  
      const vendedorId = vendedor.vendedor_id as number;
  
      if (vendedorId === 9 || vendedorId === 12) continue;
  
      const vendedorNome = vendedoresMap.get(vendedorId)!;
  
      if (!result[vendedorNome]) {
        result[vendedorNome] = {
          valor_total: 0,
          pedidos: 0,
          clientes_novos: 0,
        };
      }
  
      result[vendedorNome].pedidos++;
  
      const clienteCriacao = new Date(venda.cliente?.data_criacao);
      const isNovoCliente = clienteCriacao >= from && clienteCriacao <= to;
  
      let incrementoPedido = isNovoCliente ? valorNovo : valorAntigo;
  
      if (isNovoCliente) {
        result[vendedorNome].clientes_novos++;
      }
  
      result[vendedorNome].valor_total += incrementoPedido;
    }
  
    const vendedor19Nome = vendedoresMap.get(19);
    if (vendedor19Nome) {
      if (!result[vendedor19Nome]) {
        result[vendedor19Nome] = {
          valor_total: 0,
          pedidos: 0,
          clientes_novos: 0,
        };
      }
      result[vendedor19Nome].valor_total += 395;
    }

    const vendedor8Nome = vendedoresMap.get(8);
    if (vendedor8Nome) {
      if (!result[vendedor8Nome]) {
        result[vendedor8Nome] = {
          valor_total: 0,
          pedidos: 0,
          clientes_novos: 0,
        };
      }
      result[vendedor8Nome].valor_total += 185;
    }

    return result;
  }

  async exportBling(id: number): Promise<string> {
    try {
      const order = await this.vendaRepository.findOne({
        where: { venda_id: id },
        relations: [
          'cliente.cidade.estado',
          'itensVenda.produto',
          'parcela_credito',
          'tipo_pedido',
          'status_venda',
          'vendedor',
          'itensVenda.produto.unidade',
        ],
      });
  
      if (!order) {
        throw new BadRequestException({ message: `🚨 Pedido com ID ${id} não encontrado.` });
      }
  
      if (!order.cliente) {
        throw new BadRequestException({ message: `🚨 Cliente não encontrado para o pedido ${id}.` });
      }
  
      let idContato = order.cliente.bling_id_p;
      if (!idContato) {
        idContato = await this.clienteService.registerBling(order.cliente.codigo);
      }
  
      const token = await this.blingAuthService.getAccessToken('PURELI');
      if (!token) {
        throw new BadRequestException({ message: "🚨 Não foi possível obter um token válido para exportação." });
      }
  
      const body: OrdeBlingDto = {
        data: new Date(order.data_criacao).toISOString(),
        contato: { id: idContato },
        situacao: { id: 9 },
        categoria: { id: order.tipo_pedido.tipo_pedido_id },
        numeroPedidoCompra: order.codigo.toString(),
        observacoes: order.observacao || '',
        itens: order.itensVenda.map(item => {
          const produto = item.produto;
          const unidadeBase = produto.unidade || produto;
  
          let quantidadeUnidade = Number(item.quantidade);
          if (produto.qt_uni && produto.unidade) {
            quantidadeUnidade *= produto.qt_uni;
          }
  
          return {
            codigo: unidadeBase.codigo,
            unidade: 'UNI',
            descricao: unidadeBase.nome,
            quantidade: quantidadeUnidade,
            desconto: 0,
            valor: item.valor_total / quantidadeUnidade,
            produto: {
              id: unidadeBase.bling_id_p,
            },
          };
        }),
        transporte: {
          quantidadeVolumes: order.volume,
        },
      };
  
      const apiUrl = this.apiBlingUrl + this.orderTagBling;
      console.log('apiUrl =====', apiUrl);
  
      this.logger.log('📤 Enviando pedido para o Bling:', body);
  
      const resp = await this.httpService.axiosRef.post(apiUrl, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      order.exportado = 1;
      order.bling_id = resp.data.data.id;
      await this.vendaRepository.save(order);
  
      return `✅ Pedido ${order.codigo} exportado com sucesso para o Bling.`;
    } catch (error) {
      this.logger.error('❌ Erro ao exportar pedido para o Bling:', error?.response?.data || error.message);
      throw new BadRequestException({ message: `🚨 Erro ao exportar pedido para o Bling: ${error.message}` });
    }
  }

  async syncroBlingNfe(): Promise<string> {
    let pagina = 1;
    const updatedSales: string[] = [];
  
    const token = await this.blingAuthService.getAccessToken('PURELI');
    if (!token) {
      throw new BadRequestException({ message: "🚨 Não foi possível obter um token válido para exportação." });
    }
  
    while (true) {
      try {
        const url = `${this.apiBlingUrl}${this.nfeTagBling}?dataEmissaoInicial=2025-09-17&pagina=${pagina}`;
        const response = await this.httpService.axiosRef.get<{ data: NfeBlingDTO[] }>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const nfData = response.data.data;
        if (!nfData || nfData.length === 0) {
          this.logger.log(`🚫 Nenhuma nota fiscal encontrada na página ${pagina}. Encerrando...`);
          break;
        }
  
        for (const nf of nfData) {
          const dataEmissao = new Date(nf.dataEmissao);
          const numeroNota = nf.numero;
          const chaveAcesso = nf.chaveAcesso;
          const linkDanfe = `https://www.bling.com.br/relatorios/danfe.php?idNota1=${nf.id}`;
          const clienteBlingId = nf.contato.id;
  
          const dataMin = new Date(dataEmissao);
          const dataMax = new Date(dataEmissao);
          dataMin.setDate(dataMin.getDate() - 7);
          dataMax.setDate(dataMax.getDate() + 7);
  
          const vendasPossiveis = await this.vendaRepository.find({
            where: {
              cliente: { bling_id_p: clienteBlingId },
              tipo_pedido: { tipo_pedido_id: 10438 },
              data_criacao: Raw(alias => `DATE(${alias}) BETWEEN :start AND :end`, {
                start: dataMin.toISOString(),
                end: dataMax.toISOString(),
              }),
              chave_acesso: null,
              numero_nfe: null,
            },
            relations: ['cliente', 'tipo_pedido'],
          });
  
          if (!vendasPossiveis.length) {
            this.logger.warn(`⚠️ Nenhuma venda válida encontrada para NF ${numeroNota} (cliente ${nf.contato.nome})`);
            continue;
          }
  
          const venda = vendasPossiveis.reduce((maisProxima, atual) => {
            const atualDate = new Date(atual.data_criacao);
            const proximaDate = new Date(maisProxima.data_criacao);
            const diffAtual = Math.abs(atualDate.getTime() - dataEmissao.getTime());
            const diffProxima = Math.abs(proximaDate.getTime() - dataEmissao.getTime());
            return diffAtual < diffProxima ? atual : maisProxima;
          });         

          venda.numero_nfe = Number(numeroNota);
          venda.chave_acesso = chaveAcesso;
          venda.nfe_link = linkDanfe;
          venda.nfe_emitida = 1;
          venda.data_emissao_nfe = dataEmissao;
          venda.nfe_id = nf.id;
  
          await this.vendaRepository.save(venda);
          updatedSales.push(venda.codigo.toString());
  
          this.logger.log(`✅ Nota fiscal ${numeroNota} vinculada à venda ${venda.codigo} (cliente ${venda.cliente?.nome})`);
        }
  
        pagina++;
      } catch (error) {
        this.logger.error(`❌ Erro ao buscar notas na página ${pagina}`, error?.response?.data || error.message);
        break;
      }
    }
  
    return `🎉 Sincronização concluída. Vendas atualizadas: ${updatedSales.join(', ')}`;
  }

  async syncroEcommerceBling(): Promise<string> {
    const token = await this.blingAuthService.getAccessToken('PURELI');
    const updated: string[] = [];
  
    const shopee = 205488875;
    const mercadoLivre = 205478072;
  
    const lojas = [
      { nome: 'Shopee', id: shopee, skuColumn: 'sku_shoppe' },
      { nome: 'Mercado Livre', id: mercadoLivre, skuColumn: 'sku_mercadolivre' },
    ];
  
    console.log(`🚀 Iniciando sincronização de Shopee e Mercado Livre`);
  
    let pagina = 1;
  
    while (true) {
      const listUrl = `${this.apiBlingUrl}${this.orderTagBling}?dataInicial=2025-11-17&pagina=${pagina}`;
      const response = await this.httpService.axiosRef.get<{ data: OrdersBlingResponseDto[] }>(listUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const pedidos = response.data.data;
      if (!pedidos?.length) {
        console.log(`✅ Nenhum pedido encontrado na página ${pagina}.`);
        break;
      }
  
      for (const pedido of pedidos) {
        const loja = lojas.find(l => l.id === pedido.loja.id);
        const id = pedido.id;
        const status = pedido.situacao.id;
  
        if (!loja || pedido.loja.id === 0) continue;
  
        if (status === 12) {
          console.log(`🚫 Pedido ${id} (${loja.nome}) está cancelado. Revertendo...`);
          const existente = await this.ecommerceRepository.findOne({ where: { cod_bling: id } });
  
          if (existente) {
            const saidas = await this.saidaRepository.find({
              where: { observacao: `Saída por ${loja.nome} - ${id}` },
              relations: ['produto']
            });
  
            for (const saida of saidas) {
              await this.produtoRepository.increment(
                { produto_id: saida.produto.produto_id },
                'saldo_estoque',
                saida.quantidade
              );
              await this.saidaRepository.remove(saida);
              console.log(`↩️ Estoque revertido do produto ${saida.produto.codigo} (pedido ${id}).`);
            }
  
            await this.ecommerceRepository.remove(existente);
            console.log(`🗑️ Pedido ${id} removido da tabela e-commerce (cancelamento).`);
            updated.push(`Cancelado ${pedido.numero} (${loja.nome})`);
          } else {
            console.warn(`⚠️ Pedido ${id} (${loja.nome}) cancelado, mas não encontrado no banco.`);
          }
  
          continue;
        }
  
        if (status !== 9 && status !== 6) {
          console.log(`ℹ️ Pedido ${id} (${loja.nome}) ignorado (status ${status}).`);
          continue;
        }
  
        const existente = await this.ecommerceRepository.findOne({ where: { cod_bling: id } });
        if (existente) {
          existente.status_id = status;
          await this.ecommerceRepository.save(existente);
          console.warn(`⚠️ Pedido ${id} (${loja.nome}) já importado. Pulando...`);
          continue;
        }
  
        const detailUrl = `${this.apiBlingUrl}${this.orderTagBling}/${id}`;
        const detailResp = await this.httpService.axiosRef.get<{  data: OrderBlingResponseDto }>(detailUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const vendaDetalhe = detailResp.data.data;

        await this.sleep(2000);
  
        for (const item of vendaDetalhe.itens || []) {
          const { baseCodigo } = this.extractBaseSku(item.codigo);
          
          const produto = await this.produtoRepository
            .createQueryBuilder('produto')
            .where(`produto.${loja.skuColumn} = :sku`, { sku: item.codigo })
            .orWhere(`produto.${loja.skuColumn} = :baseSku`, { baseSku: baseCodigo })
            .orWhere('produto.codigo LIKE :codigo', { codigo: `${baseCodigo}%` })
            .andWhere('produto.unidade_id IS NULL')
            .getOne();
  
            if (!produto) {
              const errorMsg = `Produto não encontrado: ${item.codigo} (Pedido ${vendaDetalhe.numeroLoja} ${loja.nome})`;
              console.error(`❌ ${errorMsg}`);
              throw new BadRequestException({
                code: 'PRODUCT_NOT_FOUND',
                message: errorMsg,
                pedidoId: id,
                sku: item.codigo,
                loja: loja.nome,
              });
            }
        }
  
        const ecommerce = this.ecommerceRepository.create({
          codigo: pedido.numero,
          data_pedido: new Date(pedido.data),
          total_pedido: Number(pedido.total),
          cod_bling: id,
          cliente_cod: pedido.contato.id,
          cliente_nome: pedido.contato.nome,
          numero_doc: pedido.contato.numeroDocumento,
          cliente_tipo: pedido.contato.tipoPessoa,
          status_id: pedido.situacao.id,
          loja_id: pedido.loja.id
        });
  
        await this.ecommerceRepository.save(ecommerce);
  
        // 🔻 Processa saídas
        for (const item of vendaDetalhe.itens || []) {
          const { baseCodigo, kitMultiplier } = this.extractBaseSku(item.codigo);
          const quantidadeReal = item.quantidade * kitMultiplier;
  
          const produto = await this.produtoRepository
            .createQueryBuilder('produto')
            .where(`produto.${loja.skuColumn} = :sku`, { sku: item.codigo })
            .orWhere(`produto.${loja.skuColumn} = :baseSku`, { baseSku: baseCodigo })
            .orWhere('produto.codigo LIKE :codigo', { codigo: `${baseCodigo}%` })
            .andWhere('produto.unidade_id IS NULL') 
            .getOne();
  
          if (!produto) {
            console.error(`❌ Produto não encontrado para saída: ${item.codigo} (Pedido ${id}, ${loja.nome})`);
            continue;
          }
  
          const existingSaida = await this.saidaRepository.findOne({
            where: { observacao: `Saída por ${loja.nome} - ${id}`, produto: { produto_id: produto.produto_id } }
          });
  
          if (existingSaida) {
            console.warn(`⚠️ Saída já registrada para produto ${item.codigo} (Pedido ${id}, ${loja.nome}). Pulando...`);
            continue;
          }
  
          const saida = this.saidaRepository.create({
            produto,
            quantidade: quantidadeReal,
            data_saida: new Date(pedido.data),
            observacao: `Saída por ${loja.nome} - ${id}`,
            ecommerce
          });
  
          await this.produtoRepository.decrement(
            { produto_id: produto.produto_id },
            'saldo_estoque',
            quantidadeReal
          );
  
          await this.saidaRepository.save(saida);
          console.log(`📦 Saída registrada: ${item.codigo} → ${quantidadeReal} unid. (Pedido ${id})`);
        }
  
        updated.push(`Importado ${pedido.numero} (${loja.nome})`);
      }
  
      pagina++;
      
      await this.sleep(2000);
    }
  
    console.log(`✅ Finalizada sincronização de Shopee e Mercado Livre`);
    return `🎯 Sincronização concluída. Movimentos: ${updated.join(', ')}`;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractBaseSku(codigo: string): { baseCodigo: string; kitMultiplier: number } {
    let baseCodigo = codigo.trim();
    let kitMultiplier = 1;

    const upper = codigo.toUpperCase().trim();

    const matchKit = upper.match(/^(.*?)(KIT)(\d+)?$/i);
    if (matchKit) {
      baseCodigo = matchKit[1].trim();
      kitMultiplier = matchKit[3] ? parseInt(matchKit[3], 10) : 1;
      return { baseCodigo, kitMultiplier };
    }

    if (upper.includes('UNI')) {
      const idx = upper.indexOf('UNI');
      baseCodigo = codigo.substring(0, idx + 3).trim();
      return { baseCodigo, kitMultiplier };
    }

    if (upper.includes('_')) {
      baseCodigo = codigo.split('_')[0].trim();
      return { baseCodigo, kitMultiplier };
    }

    return { baseCodigo, kitMultiplier };
  }
  
  findAllEcommerce(): Promise<Ecommerce[]> {
    return this.ecommerceRepository.find();
  }

  ecommerceBetweenDates(fromDate: string, toDate?: string): Promise<Ecommerce[]> {
    let where: any = {};
  
    if (toDate) {
      where.data_pedido = Raw(
        alias => `DATE(${alias}) BETWEEN :from AND :to`,
        { from: fromDate, to: toDate }
      );
    }
    return this.ecommerceRepository.find({ where });
  }
}
