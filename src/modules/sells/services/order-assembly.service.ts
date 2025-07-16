// import { Inject, Injectable } from '@nestjs/common';
// import { ISellsRepository } from '../../../domain/repositories';
// import { InjectRepository } from '@nestjs/typeorm';
// import { ItensVenda } from '../../../infrastructure/database/entities';
// import { Repository } from 'typeorm';
// import { OrderAssemblyState } from '../dto';

// @Injectable()
// export class OrderAssemblyService {
//   constructor(
//     @InjectRepository(ItensVenda) private readonly itensVendaRepository: Repository<ItensVenda>,
//     @Inject('ISellsRepository') private readonly sellsSevice: ISellsRepository)
//   {}

//   async startAssembly(codigoPedido: number): Promise<OrderAssemblyState> {
//     const venda = await this.sellsSevice.getSellByCode(codigoPedido);

//     if (!venda) throw new Error('Pedido não encontrado');

//     const itens = venda.itensVenda.map(item => ({
//       produtoId: item.produto.produto_id,
//       nome: item.produto.nome,
//       ean: item.produto.ean,
//       quantidadePedida: item.quantidade,
//       quantidadeBipada: 0,
//       status: 'pendente'
//     }));

//     // Você pode salvar esse "estado" num Redis, numa tabela extra, etc.
//     return { codigoPedido, itens, finalizado: false };
//   }

//   async biparProduto(codigoPedido: number, ean: string): Promise<OrderAssemblyState> {
//     // Carregar estado da montagem (pode ser da sessão, Redis, ou tabela "MontagemPedido")
//     let estado = await this.getAssemblyState(codigoPedido);

//     const item = estado.itens.find(i => i.ean === ean);
//     if (!item) {
//       throw new Error('Produto não pertence ao pedido!');
//     }
//     if (item.quantidadeBipada >= item.quantidadePedida) {
//       throw new Error('Quantidade deste produto já foi completamente bipada!');
//     }

//     item.quantidadeBipada += 1;
//     if (item.quantidadeBipada === item.quantidadePedida) {
//       item.status = 'montado';
//     }

//     // Atualizar "estado"

//     // Se todos montados, marcar finalizado
//     estado.finalizado = estado.itens.every(i => i.status === 'montado');
//     return estado;
//   }

// }
