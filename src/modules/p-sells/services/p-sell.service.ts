import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
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
} from '../../../infrastructure/database/entities';

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
  ) {}

  async createSells() {
    const orders = await this.pSellsRepository.find();
    const statusPago = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 2 } });
    const statusPendente = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 1 } });
    console.log('orders', orders);

    for (const order of orders) {
      const produtosPedido = order.produtos ? JSON.parse(order.produtos) : [];
      const produtosMap = new Map<number, PProduto>();
      
      for (const prod of produtosPedido) {
        let produto = await this.produtoRepository.findOne({ where: { codigo: prod.cod_produto } });
      
        if (!produto) {
          produto = this.produtoRepository.create({
            id: prod.produto_id,
            nome: prod.nome_produto,
            descricao: '',
            preco: prod.preco_unitario,
            codigo: prod.cod_produto,
          });
          await this.produtoRepository.save(produto);
        }
      
        produtosMap.set(prod.produto_id, produto);
      }     

      // Cliente
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
        });
        await this.clienteRepository.save(cliente);
      }

      // Forma de pagamento
      let formaPagamento = await this.formaPagamentoRepository.findOne({ where: { nome: order.forma_pagamento } });
      if (!formaPagamento) {
        formaPagamento = this.formaPagamentoRepository.create({ nome: order.forma_pagamento });
        await this.formaPagamentoRepository.save(formaPagamento);
      }

      // Ecommerce (nome_ecommerce no PSell)
      let ecommerce = null;
      if (order.nome_ecommerce) {
        ecommerce = await this.ecommerceRepository.findOne({ where: { nome: order.nome_ecommerce } });
        if (!ecommerce) {
          ecommerce = this.ecommerceRepository.create({ nome: order.nome_ecommerce });
          await this.ecommerceRepository.save(ecommerce);
        }
      }

      // Status da venda (situacao no PSell)
      let statusVenda = null;
      if (order.situacao) {
        statusVenda = await this.statusVendaRepository.findOne({ where: { nome: order.situacao } });
        if (!statusVenda) {
          statusVenda = this.statusVendaRepository.create({ nome: order.situacao });
          await this.statusVendaRepository.save(statusVenda);
        }
      }

      const status_pagamento = order.forma_pagamento === 'Outro' ? statusPendente : statusPago;
      // Agora criamos a venda
      const novaVenda = this.vendaRepository.create({
        venda_id: order.p_venda_id,
        data_criacao: order.data_pedido,
        valor_frete: order.valor_frete,
        valor_pedido: order.total_pedido,
        valor_final: order.total_pedido,
        desconto: order.valor_desconto || 0,
        cliente,
        forma_pagamento: formaPagamento,
        ecommerce,
        status_venda: statusVenda,
        status_pagamento
      } as Partial<PVenda>); // Casting se necessário

      cliente.ultima_compra = order.data_pedido;
      cliente.valor_ultima_compra = order.total_pedido;
      await this.clienteRepository.save(cliente);
      await this.vendaRepository.save(novaVenda);

      await this.vendaRepository.save(novaVenda);

    for (const prod of produtosPedido) {
      const produto = produtosMap.get(prod.produto_id);
      if (!produto) continue;

      const itemVenda = this.itensVendaRepository.create({
        quantidade: prod.quantidade,
        valor_unitario: prod.preco_unitario,
        valor_total: prod.valor_total,
        lucro_bruto: prod.lucro_produto,
        observacao: '',
        venda: novaVenda,
        produto: produto,
      });

      await this.itensVendaRepository.save(itemVenda);
    }
    }
  }
}
