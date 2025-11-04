import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { Distribuidor, Estoque, Fornecedor, HistoricoEstoque, NfeResumo, Produto, SaidaEstoque, ValorEstoque } from '../../../infrastructure/database/entities';
import { IDebtsRepository, IProductsRepository, ISellsRepository, IStockRepository } from '../../../domain/repositories';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import { Discrepancy, StockDuration, StockImportResponse, StockInItemDto, StockLiquid, StockOverview, StockValue, StockValuePermancence } from '../dto';
import { StockOutDto } from '../dto/stock-out.dto';
import { DebtsDto } from 'src/modules/debts/dto';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class StockService implements IStockRepository {
  constructor(
    @InjectRepository(Estoque) private readonly stockRepository: Repository<Estoque>,
    @InjectRepository(Fornecedor) private readonly fornecedorRepository: Repository<Fornecedor>,
    @InjectRepository(Distribuidor) private readonly distribuidorRepository: Repository<Distribuidor>,
    @Inject('IProductsRepository') private readonly productRepository: IProductsRepository,
    @Inject('ISellsRepository') private readonly sellRepository: ISellsRepository,
    @InjectRepository(SaidaEstoque) private readonly saidaRepository: Repository<SaidaEstoque>,
    @InjectRepository(Produto) private readonly produtoRepository: Repository<Produto>,
    @Inject('IDebtsRepository') private readonly debtsService: IDebtsRepository,
    @InjectRepository(ValorEstoque)private readonly valorEstoqueRepository: Repository<ValorEstoque>,
    @InjectRepository(HistoricoEstoque) private readonly historicoEstoqueRepository: Repository<HistoricoEstoque>,
    @InjectRepository(NfeResumo) private readonly nfeResumoRepository: Repository<NfeResumo>
  ) {}

  async getStock(): Promise<Estoque[]> {
    return this.stockRepository.find({relations: ['fornecedor', 'produto', 'saidas']});
  }

  async importStockFromNfeXml(filePath: string, typeId: number): Promise<StockImportResponse> {
    const xml = fs.readFileSync(filePath, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const json = parser.parse(xml);
  
    const itensNFe = json.nfeProc.NFe.infNFe.det;
    const produtosNaoEncontrados: string[] = [];
    let quantidadeImportada = 0;
    const produtosImportados: {
      codigo: string,
      nome: string,
      valor: number,
      quantidade: number,
      quantidadeCx: number
    }[] = [];
    const info = json.nfeProc.NFe.infNFe;
    const emitente = info.emit;
    const ide = info.ide;
    const valorNf = info.total.ICMSTot.vNF; 
    const numero_nfe = json.nfeProc.NFe.infNFe.ide.nNF
    const debito = info.cobr
    const nomeFornecedor = info.emit.xFant
    
    const existente = await this.stockRepository.findOne({
      where: { numero_nfe: numero_nfe, origem: 'NFE_XML' },
    });

    if (existente) {
      throw new ConflictException(`NF-e ${numero_nfe} já importada anteriormente.`);
    }

    try {
      await this.saveNfeResumoFromXml(filePath);
    } catch (error) {
      console.error(`⚠️ Erro ao salvar resumo da NF-e ${numero_nfe}:`, error.message);
    }
  
    const itens = Array.isArray(itensNFe) ? itensNFe : [itensNFe];
    const dist_type = Number(typeId);
  
    for (const item of itens) {
      const { prod } = item;
      const { nItem } = item;
      let produtos: Produto[] | undefined;
  
      switch (dist_type) {
        case 1: // GREEN
        case 7: // W COSMETICOS
          produtos = await this.productRepository.findProductByPartialCode(prod.cProd);
          break;
        case 2: // VIDAL
        case 3: // VICEROY / ABSOLUTA
        case 4: // NEW BLACK: busca por EAN se possível, senão usa código parcial
          const cod = String(prod.cProd).split(',')[0];
          const ean = prod.cBarra || prod.cEAN;
          produtos = isNaN(ean)
            ? await this.productRepository.findProductByPartialCode(cod)
            : await this.productRepository.findByEan(ean);
          break;
        case 5: // H2O // ISPL // IPC
          produtos = await this.productRepository.findByEan(prod.cEANTrib);
          break;
        case 6: // ALL BRANDS
          produtos = await this.productRepository.findByEan(prod.cBarraTrib);
          break;
          case 8: // TEK SUL 
          const eanTek = prod.cProd;

          if (nItem === 1) {
            const p = await this.productRepository.findProductById(492);
            produtos = p ? [p] : [];
          } else if (nItem === 2) {
            const p = await this.productRepository.findProductById(501);
            produtos = p ? [p] : [];
          } else { 
            produtos = await this.productRepository.findByEan(eanTek) || [];
          }
          break;

        default:
          continue;
      }
  
      if (!produtos || produtos.length === 0) {
        produtosNaoEncontrados.push(prod.cProd);
        continue;
      }
  
      const caixa = produtos.find(p => p.qt_uni !== null);
      const unidade = produtos.find(p => p.qt_uni === null);
      const produtoFinal = unidade ?? caixa;
  
      if (!produtoFinal) {
        produtosNaoEncontrados.push(prod.cProd);
        continue;
      }
  
      let quantidade = 0;
      const qtdBase = ['5'].includes(dist_type.toString()) ? prod.qTrib : prod.qCom;

      quantidade = parseFloat(qtdBase);
      const quantidadeCx = parseFloat(qtdBase);

  
      // Multiplica pela qt_uni apenas se ambos forem encontrados (caixa + unidade)
      // e o distribuidor **não for** W COSMETICOS (case 7)
      if (produtos.length > 1 && caixa && unidade && dist_type !== 7 && dist_type !== 5) {
        quantidade *= caixa.qt_uni;
      }      
  
      const fornecedor = await this.fornecedorRepository.findOne({
        where: { fornecedor_id: produtoFinal.fornecedor.fornecedor_id }
      });
  
      const distribuidor = await this.distribuidorRepository.findOne({
        where: { distribuidor_id: dist_type }
      });
  
      const estoque = this.stockRepository.create({
        produto: produtoFinal,
        quantidade_total: quantidade,
        preco_custo_unitario: parseFloat(prod.vUnCom),
        valor_total: parseFloat(prod.vProd),
        data_entrada: new Date().toISOString(),
        origem: 'NFE_XML',
        numero_nfe,
        fornecedor,
        distribuidor,
      });
  
      await this.stockRepository.save(estoque);
      produtosImportados.push({
        codigo: produtoFinal.codigo,
        nome: produtoFinal.nome,
        valor: parseFloat(prod.vProd),
        quantidade,
        quantidadeCx,
      });
      
       
      await this.productRepository.incrementStock(produtoFinal.produto_id, quantidade);

      quantidadeImportada++;
    }

    // let debitoCriado = null;
    // if (debito && debito.fat && debito.dup) {
    //   const debtsDto: DebtsDto = {
    //     nome: `${nomeFornecedor} NF-e ${numero_nfe}`,
    //     descricao: `Débito gerado automaticamente pela NF-e ${numero_nfe}`,
    //     valor_total: parseFloat(debito.fat.vOrig),
    //     data_competencia: ide.dhEmi || ide.dEmi,
    //     data_vencimento: Array.isArray(debito.dup) ? debito.dup[0].dVenc : debito.dup.dVenc,
    //     numero_parcelas: Array.isArray(debito.dup) ? debito.dup.length : 1,
    //     company_id: 2,
    //     user_company_id: 2,
    //     departamento_id: 2,
    //     categoria_id: 14,
    //     criado_por: 'geecom@azzo.com',
    //     account_id: 3,
    //     tipo: 'CUSTO',
    //   };

    //   // **Chama o serviço de débitos para criar o débito e as parcelas**
    //   debitoCriado = await this.debtsService.createDebtFromNfeXml(debtsDto, debito.dup);
    // }
    
      return {
        numero_nf: ide.nNF,
        data_emissao: ide.dhEmi || ide.dEmi,
        emitente: `${emitente.xNome} (CNPJ: ${emitente.CNPJ})`,
        valor: valorNf,
        qtd_itens: quantidadeImportada,
        produtos_nao_encontrados: produtosNaoEncontrados.length ? produtosNaoEncontrados.join(', ') : 'Nenhum',
        produtos: produtosImportados.map(p => ({
          codigo: p.codigo,
          nome: p.nome,
          qt_caixa: p.quantidadeCx,
          quantidade: p.quantidade,
          valor_total: p.valor,
        })),
        // debito: debitoCriado ? { debito_id: debitoCriado.debito_id, nome: debitoCriado.nome, valor_total: debitoCriado.valor_total, numero_parcelas: debitoCriado.numero_parcelas } : null,
      }; 
  }

  async getStockLiquid(): Promise<StockLiquid[]> {
    const statusVendaIds = [11139, 11138];
    const vendas = await this.sellRepository.getSellsByStatus(statusVendaIds);
  
    const vendasMap = new Map<number, { produto: Produto; quantidadeVendida: number }>();
  
    for (const venda of vendas) {
      for (const item of venda.itensVenda) {
        const produto = item.produto;
        const baseProduto = produto.unidade ?? produto;
        const produtoId = baseProduto.produto_id;
  
        const qtVenda = produto.unidade && produto.qt_uni
          ? item.quantidade * produto.qt_uni
          : item.quantidade;
  
        if (!vendasMap.has(produtoId)) {
          vendasMap.set(produtoId, { produto: baseProduto, quantidadeVendida: 0 });
        }
  
        vendasMap.get(produtoId)!.quantidadeVendida += qtVenda;
      }
    }
  
    const results = [];
    for (const { produto, quantidadeVendida } of vendasMap.values()) {
      const saldoEstoque = produto.saldo_estoque;
      const estoqueLiquido = saldoEstoque - quantidadeVendida; 
      results.push({
        codigo: produto.codigo,
        quantidadeVendida,
        saldo_estoque: saldoEstoque,
        estoqueLiquido,
        ean: +produto.ean,
      });
    }  
    return results;
  }

  findAllDistributors(): Promise<Distribuidor[]> {
    return this.distribuidorRepository.find();
  }

  async updateStockFromJson(): Promise<string> {
    const jsonFilePath = 'src/utils/contagem-estoque-novembro.json';
  
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Arquivo '${jsonFilePath}' não encontrado.`);
      return '❌ Arquivo de estoque não encontrado.';
    }
  
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const estoqueData: { produto_id: number; saldo_estoque: number | null }[] = JSON.parse(jsonData);
  
    for (const item of estoqueData) {
      const produto = await this.productRepository.findProductById(item.produto_id);
      if (!produto) {
        console.warn(`⚠️ Produto com ID ${item.produto_id} não encontrado.`);
        continue;
      }
  
      // Salvar histórico do saldo atual
      const historico = this.historicoEstoqueRepository.create({
        produto_id: produto.produto_id,
        quantidade: produto.saldo_estoque ?? 0,
      });
      await this.historicoEstoqueRepository.save(historico);
  
      // Substitui saldo nulo por 0
      const novoSaldo = item.saldo_estoque ?? 0;
      produto.saldo_estoque = isNaN(Number(novoSaldo)) ? 0 : Number(novoSaldo);
  
      await this.productRepository.saveProduct(produto);
    }
  
    console.log(`✅ Estoque atualizado para ${estoqueData.length} produtos.`);
    return '✅ Estoque atualizado com sucesso.';
  }

  async getStockOut(out: StockOutDto): Promise<string> {
    const { produtos, observacao } = out;
  
    let totalUnidadesSaidas = 0;
  
    for (const item of produtos) {
      const produto = await this.productRepository.findProductById(item.produto_id);
      if (!produto) {
        throw new Error(`Produto com ID ${item.produto_id} não encontrado.`);
      }
      let quantidadeEmUnidadesBase = Number(item.quantidade);
      if (produto.qt_uni && produto.unidade) {
        quantidadeEmUnidadesBase *= produto.qt_uni;
      }    
  
      totalUnidadesSaidas += quantidadeEmUnidadesBase;
  
      await this.produtoRepository.decrement({ produto_id: produto.produto_id }, 'saldo_estoque', quantidadeEmUnidadesBase);
  
      const saida = this.saidaRepository.create({
        quantidade: item.quantidade,
        produto,
        observacao,
      });
  
      await this.saidaRepository.save(saida);
    }
  
    return `Saída de estoque realizada com sucesso. Total de unidades: ${totalUnidadesSaidas}.`;
  }

  async findProductOut(id: number): Promise<SaidaEstoque[]> {
    return await this.saidaRepository.find({
      where: { produto: { produto_id: id } },
      order: { data_saida: 'DESC' },  
      take: 30,
    });
  }

  async getCestByXmlBuffer(buffer: Buffer): Promise<{ message: string, updated: number, notFound: string[] }> {
    const xml = buffer.toString('utf-8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const json = parser.parse(xml);
  
    const itensNFe = json.nfeProc?.NFe?.infNFe?.det;
    const itens = Array.isArray(itensNFe) ? itensNFe : [itensNFe];
  
    let updated = 0;
    const notFound: string[] = [];
  
    for (const item of itens) {
      const { prod } = item;
      if (!prod?.cEAN || !prod?.CEST) continue;
  
      const produtos = await this.productRepository.findByEan(prod.cEAN);
  
      if (produtos && produtos.length > 0) {
        for (const produto of produtos) {
          produto.cest = prod.CEST;
          await this.productRepository.saveProduct(produto);
          updated++;
        }
      } else {
        notFound.push(prod.cEAN);
      }
    }
  
    return {
      message: `CEST atualizado em ${updated} produto(s).`,
      updated,
      notFound,
    };
  }

  async stockOverview(): Promise<StockOverview> {
    const saidas = await this.saidaRepository.find({ relations: ['produto'] });
  
    if (!saidas.length) {
      return {
        stockDuration: [],
        stockValue: { valor_venda: 0, valor_custo: 0, percentual_faturamento: 0 },
      };
    }
  
    const totalVendasMap = new Map<number, { total: number; primeiraData: Date; ultimaData: Date }>();
  
    for (const saida of saidas) {
      const produto = saida.produto;
      if (!produto || !saida.data_saida) continue;
  
      const id = produto.produto_id;
      const data = new Date(saida.data_saida);
  
      if (!totalVendasMap.has(id)) {
        totalVendasMap.set(id, { total: Number(saida.quantidade), primeiraData: data, ultimaData: data });
      } else {
        const registro = totalVendasMap.get(id)!;
        registro.total += Number(saida.quantidade);
        if (data < registro.primeiraData) registro.primeiraData = data;
        if (data > registro.ultimaData) registro.ultimaData = data;
      }
    }
  
    const produtos = await this.produtoRepository
      .createQueryBuilder('produto')
      .where('produto.unidade_id IS NULL')
      .andWhere('produto.ativo = :ativo', { ativo: true })
      .getMany();
  
    const resultados: StockDuration[] = [];
  
    for (const produto of produtos) {
      const registro = totalVendasMap.get(produto.produto_id);
      if (!registro) continue;
  
      const { total, primeiraData, ultimaData } = registro;
      const dias = Math.max(1, this.businessDayOnly(primeiraData, ultimaData));
  
      const mediaDiaria = total / dias;
      const diasRestantes = mediaDiaria > 0
        ? Math.floor(produto.saldo_estoque / mediaDiaria)
        : 0;
  
      resultados.push({
        produto_id: produto.produto_id.toString(),
        mediaDiaria: Number(mediaDiaria.toFixed(2)),
        diasRestantes,
      });
    }
  
    const stockValue = await this.getStockValue();
  
    return {
      stockDuration: resultados.sort((a, b) => a.diasRestantes - b.diasRestantes),
      stockValue,
    };
  }
  
  businessDayOnly(inicio: Date, fim: Date): number {
    let count = 0;
    const current = new Date(inicio);
    while (current <= fim) {
      const diaSemana = current.getDay(); // 0 = domingo, 6 = sábado
      if (diaSemana !== 0 && diaSemana !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  async getStockValue(): Promise<StockValue> {
    const produtos = await this.produtoRepository
    .createQueryBuilder('produto')
    .where('produto.unidade_id IS NULL')
    .andWhere('produto.ativo = :ativo', { ativo: true })
    .getMany();

    let valor_venda = 0;
    let valor_custo = 0;
    for (const produto of produtos) {
      valor_venda += produto.preco_venda * produto.saldo_estoque;
      valor_custo += produto.preco_custo * produto.saldo_estoque;
    }
    const hoje = new Date();
    const sessentaDiasAtras = new Date();
    sessentaDiasAtras.setDate(hoje.getDate() - 60);


    const dataFinal = hoje.toISOString().substring(0, 10);
    const dataInicial = sessentaDiasAtras.toISOString().substring(0, 10);


    const faturamento = await this.sellRepository.reportBrandSalesBySeller(
      dataInicial,
      dataFinal,
    );

    const percentual = faturamento.Azzo.totalFaturado > 0
      ? (valor_venda / faturamento.Azzo.totalFaturado) * 100
      : 0;

    return {
      valor_venda: Number(valor_venda.toFixed(2)),
      valor_custo: Number(valor_custo.toFixed(2)),
      percentual_faturamento: Number(percentual.toFixed(2))
    };
  }

  async getHistoricalStockValue(): Promise<StockValuePermancence[]> {
    const diasIntervalo = 15;
    const hoje = new Date();
    const historico: StockValuePermancence[] = [];
  
    const totalDias = 90;
  
    const jsonFilePath = 'src/utils/contagem-estoque-junho.json';
    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Arquivo '${jsonFilePath}' não encontrado.`);
      return [];
    }
  
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const contagemData: { produto_id: number; saldo_estoque: number }[] = JSON.parse(jsonData);
  
    const dataInicial = new Date('2025-07-01T00:00:00');
  
    for (let diasAtras = totalDias; diasAtras >= 0; diasAtras -= diasIntervalo) {
      const dataReferencia = new Date(hoje);
      dataReferencia.setDate(hoje.getDate() - diasAtras);
  
      // Entradas a partir de julho
      const entradas = await this.stockRepository
        .createQueryBuilder('estoque')
        .leftJoinAndSelect('estoque.produto', 'produto')
        .where('estoque.data_entrada >= :inicio', { inicio: dataInicial.toISOString() })
        .andWhere('estoque.data_entrada <= :data', { data: dataReferencia.toISOString() })
        .getMany();
  
      // Saídas a partir de julho
      const saidas = await this.saidaRepository
        .createQueryBuilder('saida')
        .leftJoinAndSelect('saida.produto', 'produto')
        .where('saida.data_saida >= :inicio', { inicio: dataInicial.toISOString() })
        .andWhere('saida.data_saida <= :data', { data: dataReferencia.toISOString() })
        .getMany();
  
      const saldoMap = new Map<number, { quantidade: number; preco_custo: number }>();
  
      for (const item of contagemData) {
        const produto = await this.productRepository.findProductById(item.produto_id);
        if (!produto) continue;
  
        saldoMap.set(item.produto_id, {
          quantidade: item.saldo_estoque,
          preco_custo: produto.preco_custo ?? 0,
        });
      }
  
      for (const entrada of entradas) {
        const produtoId = entrada.produto.produto_id;
        const anterior = saldoMap.get(produtoId) || {
          quantidade: 0,
          preco_custo: entrada.produto.preco_custo ?? 0,
        };
  
        anterior.quantidade += entrada.quantidade_total;
        anterior.preco_custo = entrada.produto.preco_custo ?? 0;
        saldoMap.set(produtoId, anterior);
      }
  
      for (const saida of saidas) {
        const produtoId = saida.produto.produto_id;
        const anterior = saldoMap.get(produtoId) || {
          quantidade: 0,
          preco_custo: saida.produto.preco_custo ?? 0,
        };
  
        anterior.quantidade -= Number(saida.quantidade);
        saldoMap.set(produtoId, anterior);
      }
  
      let valorTotal = 0;
      for (const { quantidade, preco_custo } of saldoMap.values()) {
        const quantidadeFinal = Math.max(0, quantidade);
        valorTotal += quantidadeFinal * preco_custo;
      }
  
      historico.push({
        data: dataReferencia.toISOString().split('T')[0],
        valor_custo: Number(valorTotal.toFixed(2)),
      });
    }
  
    return historico;
  }

  @Cron('0 30 9 1,15 * *')
  async saveStockValue(): Promise<ValorEstoque> {
    const { valor_custo, valor_venda, percentual_faturamento } = await this.getStockValue();
  
    const valorEstoque = this.valorEstoqueRepository.create({
      valor_custo,
      valor_venda,
      percentual_faturamento,
    });
  
    return this.valorEstoqueRepository.save(valorEstoque);
  }

  async getStockDiscrepancies(limit = 100): Promise<Discrepancy[]> {
    const jsonFilePath = 'src/utils/contagem-estoque-novembro.json';
  
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`❌ Arquivo de contagem não encontrado em: ${jsonFilePath}`);
    }
  
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const contagemData: { produto_id: number; saldo_estoque: number }[] = JSON.parse(jsonData);
  
    const resultados = [];
  
    for (const item of contagemData) {
      const produtoId = item.produto_id;
  
      const produto = await this.productRepository.findProductById(produtoId);
      if (!produto) continue;
  
      const historico = await this.historicoEstoqueRepository.findOne({
        where: { produto_id: produtoId },
        order: { data_contagem: 'DESC' },
      });
  
      if (!historico) continue;
  
      const saldoHistorico = historico.quantidade ?? 0;
      const saldoContagem = item.saldo_estoque ?? 0;
      const diferenca = saldoContagem - saldoHistorico;
  
      if (diferenca !== 0) {
        resultados.push({
          produto_id: produto.produto_id,
          codigo: produto.codigo,
          nome: produto.nome,
          historico: saldoHistorico,
          contagem: saldoContagem,
          diferenca,
        });
      }
    }

    resultados.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
  
    return resultados.slice(0, limit);
  }
  
  async saveNfeResumoFromXml(filePath: string): Promise<NfeResumo> {
    const xml = fs.readFileSync(filePath, 'utf8');
  
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      transformTagName: (tagName) => tagName.replace(/^.*:/, ''),
    });
  
    const json = parser.parse(xml);
    const info = json?.nfeProc?.NFe?.infNFe;
    if (!info) throw new Error('XML inválido ou fora do padrão NF-e 4.00');
  
    const ide = info.ide;
    const emitente = info.emit;
    const total = info.total?.ICMSTot ?? {};
    const dets = Array.isArray(info.det) ? info.det : [info.det];
  
    const numero_nfe = ide?.nNF;
    const data_emissao = ide?.dhEmi;
    const fornecedor_nome = emitente?.xNome;
  
    let valor_produto = parseFloat(total.vProd ?? '0');
    let valor_ipi = parseFloat(total.vIPI ?? '0');
    let valor_st = parseFloat(total.vST ?? '0');
    let valor_base_icms = parseFloat(total.vBC ?? '0');
    let valor_total_nfe = parseFloat(total.vNF ?? '0');
  
    // 🔹 Novos tributos
    let valor_icms = parseFloat(total.vICMS ?? '0');
    let valor_base_icms_st = parseFloat(total.vBCST ?? '0');
    let valor_pis = parseFloat(total.vPIS ?? '0');
    let valor_cofins = parseFloat(total.vCOFINS ?? '0');
  
    const todosZerados =
      (valor_st === 0 || isNaN(valor_st)) &&
      (valor_base_icms === 0 || isNaN(valor_base_icms)) &&
      (valor_ipi === 0 || isNaN(valor_ipi));
  
    if (todosZerados) {
      valor_produto = 0;
      valor_ipi = 0;
      valor_st = 0;
      valor_base_icms = 0;
      valor_icms = 0;
      valor_base_icms_st = 0;
      valor_pis = 0;
      valor_cofins = 0;
  
      for (const item of dets) {
        const prod = item?.prod ?? {};
        const imp = item?.imposto ?? {};
        const icms = imp?.ICMS ?? {};
        const tipoICMS: any = Object.values(icms)[0] ?? {};
  
        valor_produto += parseFloat(prod?.vProd ?? 0);
  
        // IPI
        const ipi = imp?.IPI;
        if (ipi) {
          const vIPI =
            typeof ipi.vIPI === 'string' || typeof ipi.vIPI === 'number'
              ? parseFloat(ipi.vIPI)
              : 0;
          valor_ipi += vIPI;
        }
  
        // ICMS-ST
        const vICMSSTRet = parseFloat(tipoICMS.vICMSSTRet ?? 0);
        const vBCSTRet = parseFloat(tipoICMS.vBCSTRet ?? 0);
        const vST = parseFloat(tipoICMS.vST ?? 0);
        const vBCST = parseFloat(tipoICMS.vBCST ?? 0);
        const vICMS = parseFloat(tipoICMS.vICMS ?? 0);
        const vBC = parseFloat(tipoICMS.vBC ?? 0);
  
        valor_st += vICMSSTRet || vST;
        valor_base_icms += vBCSTRet || vBCST;
        valor_icms += vICMS;
        valor_base_icms_st += vBC;
      }
  
      valor_total_nfe = valor_produto;
    }
  
    const resumo = this.nfeResumoRepository.create({
      numero_nfe,
      emitente: fornecedor_nome,
      valor_produto: Number(valor_produto.toFixed(2)),
      valor_ipi: Number(valor_ipi.toFixed(2)),
      valor_st: Number(valor_st.toFixed(2)),
      valor_base_icms: Number(valor_base_icms.toFixed(2)),
      valor_total_nfe: Number(valor_total_nfe.toFixed(2)),
      valor_icms: Number(valor_icms.toFixed(2)),
      valor_base_icms_st: Number(valor_base_icms_st.toFixed(2)),
      valor_pis: Number(valor_pis.toFixed(2)),
      valor_cofins: Number(valor_cofins.toFixed(2)),
      data_emissao: new Date(data_emissao),
      data_entrada: new Date(),
    });
  
    return await this.nfeResumoRepository.save(resumo);
  }

  async findAllXml(): Promise<NfeResumo[]> {
    return this.nfeResumoRepository.find({ order: { nfe_resumo_id: 'ASC' } });
  }

  async findStockIn(nfe: string): Promise<StockInItemDto[]> {
    const entradas = await this.stockRepository.find({
      where: { numero_nfe: nfe },
      relations: ['produto', 'distribuidor'],
    });
  
    if (!entradas || entradas.length === 0) {
      throw new Error(`Nenhuma entrada encontrada para a NF-e ${nfe}`);
    }
  
    return entradas.map((entrada) => ({
      produto: entrada.produto.nome,
      codigo: entrada.produto.codigo,
      quantidade_total: entrada.quantidade_total,
      preco_custo_unitario: entrada.preco_custo_unitario,
      data_entrada: entrada.data_entrada,
      origem: entrada.origem,
      valor_total: entrada.valor_total
    }));
  }
}
