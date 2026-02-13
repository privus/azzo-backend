import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
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

  async createSells() {
    const orders = await this.pSellsRepository.find();
    const statusAtivo = await this.statusClienteRepository.findOne({ where: { status_cliente_id: 1 } });

    for (const order of orders) {

      let cliente = await this.clienteRepository.findOne({ where: { nome: order.cliente_nome } });
      if (!cliente) {
        cliente = this.clienteRepository.create({
          nome: order.cliente_nome,
          tipo_doc: order.cliente_tipo,
          numero_doc: order.numero_doc,
          ultima_compra: order.data_pedido,
          valor_ultima_compra: order.total_pedido,
          status_cliente: statusAtivo,
        });
        await this.clienteRepository.save(cliente);
      }

      let ecommerce = null;
      if (order.n_ecommerce) {
        ecommerce = await this.ecommerceRepository.findOne({ where: { ecommerce_id: order.n_ecommerce } });
      }

      const statusVenda = await this.statusVendaRepository.findOne({ where: { status_venda_id: order.status_id } });

      let vendaExistente = await this.vendaRepository.findOne({
        where: { venda_id: order.p_venda_id },
      });

      if (vendaExistente) {
        vendaExistente.data_criacao = order.data_pedido;
        vendaExistente.valor_final = order.total_pedido;
        vendaExistente.cliente = cliente;
        vendaExistente.status_venda = statusVenda;


        await this.vendaRepository.save(vendaExistente);
        await this.itensVendaRepository.delete({ venda: { venda_id: order.p_venda_id } });
      } else {
        vendaExistente = this.vendaRepository.create({
          venda_id: order.p_venda_id,
          data_criacao: order.data_pedido,
          valor_final: order.total_pedido || 0,
          cliente,
          ecommerce,
          status_venda: statusVenda,
        });
        await this.vendaRepository.save(vendaExistente);
      }

      cliente.ultima_compra = order.data_pedido;
      cliente.valor_ultima_compra = order.total_pedido;
      await this.clienteRepository.save(cliente);
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
        'parcela_credito.account',        
      ],
    });
  }

  async generateInstallments(venda_id: number, installments: InstallmentsDto[]) {
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
