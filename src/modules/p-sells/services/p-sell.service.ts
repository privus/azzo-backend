import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import {
  PSell,
  PVenda,
  PCliente,
  PFormaPagamento,
  PEcommerce,
  PStatusVenda,
  StatusPagamento,
  Cidade,
  PProduto,
  PItensVenda,
  PStatusCliente,
  PVendedor,
  PParcelaCredito,
} from '../../../infrastructure/database/entities';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InstallmentsDto, UpdateSellDto } from '../dto';

@Injectable()
export class PSellsService {
  constructor(
    @InjectRepository(PSell) private readonly pSellsRepository: Repository<PSell>,
    @InjectRepository(PVenda) private readonly vendaRepository: Repository<PVenda>,
    @InjectRepository(PCliente) private readonly clienteRepository: Repository<PCliente>,
    @InjectRepository(PFormaPagamento) private readonly formaPagamentoRepository: Repository<PFormaPagamento>,
    @InjectRepository(PEcommerce) private readonly ecommerceRepository: Repository<PEcommerce>,
    @InjectRepository(PStatusVenda) private readonly statusVendaRepository: Repository<PStatusVenda>,
    @InjectRepository(StatusPagamento) private readonly statusPagamentoRepository: Repository<StatusPagamento>,
    @InjectRepository(Cidade) private readonly cidadeRepository: Repository<Cidade>,
    @InjectRepository(PProduto) private readonly produtoRepository: Repository<PProduto>,
    @InjectRepository(PItensVenda) private readonly itensVendaRepository: Repository<PItensVenda>,
    @InjectRepository(PStatusCliente) private readonly statusClienteRepository: Repository<PStatusCliente>,
    @InjectRepository(PVendedor) private readonly vendedorRepository: Repository<PVendedor>,
    @InjectRepository(PParcelaCredito) private readonly parcelaRepository: Repository<PParcelaCredito>,
  ) {}

  @Cron(CronExpression.EVERY_3_HOURS)
  async createSells() {
    const orders = await this.pSellsRepository.find();
    const statusPago = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 2 } });
    const statusPendente = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 1 } });
    const statusAtivo = await this.statusClienteRepository.findOne({ where: { status_cliente_id: 1 } });


    for (const order of orders) {
      let produtosPedido: any[] = [];

      if (Array.isArray(order.produtos)) {
        produtosPedido = order.produtos;
      } else if (typeof order.produtos === 'string') {
        try {
          produtosPedido = JSON.parse(order.produtos || '[]');
        } catch (e) {
          console.warn(`Erro ao fazer parse de produtos para o pedido ${order.p_venda_id}:`, e);
          produtosPedido = [];
        }
      }
      
      const produtosMap = new Map<number, PProduto>();

      for (const prod of produtosPedido) {
        let produto = await this.produtoRepository.findOne({ where: { codigo: prod.cod_produto } });

        if (!produto) {
          produto = this.produtoRepository.create({
            produto_id: prod.produto_id,
            nome: prod.nome_produto,
            preco: prod.preco_unitario,
            codigo: prod.cod_produto,
          });
          await this.produtoRepository.save(produto);
        }

        produtosMap.set(prod.produto_id, produto);
      }

      let cliente = await this.clienteRepository.findOne({ where: { nome: order.cliente_nome } });
      if (!cliente) {
        const cidade = await this.cidadeRepository.findOne({ where: { nome: order.cidade_string } });
        cliente = this.clienteRepository.create({
          nome: order.cliente_nome,
          tipo_doc: order.cliente_tipo,
          numero_doc: order.numero_doc,
          cidade: cidade || null,
          cidade_string: order.cidade_string,
          data_criacao: order.data_criacao_c,
          ultima_compra: order.data_pedido,
          valor_ultima_compra: order.total_pedido,
          status_cliente: statusAtivo,
        });
        await this.clienteRepository.save(cliente);
      }

      const vendedorId = order.atendente === null ? 2 : Number(order.atendente);
      const vendedor = await this.vendedorRepository.findOne({ where: { vendedor_id: vendedorId } });

      let formaPagamento = await this.formaPagamentoRepository.findOne({ where: { nome: order.forma_pagamento } });
      if (!formaPagamento) {
        formaPagamento = this.formaPagamentoRepository.create({ nome: order.forma_pagamento });
        await this.formaPagamentoRepository.save(formaPagamento);
      }

      let ecommerce = null;
      if (order.nome_ecommerce) {
        ecommerce = await this.ecommerceRepository.findOne({ where: { nome: order.nome_ecommerce } });
        if (!ecommerce) {
          ecommerce = this.ecommerceRepository.create({ nome: order.nome_ecommerce });
          await this.ecommerceRepository.save(ecommerce);
        }
      }

      let statusVenda = null;
      if (order.situacao) {
        statusVenda = await this.statusVendaRepository.findOne({ where: { nome: order.situacao } });
        if (!statusVenda) {
          statusVenda = this.statusVendaRepository.create({ nome: order.situacao });
          await this.statusVendaRepository.save(statusVenda);
        }
      }

      const status_pagamento = order.total_pedido === 0 ? statusPago : (order.forma_pagamento === 'Outro' ? statusPendente : statusPago);

      let vendaExistente = await this.vendaRepository.findOne({
        where: { venda_id: order.p_venda_id },
      });

      if (vendaExistente) {
        vendaExistente.data_criacao = order.data_pedido;
        vendaExistente.valor_frete = order.valor_frete;
        vendaExistente.valor_pedido = order.total_produtos;
        vendaExistente.valor_final = order.total_pedido;
        vendaExistente.desconto = order.valor_desconto || 0;
        vendaExistente.cliente = cliente;
        vendaExistente.forma_pagamento = formaPagamento;
        vendaExistente.ecommerce = ecommerce;
        vendaExistente.status_venda = statusVenda;
        vendaExistente.status_pagamento = status_pagamento;
        vendaExistente.fonte_lead = order.fonte_lead || null;
        vendaExistente.observacao = order.adicionais || null;
        vendaExistente.numero_tiny = Number(order.numero_tiny) || null;
        vendaExistente.vendedor = vendedor;
        vendaExistente.status_pagamento = status_pagamento;

        await this.vendaRepository.save(vendaExistente);
        await this.itensVendaRepository.delete({ venda: { venda_id: order.p_venda_id } });
      } else {
        vendaExistente = this.vendaRepository.create({
          venda_id: order.p_venda_id,
          data_criacao: order.data_pedido,
          valor_frete: order.valor_frete,
          valor_pedido: order.total_produtos,
          valor_final: order.total_pedido || 0,
          desconto: order.valor_desconto || 0,
          cliente,
          forma_pagamento: formaPagamento,
          ecommerce,
          status_venda: statusVenda,
          status_pagamento,
          fonte_lead: order.fonte_lead || null,
          observacao: order.adicionais || null,
          numero_tiny: Number(order.numero_tiny) || null,
          vendedor,
        });
        await this.vendaRepository.save(vendaExistente);
      }

      cliente.ultima_compra = order.data_pedido;
      cliente.valor_ultima_compra = order.total_pedido;
      await this.clienteRepository.save(cliente);

      for (const prod of produtosPedido) {
        const produto = produtosMap.get(prod.produto_id);
        if (!produto) continue;

        const itemVenda = this.itensVendaRepository.create({
          quantidade: prod.quantidade,
          valor_unitario: prod.preco_unitario,
          valor_total: prod.valor_total,
          lucro_bruto: prod.lucro_produto,
          observacao: prod.observacao || '',
          venda: vendaExistente,
          produto: produto,
        });

        await this.itensVendaRepository.save(itemVenda);
      }
    }
  }

  sellsByDate(fromDate?: string) {
    if (fromDate) {
      return this.vendaRepository.find({
        where: {
          data_criacao: MoreThanOrEqual(new Date(fromDate)),
        },
        relations: [
          'cliente',
          'forma_pagamento',
          'ecommerce',
          'status_venda',
          'status_pagamento',
          'itensVenda',
          'itensVenda.produto',
          'vendedor',
        ]
      });
    }
    return this.vendaRepository.find({
      relations: [
        'cliente',
        'forma_pagamento',
        'ecommerce',
        'status_venda',
        'status_pagamento',
        'itensVenda',
        'itensVenda.produto',
        'vendedor',
      ],      
    });
  }

  getSellById(id: number) {
    return this.vendaRepository.findOne({
      where: { venda_id: id },
      relations: [
        'cliente',
        'forma_pagamento',
        'ecommerce',
        'status_venda',
        'status_pagamento',
        'itensVenda',
        'itensVenda.produto',
        'vendedor',
        'parcela_credito.status_pagamento',        
      ],
    });
  }

  async generateInstallments(venda_id: number, installments: InstallmentsDto[]) {
    // Opcional: Remover parcelas antigas dessa venda antes de criar novas
    await this.parcelaRepository.delete({ venda: { venda_id } });
    const statusPago = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 2 } }); 
    const statusPendente = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 1 } });

    const saved = [];
    for (const par of installments) {
      const status_pagamento = par.data_pagamento ? statusPago : statusPendente;
      const parcela = this.parcelaRepository.create({
        venda: { venda_id },
        valor: par.valor,
        numero: par.numero,
        data_vencimento: par.data_vencimento,
        data_competencia: par.data_competencia,
        data_pagamento: par.data_pagamento || null,
        status_pagamento,
      });
      saved.push(await this.parcelaRepository.save(parcela));
    }
    return saved;
  }

  findAllPaymentMethods() {
    return this.formaPagamentoRepository.find({
      order: { nome: 'ASC' },
    });
  }

  async updateSell(updateSell: UpdateSellDto) {
    let forma_pagamento = await this.formaPagamentoRepository.findOne({ where: { forma_pagamento_id: updateSell.forma_pagamento_id } });
    if (!forma_pagamento && updateSell.forma_pagamento_nome) {
      forma_pagamento = this.formaPagamentoRepository.create({ nome: updateSell.forma_pagamento_nome });
      await this.formaPagamentoRepository.save(forma_pagamento);
    }

    return this.vendaRepository.update(
      { venda_id: updateSell.codigo },
      {
        status_pagamento: updateSell.status_pagamento_id ? { status_pagamento_id: updateSell.status_pagamento_id } : undefined,
        numero_nfe: updateSell.numero_nfe || null,
        forma_pagamento
      },
    ).then(() => 'Venda atualizada com sucesso');
  }
}
