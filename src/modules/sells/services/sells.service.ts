import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { Produto, Venda, ParcelaCredito, StatusPagamento, StatusVenda, Syncro, TipoPedido } from '../../../infrastructure/database/entities';
import { OrderTinyDto, SellsApiResponse, UpdateSellStatusDto } from '../dto';
import { ICustomersRepository, ISellersRepository, IRegionsRepository, ISellsRepository, ITinyAuthRepository } from '../../../domain/repositories';

@Injectable()
export class SellsService implements ISellsRepository {
  private readonly apiUrlSellentt: string;
  private readonly apiUrlTiny: string;
  private readonly tokenSellentt: string;
  private readonly tokenTiny: string;
  private readonly apiTagSellentt = 'orders';
  private readonly orderTag = 'pedidos';

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
    @Inject('ITinyAuthRepository') private readonly tinyAuthService: ITinyAuthRepository,
    private readonly httpService: HttpService,
  ) {
    this.tokenSellentt = process.env.SELLENTT_API_TOKEN;
    this.tokenTiny = process.env.TINY_API_TOKEN;
    this.apiUrlSellentt = process.env.SELLENTT_API_URL;
    this.apiUrlTiny= process.env.TINY_API_URL;
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

        // Build query parameters
        const params = [];
        if (lastSync) params.push(`after_created=${this.formatDateWithTime(lastSync)}`);
        if (lastUpdate) params.push(`after_updated=${this.formatDateWithTime(lastUpdate)}`);

        let currentPage = 1;
        let lastPage = 1;

        do {
            // Construct URL with pagination
            const url = `${this.apiUrlSellentt}${this.apiTagSellentt}?${params.join('&')}&page=${currentPage}`;
            console.log('Fetching URL:', url);

            const response = await this.httpService.axiosRef.get<{ data: SellsApiResponse[], meta: { current_page: number, last_page: number } }>(url, {
                headers: { Authorization: `Bearer ${this.tokenSellentt}` },
            });

            const sellsData = response.data.data;
            lastPage = response.data.meta.last_page; // Get last page

            for (const sell of sellsData) {
                const result = await this.processSell(sell);

                // Collect sales codes
                if (result?.includes('Atualizada')) {
                    updatedSales.push(result.split(' ')[1]); // Extract sale code
                } else if (result?.includes('Recebida')) {
                    syncedSales.push(result.split(' ')[2]); // Extract sale code
                }
            }

            currentPage++; // Move to next page
        } while (currentPage <= lastPage);

        // Update sync timestamps
        const now = new Date();
        await this.updateLastSyncDate('sells', now);
        await this.updateLastUpdateDate('sells', now);

        // Add summary messages
        if (syncedSales.length > 0) {
            messages.push(`Código das vendas sincronizadas: ${syncedSales.join(', ')}.`);
        }
        if (updatedSales.length > 0) {
            messages.push(`Código das vendas atualizadas: ${updatedSales.join(', ')}.`);
        }

        console.log(messages.join(' | '));
        return messages.join(' | '); // Return consolidated message
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

    const status_venda = await this.statusVendaRepository.findOne({
      where: { status_venda_id: sell.status.id },
    });

    const status_pagamento = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id: 1 },
    });

    let itensVenda = [];

    if(existingSell) {    
      existingSell.status_venda = status_venda;
      existingSell.observacao = sell.obs;
      if (new Date(sell.updated_at) > existingSell.data_criacao) {
          console.log(`Atualizando venda existente => ${sell.code}`);
          if (sell.amount_final != existingSell.valor_final) {
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
            existingSell.itensVenda = itensVenda;
            existingSell.valor_pedido = Number(sell.amount);
            existingSell.valor_final = Number(sell.amount_final);
            existingSell.desconto = sell.discount_total || 0

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
          
            return `Venda ${sell.code} Atualizada`;
          } else {
          console.log(`Venda já existente e atualizada => ${sell.code}`);
          }
          return;
      }
    }

    // Se a venda não existir, crie-a
    console.log('Criando nova venda =>', sell.code);

    // Busque e associe os dados necessários
    const cliente = await this.clienteService.findCustomerByCode(sell.store ? Number(sell.store.erp_id) : 0);
    const vendedor = await this.sellersSevice.findBy({ codigo: Number(sell.seller_code) });

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

    // Verifica se payment_term_text não é nulo ou indefinido
    if (sell.payment_term_text) {
      // Split the string into two parts: before and after "dias"
      const paymentParts = sell.payment_term_text.split(/(dias)/);
      const firstPart = paymentParts[0]; // Contains numbers before "dias"
      const secondPart = paymentParts.slice(1).join(''); // Everything after "dias"

      // Process only the first part (increment numbers and replace '/' with ', ')
      const updatedFirstPart = firstPart
          .replace(/\d+/g, (match) => (Number(match) + 1).toString())
          .replace(/\//g, ', ');

      // Reconstruct the full string
      var formattedPaymentTermText = updatedFirstPart + secondPart;
    } else {
      var formattedPaymentTermText = ''; // Retorna string vazia se for nulo ou indefinido
    }

    const novaVenda = this.vendaRepository.create({
      codigo: Number(sell.code),
      observacao: sell.obs,
      numero_parcelas: sell.installment_qty,
      valor_parcela: Number(sell.installment_value),
      metodo_pagamento: sell.payment_method_text || '',  // Corrigido para evitar valor NULL
      forma_pagamento: formattedPaymentTermText,
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
        relations: ['cliente.cidade.estado', 'vendedor', 'status_pagamento', 'status_venda', 'itensVenda.produto', 'tipo_pedido'],
      });
    }
    return this.vendaRepository.find({
      relations: ['cliente.cidade.estado', 'vendedor', 'status_pagamento', 'status_venda', 'itensVenda.produto', 'tipo_pedido'],
    });
  }

  async getSellById(id: number): Promise<Venda> {
    return this.vendaRepository.findOne({
      where: { venda_id: id },
      relations: [
        'cliente',
        'vendedor',
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

        const itensComErro = order.itensVenda.filter(item => !item.produto.tiny_mg && !item.produto.tiny_sp);

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
            data: order.data_criacao?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
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
}

