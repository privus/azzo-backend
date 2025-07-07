import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, Between, Raw, In, Not } from 'typeorm';
import { Account, CategoriaDebito, Company, Debito, Departamento, ParcelaDebito, RateioDebito, StatusPagamento } from '../../../infrastructure/database/entities';
import { DebtsDto, UpdateInstalmentDto, DebtsComparisonReport, UpdateDebtStatusDto } from '../dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(Debito) private readonly debtRepository: Repository<Debito>,
    @InjectRepository(ParcelaDebito) private readonly parcelaRepository: Repository<ParcelaDebito>,
    @InjectRepository(StatusPagamento) private readonly statusPagamentoRepository: Repository<StatusPagamento>,
    @InjectRepository(Departamento) private readonly departamentoRepository: Repository<Departamento>,
    @InjectRepository(CategoriaDebito) private readonly categoriaDebitoRepository: Repository<CategoriaDebito>,
    @InjectRepository(Account) private readonly accountRepository: Repository<Account>,
    @InjectRepository(Company) private readonly companyRepository: Repository<Company>,
    @InjectRepository(RateioDebito) private readonly rateioDebitoRepository: Repository<RateioDebito>,
  ) {}

  async createDebt(debtDto: DebtsDto): Promise<Debito> {
    const statusPagamentoPendente = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 1 } });
    const statusPagamentoPago = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 2 } });
    const company = await this.companyRepository.findOne({ where: { company_id: debtDto.company_id } });
    const userCompany = await this.companyRepository.findOne({ where: { company_id: debtDto.user_company_id } });

    if (!statusPagamentoPendente || !statusPagamentoPago) {
      throw new Error('Status de pagamento padrão ou pago não encontrado.');
    }

    let departamento = await this.departamentoRepository.findOne({ where: { departamento_id: debtDto.departamento_id } });
    if (!departamento && debtDto.departamento_nome) {
      departamento = this.departamentoRepository.create({ nome: debtDto.departamento_nome });
      await this.departamentoRepository.save(departamento);
    }

    let categoria = await this.categoriaDebitoRepository.findOne({ where: { categoria_id: debtDto.categoria_id } });
    if (!categoria && debtDto.categoria_nome) {
      categoria = this.categoriaDebitoRepository.create({ nome: debtDto.categoria_nome });
      await this.categoriaDebitoRepository.save(categoria);
    }

    let account = await this.accountRepository.findOne({ where: { account_id: debtDto.account_id } });
    if (!account) {
      account = this.accountRepository.create({ nome: debtDto.account_name });
      account.company = userCompany;
      await this.accountRepository.save(account);
    }

    const datasVencimento = this.generateInstallmentDates(new Date(debtDto.data_vencimento), debtDto.numero_parcelas, debtDto.periodicidade || 31);

    const debitoEntity = this.debtRepository.create({
      nome: debtDto.nome,
      descricao: debtDto.descricao,
      valor_total: debtDto.valor_total,
      data_criacao: new Date(),
      data_competencia: new Date(debtDto.data_competencia),
      data_pagamento: debtDto.data_pagamento ? new Date(debtDto.data_pagamento) : null,
      numero_parcelas: debtDto.numero_parcelas,
      juros: debtDto.juros || 0,
      valor_parcela: debtDto.valor_total / debtDto.numero_parcelas,
      status_pagamento: debtDto.data_pagamento && debtDto.numero_parcelas <= 1 ? statusPagamentoPago : statusPagamentoPendente,
      departamento,
      categoria,
      despesa_grupo: debtDto.company_id === 1 ? 1 : 0,
      datas_vencimento: datasVencimento,
      criado_por: debtDto.criado_por,
      account,
      company,
      tipo: debtDto.tipo,
    });

    const savedDebt = await this.debtRepository.save(debitoEntity);

    const parcelas = datasVencimento.map((dataVencimento, index) => {
      return this.parcelaRepository.create({
        numero: index + 1,
        valor: Number(debtDto.valor_total / debtDto.numero_parcelas),
        data_criacao: new Date(),
        data_competencia: new Date(debtDto.data_competencia),
        data_vencimento: new Date(dataVencimento),
        status_pagamento: index === 0 && debtDto.data_pagamento ? statusPagamentoPago : statusPagamentoPendente,
        data_pagamento: index === 0 && debtDto.data_pagamento ? new Date(debtDto.data_pagamento) : null,
        juros: debtDto.juros || 0,
        debito: savedDebt,
      });
    });

    await this.parcelaRepository.save(parcelas);

    if (debtDto.company_id === 1) {
      const rateioDebito = this.rateioDebitoRepository.create({
        debito: savedDebt,        
        paying_company: userCompany,
        valor: debtDto.valor_total,
      });
      await this.rateioDebitoRepository.save(rateioDebito);
    }
    return savedDebt;
  }

  private generateInstallmentDates(startDate: Date, numberOfInstallments: number, periodicity: number): string[] {
    const dates: string[] = [];
    let installmentDate = new Date(startDate); 

    for (let i = 0; i < numberOfInstallments; i++) {
        if (i === 0) {
            // Garante que a primeira parcela nunca seja no dia anterior
            installmentDate.setDate(installmentDate.getDate() + 1); 
        } else {
            installmentDate = new Date(dates[i - 1]); // Usa a última data como referência
            installmentDate.setDate(installmentDate.getDate() + periodicity);
        }
        dates.push(installmentDate.toISOString().split('T')[0]); // Formato "YYYY-MM-DD"
    }
    
    return dates;
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateOverdueParcels(): Promise<void> {
    const today = new Date();
    today.setDate(today.getDate() - 1); // Permite que a parcela só fique em atraso no dia seguinte ao vencimento

    // Buscar todas as parcelas vencidas e não pagas
    const overdueParcels = await this.parcelaRepository.find({
        where: {
            data_vencimento: LessThan(today), // Só marca como "Atrasada" se a data for anterior a HOJE
            data_pagamento: null,
        },
        relations: ['debito', 'status_pagamento'],
    });

    if (overdueParcels.length === 0) return;

    const statusEmAtraso = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 3 } });
    const statusPendente = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id: 1 } });

    const updatedDebts = new Set<number>();

    for (const parcela of overdueParcels) {
        if (!parcela.data_pagamento) {
            parcela.status_pagamento = statusEmAtraso;
            updatedDebts.add(parcela.debito.debito_id);
        }
    }

    await this.parcelaRepository.save(overdueParcels);

    for (const debitoId of updatedDebts) {
      const parcelasDebito = await this.parcelaRepository.find({
        where: { debito: { debito_id: debitoId } },
        relations: ['status_pagamento'],
      });
    
      const temAtraso = parcelasDebito.some(parcela => parcela.status_pagamento?.status_pagamento_id === 3);
    
      const novoStatus = temAtraso ? statusEmAtraso : statusPendente;
    
      await this.debtRepository.update(debitoId, { status_pagamento: novoStatus });
    }    
  }

  getAllDepartments(): Promise<Departamento[]> {
    return this.departamentoRepository.find();
  }

  getAllCategories(): Promise<CategoriaDebito[]> {
    return this.categoriaDebitoRepository.find();
  }

  getDebtById(id: number): Promise<Debito> {
    return this.debtRepository.findOne({
      where: { debito_id: id },
      relations: ['parcela_debito.status_pagamento', 'status_pagamento', 'categoria', 'departamento', 'company', 'account', 'parcela_debito.account'],
    });
  }

  async updateInstalmentStatus(UpdateInstalmentDto: UpdateInstalmentDto): Promise<string> {
    const { parcela_id, status_pagamento_id, data_pagamento, valor_total, atualizado_por, data_vencimento, user_company_id, account_id, account_name } = UpdateInstalmentDto;

    const userCompany = await this.companyRepository.findOne({ where: { company_id: user_company_id } });

    let account = await this.accountRepository.findOne({ where: { account_id: account_id } });
    if (!account && account_name) {
      account = this.accountRepository.create({ nome: account_name });
      account.company = userCompany;
      await this.accountRepository.save(account);
    }

    const parcela = await this.parcelaRepository.findOne({
      where: { parcela_id },
      relations: ['status_pagamento', 'account', 'debito'],
    });

    if (!parcela) {
      throw new Error(`Parcela com ID ${parcela_id} não encontrada.`);
    }

    // Buscar novo status de pagamento
    const novoStatus = await this.statusPagamentoRepository.findOne({
      where: { status_pagamento_id },
    });

    if (!novoStatus) {
      throw new Error(`Status de pagamento com ID ${status_pagamento_id} não encontrado.`);
    }

    // Assegurar que valores numéricos não sejam null/undefined
    const parcelaValor = parcela.valor ?? 0;

    let diferenca = 0;
    // Atualizar a parcela
    parcela.status_pagamento = novoStatus;
    parcela.atualizado_por = atualizado_por;
    parcela.account = account;
    if (valor_total) {
        parcela.valor = valor_total;
        diferenca = valor_total - parcelaValor;
    }
    if (data_pagamento) {
        parcela.data_pagamento = new Date(data_pagamento);
    }
    if (data_vencimento) {
        const novaData = new Date(data_vencimento);
        novaData.setDate(novaData.getDate() + 1);
        parcela.data_vencimento = novaData;
    }

    if (parcela.debito && valor_total !== undefined) {
      const debito = await this.debtRepository.findOne({
        where: { debito_id: parcela.debito.debito_id },
        relations: ['parcela_debito', 'company'],
      });
    
      const parcelas = debito.parcela_debito || [];
    
      let novo_valor_total = 0;
      if (parcelas.length === 1) {
        // Só existe uma parcela
        novo_valor_total = valor_total;
      } else {
        // Mais de uma parcela: soma todas, mas substitua a que foi alterada
        novo_valor_total = parcelas.reduce((acc, p) => {
          if (p.parcela_id === parcela_id) {
            return acc + valor_total;
          }
          return acc + Number(p.valor || 0);
        }, 0);
      }
    
      debito.valor_total = +novo_valor_total.toFixed(2);
    
      await this.debtRepository.save(debito);

                // ATUALIZA RATEIO_DEBITO CASO SEJA company_id = 1
      if (debito.company.company_id === 1) {
        // Busca todos os rateios deste debito
        const rateio = await this.rateioDebitoRepository.findOne({
          where: { debito: { debito_id: debito.debito_id } }
        });
        // Atualiza todos os valores de rateio para igualar ao novo valor_total do debito
        rateio.valor = debito.valor_total;
        await this.rateioDebitoRepository.save(rateio);

      }
    }
    
    await this.parcelaRepository.save(parcela);

    return `Status da parcela ${parcela_id} atualizado para ${novoStatus.nome}.`;
  }

  async updateDebtStatus(updateStatus: UpdateDebtStatusDto): Promise<string> {
    const { debito_id, status_pagamento_id } = updateStatus;
  
    const debt = await this.debtRepository.findOne({
      where: { debito_id },
      relations: ['status_pagamento'],
    });
  
    if (!debt) {
      throw new Error(`Débito com ID ${debito_id} não encontrado.`);
    }
  
    const novoStatus = await this.statusPagamentoRepository.findOne({ where: { status_pagamento_id } });
  
    if (!novoStatus) {
      throw new Error(`Status de débito com o ID ${status_pagamento_id} não encontrado.`);
    }
  
    debt.status_pagamento = novoStatus;
  
    if (status_pagamento_id === 2) { // Pago
      const parcelas = await this.parcelaRepository.find({
        where: { debito: { debito_id } },
        order: { numero: 'ASC' }, // Ensure ordered
      });
  
      if (parcelas.length > 0) {
        const ultimaParcela = parcelas[parcelas.length - 1];
        if (ultimaParcela.data_pagamento) {
          debt.data_pagamento = ultimaParcela.data_pagamento;
        }
      }
    }
  
    await this.debtRepository.save(debt);
  
    return `Status do débito ${debt.debito_id} atualizado para ${novoStatus.nome}.`;
  }

  async deleteDebt(code: number): Promise<string> {
    const debito = await this.debtRepository.findOne({ where: { debito_id: code } });

    if (!debito) {
        throw new Error(`debito com ID ${code} não encontrada.`);
    }

    // Exclui a debito diretamente (parcelas serão excluídas automaticamente pelo cascade)
    await this.debtRepository.remove(debito);

    return `Debito com ID ${code} e suas parcelas foram excluídas com sucesso.`;
  }

  async getDebtsByDate(companyId: number, fromDate?: string): Promise<Debito[]> {
    const query = this.debtRepository.createQueryBuilder('debito')
      .leftJoinAndSelect('debito.parcela_debito', 'parcela')
      .leftJoinAndSelect('parcela.status_pagamento', 'parcelaStatus')
      .leftJoinAndSelect('debito.status_pagamento', 'statusPagamento')
      .leftJoinAndSelect('debito.categoria', 'categoria')
      .leftJoinAndSelect('debito.departamento', 'departamento')
      .leftJoinAndSelect('debito.company', 'company')
      .leftJoinAndSelect('debito.account', 'account')
      .leftJoinAndSelect('account.company', 'accountCompany')
      .where('accountCompany.company_id = :companyId', { companyId });
  
    if (fromDate) {
      query.andWhere('debito.data_competencia >= :fromDate', { fromDate: new Date(fromDate) });
    }
  
    return await query.getMany();
  }
  
  
  async getDebtsBetweenDates(companyId: number, fromDate: string, toDate?: string): Promise<Debito[]> {
    const query = this.debtRepository.createQueryBuilder('debito')
      .leftJoinAndSelect('debito.parcela_debito', 'parcela')
      .leftJoinAndSelect('parcela.status_pagamento', 'parcelaStatus')
      .leftJoinAndSelect('debito.status_pagamento', 'status_pagamento')
      .leftJoinAndSelect('debito.categoria', 'categoria')
      .leftJoinAndSelect('debito.departamento', 'departamento')
      .leftJoinAndSelect('debito.company', 'company')
      .leftJoinAndSelect('debito.account', 'account')
      .leftJoinAndSelect('account.company', 'accountCompany')
      .where('accountCompany.company_id = :companyId', { companyId });
  
    // Filtrar pelas datas de competência
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
  
      query.andWhere('debito.data_competencia BETWEEN :start AND :end', { start, end });
    } else if (fromDate) {
      query.andWhere('DATE(debito.data_competencia) = :fromDate', { fromDate });
    }
  
    return await query.getMany();
  }   
  
  async performanceDebtsPeriods(
    fromDate1: string,
    toDate1: string,
    fromDate2: string,
    toDate2: string,
    conpany_id: number,
  ): Promise<DebtsComparisonReport> {
    const debitosPeriodo1 = await this.getDebtsBetweenDates(conpany_id, fromDate1, toDate1);
    const debitosPeriodo2 = await this.getDebtsBetweenDates(conpany_id, fromDate2, toDate2);
  
    const totalPeriodo1 = debitosPeriodo1.reduce((acc, d) => acc + Number(d.valor_total || 0), 0);
    const totalPeriodo2 = debitosPeriodo2.reduce((acc, d) => acc + Number(d.valor_total || 0), 0);
  
    const variacao = totalPeriodo1 === 0
      ? (totalPeriodo2 > 0 ? 100 : 0)
      : ((totalPeriodo2 - totalPeriodo1) / totalPeriodo1) * 100;
  
    let direcao: 'aumento' | 'queda' | 'neutro' = 'neutro';
    if (variacao > 0) direcao = 'aumento';
    else if (variacao < 0) direcao = 'queda';
    
    const despesasDepartamento: Record<string, number> = {};
    const despesasCategoria: Record<string, number> = {};
  
    for (const debito of debitosPeriodo2) {
      const depNome = debito.departamento?.nome || 'Sem Departamento';
      const catNome = debito.categoria?.nome || 'Sem Categoria';
      const valor = Number(debito.valor_total || 0);
  
      despesasDepartamento[depNome] ??= 0;
      despesasDepartamento[depNome] += valor;
  
      despesasCategoria[catNome] ??= 0;
      despesasCategoria[catNome] += valor;
    }
  
    return {
      totalPeriodo1: Number(totalPeriodo1.toFixed(2)),
      totalPeriodo2: Number(totalPeriodo2.toFixed(2)),
      variacaoPercentual: Number(variacao.toFixed(2)),
      direcao,
      DespesasMesAtual: Number(totalPeriodo2.toFixed(2)),
      despesasDepartamento,
      despesasCategoria,
    };
  }
  
  findAccountByCompanyId(company_id: number) : Promise<Account[]> {
    return this.accountRepository.find({
      where: { company: { company_id } },
      relations: ['company'],
    });
  }


  async alignDebitCompany(): Promise<void> {
    const debts = await this.debtRepository.find({relations: ['company']});
    const company = await this.companyRepository.findOne({ where: { company_id: 4 } });

    for (const debt of debts) {
      if (debt.empresa === 'Personizi') {
        debt.company = company;
        await this.debtRepository.save(debt);
      }
    }
  }


  async seedAccounts(): Promise<void> {
    const contas = [
      { id: 1, nome: 'Bradesco' },
      { id: 2, nome: 'Gold' },
      { id: 3, nome: 'Sicredi' },
      { id: 4, nome: 'Sicoob Serrania' },
      { id: 5, nome: 'Broker Green' },
      { id: 6, nome: 'Broker Viceroy' },
      { id: 7, nome: 'Sicoob Alfenas' },
      { id: 8, nome: 'Itau' },
      { id: 9, nome: 'Sicredi Cartão' },
      { id: 10, nome: 'Bradesco Cartão' },
      { id: 11, nome: 'Sicoob Serrania Cartão' },
      { id: 12, nome: 'Sicoob Alfenas Cartão' },
    ];
  
    const company = await this.companyRepository.findOne({ where: { company_id: 2 } }); // ajuste se precisar
  
    for (const conta of contas) {
      const exists = await this.accountRepository.findOne({ where: { account_id: conta.id } });
      if (!exists) {
        const novaConta = this.accountRepository.create({
          account_id: conta.id,
          nome: conta.nome,
          company,
        });
        await this.accountRepository.save(novaConta);
      }
    }
  }

  async associateParcelsToDebitAccount(): Promise<void> {
    const parcelas = await this.parcelaRepository.find({
      relations: ['debito', 'debito.account', 'account'],
      where: { account: null },
    });
  
    for (const parcela of parcelas) {
      const contaDoDebito = parcela.debito?.account;
  
      if (contaDoDebito) {
        parcela.account = contaDoDebito;
        await this.parcelaRepository.save(parcela);
        console.log(`Parcela ${parcela.parcela_id} associada à conta ${contaDoDebito.nome}`);
      } else {
        console.warn(
          `Conta do débito ${parcela.debito?.debito_id} não encontrada para a parcela ${parcela.parcela_id}`
        );
      }
    }
  } 


  async balanceDebtsPrivus(): Promise<Record<string, number>> {
    // IDs dos grupos
    const AzzoId = 2;
    const personiziId = 4;
    const grupoId = 1;

    // Passo 1: buscar débitos onde o pagador (account) é diferente do dono do débito (company)
    // e só débitos que pertencem ao grupo
    const debtsAzzoPayingForPerson = await this.debtRepository.find({
      relations: [
        'company',
        'account',
        'account.company',
        'parcela_debito.account.company',
      ],
      where: {
        company: { company_id: personiziId },
        account: { 
          company: { 
            company_id: Not(personiziId)
          } 
        },
      },
    });

    const debtsPersonPayingForAzzo = await this.debtRepository.find({
      relations: [
        'company',
        'account',
        'account.company',
        'parcela_debito.account.company',
      ],
      where: {
        company: { company_id: AzzoId },
        account: { 
          company: { 
            company_id: Not(AzzoId)
          } 
        },
      },
    });

    const relatorio: Record<string, number> = {};

    const totalAzzoPagouPersonizi = debtsAzzoPayingForPerson.reduce(
      (acc, debito) => acc + Number(debito.valor_total || 0), 0
    );
    relatorio['Azzo pagou para Personizi'] = Number(totalAzzoPagouPersonizi.toFixed(2));

    const totalPersoniziPagouAzzo = debtsPersonPayingForAzzo.reduce(
      (acc, debito) => acc + Number(debito.valor_total || 0), 0
    );
    relatorio['Personizi pagou para Azzo'] = Number(totalPersoniziPagouAzzo.toFixed(2));


    const rateiosAzzoPg = await this.rateioDebitoRepository.find({
      relations: [
        'debito.company',
        'paying_company',
        'debito.parcela_debito.account.company',
      ],
      where: {
        paying_company: { company_id: AzzoId },

      },
    });

    relatorio['Azzo pagou para Grupo'] = rateiosAzzoPg.reduce(
      (acc, rateio) => acc + Number(rateio.valor || 0), 0
    );

    // ----------- 4. Personizi deve ao Grupo (pelo rateio) -----------
    const rateiosPersoniziPg = await this.rateioDebitoRepository.find({
      relations: [
        'debito.company',
        'paying_company',
        'debito.parcela_debito.account.company',
      ],
      where: {
        paying_company: { company_id: personiziId },
      },
    });

    relatorio['Personizi pagou para Grupo'] = rateiosPersoniziPg.reduce(
      (acc, rateio) => acc + Number(rateio.valor || 0), 0
    );

    // ----------- Campo extra: "Quem está devendo para o grupo" -----------
  let totalAzzoDeveGrupo = 0;
  let totalPersoniziDeveGrupo = 0;

  // Azzo
    for (const rateio of rateiosAzzoPg) {
      // Total pago (parcelas pagas por Azzo)
      const totalPago = (rateio.debito.parcela_debito || [])
        .filter(parcela =>
          parcela.data_pagamento &&
          parcela.account?.company?.company_id &&
          parcela.account?.company?.company_id === AzzoId
        )
        .reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0);

      const faltaPagar = Math.max(Number(rateio.valor) - totalPago, 0);
      totalAzzoDeveGrupo += faltaPagar;
    }

    // Personizi
    for (const rateio of rateiosPersoniziPg) {
      const totalPago = (rateio.debito.parcela_debito || [])
        .filter(parcela =>
          parcela.data_pagamento &&
          parcela.account?.company?.company_id === personiziId
        )
        .reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0);

      const faltaPagar = Math.max(Number(rateio.valor) - totalPago, 0);
      totalPersoniziDeveGrupo += faltaPagar;
    }

    relatorio['Azzo está devendo para Grupo'] = Number(totalAzzoDeveGrupo.toFixed(2));
    relatorio['Personizi está devendo para Grupo'] = Number(totalPersoniziDeveGrupo.toFixed(2));

    return relatorio;

  }

  associeteParcelaToAccount(): Promise<void> {
    const parcelas = this.parcelaRepository.find({
      where: { account: null },
      relations: ['debito', 'debito.account'],
    });

    return parcelas.then(async (parcelas) => {
      for (const parcela of parcelas) {
        if (parcela.debito.account) {
          parcela.account = parcela.debito.account;
          await this.parcelaRepository.save(parcela);
          console.log(`Parcela ${parcela.parcela_id} associada à conta ${parcela.account.nome}`);
        } else {
          console.warn(`Débito ou conta não encontrada para a parcela ${parcela.parcela_id}`);
        }
      }
    });
  }

}
