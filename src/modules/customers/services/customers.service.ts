import { TinyAuthService } from './../../sells/services/tiny-auth.service';
import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CustomerAPIResponse, CustomerBlingDto, TinyCustomerDto, TinyCustomerResponse } from '../dto';
import { Regiao, StatusCliente, Cidade, Cliente, CategoriaCliente, GrupoCliente, Venda } from '../../../infrastructure/database/entities';
import { IBlingAuthRepository, ICustomersRepository, ISellersRepository } from '../../../domain/repositories';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';

@Injectable()
export class CustomersService implements ICustomersRepository{
  private readonly apiUrlSellentt: string;
  private readonly apiUrlTiny: string;
  private readonly tokenSellentt: string;
  private readonly storeTag = 'stores';
  private readonly contactTag = 'contatos';
  private readonly sellerTag = 'seller';
  private readonly apiBlingUrl: string;

  constructor(
    @InjectRepository(Cliente) private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Cidade) private readonly cidadeRepository: Repository<Cidade>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
    @InjectRepository(StatusCliente) private readonly statusClienteRepository: Repository<StatusCliente>,
    @InjectRepository(CategoriaCliente) private readonly categoriaRepository: Repository<CategoriaCliente>,
    @Inject('ISellersRepository') private readonly sellersSevice: ISellersRepository,
    @InjectRepository(GrupoCliente) private readonly grupoClienteRepository: Repository<GrupoCliente>,
    @InjectRepository(Venda) private readonly vendaRepository: Repository<Venda>,
    @Inject('IBlingAuthRepository') private readonly blingAuthService: IBlingAuthRepository,
    private readonly tinyAuthService: TinyAuthService,  
    private readonly httpService: HttpService,
  ) {
    this.tokenSellentt = process.env.SELLENTT_API_TOKEN;
    this.apiUrlSellentt = process.env.SELLENTT_API_URL;
    this.apiUrlTiny = process.env.TINY_API_URL;
    this.apiBlingUrl = process.env.BLING_API_URL;
  }

  async syncroCustomers(): Promise<void> {
    let page = 1;

    while (true) {
      try {
        // Construct the request URL
        const url = `${this.apiUrlSellentt}${this.storeTag}?page=${page}`;
        console.log(`Requesting: ${url}`); // Log the URL for debugging

        // Perform the HTTP request
        const response = await this.httpService.axiosRef.get<{ data: CustomerAPIResponse[] }>(url, {
          headers: {
            Authorization: `Bearer ${this.tokenSellentt}`,
          },
        });

        const clientesData = response.data.data;

        // Exit the loop if no data
        if (!clientesData || clientesData.length === 0) {
          console.log(`No records found on page ${page}. Ending synchronization.`);
          break;
        }

        // Process each customer
        console.log(`Page ${page} => ${clientesData.length} customers received.`);
        for (const client of clientesData) {
          await this.processarCliente(client);
        }
        page++;
      } catch (error) {
        console.error('Error during customer synchronization:', error.message);
        throw error;
      }
    }
    console.log('Customer synchronization completed!');
  }

  async syncroLastPageCustomers(): Promise<void> {
    try {
      const urlFirstPage = `${this.apiUrlSellentt}${this.storeTag}?page=1`;
  
      const firstResponse = await this.httpService.axiosRef.get<{ meta: { last_page: number } }>(urlFirstPage, {
        headers: {
          Authorization: `Bearer ${this.tokenSellentt}`,
        },
      });
  
      const lastPage = firstResponse.data.meta.last_page;
      if (!lastPage) {
        console.error('❌ Não foi possível identificar a última página.');
        return;
      }
  
      const urlLastPage = `${this.apiUrlSellentt}${this.storeTag}?page=${lastPage}`;
  
      const lastResponse = await this.httpService.axiosRef.get<{ data: CustomerAPIResponse[] }>(urlLastPage, {
        headers: {
          Authorization: `Bearer ${this.tokenSellentt}`,
        },
      });
  
      const clientesData = lastResponse.data.data;
      if (!clientesData || clientesData.length === 0) {
        console.warn('⚠️ Nenhum cliente encontrado na última página.');
        return;
      } 
  
      for (const client of clientesData) {
        await this.processarCliente(client);
      }
  
      console.log('✅ Clientes da última página sincronizados com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao sincronizar clientes da última página:', error.message);
      throw error;
    }
  } 

  private async processarCliente(client: CustomerAPIResponse) {
    // Check if the customer already exists
    const existingClient = await this.clienteRepository.findOne({
      where: { codigo: client.code },
    });

    let regiao = await this.regiaoRepository.findOne({
      where: { codigo: client.region_code },
      relations: ['cidades'],  // Ensure we get the list of associated cities
    });

    if (!regiao) {
      regiao = await this.regiaoRepository.findOne({where: { codigo: 9}});;
    }

    if (existingClient) {
      existingClient.regiao = regiao;
      existingClient.ativo = client.is_active;
      
      await this.clienteRepository.save(existingClient);
      console.log(`Cliente código ${client.code} ja exists. Atualizando somente is_active...`);
      return;
    }

    // Fetch or create the city
    const cidade = await this.cidadeRepository.findOne({
      where: { nome: client.address_city },
      relations: ['estado'],
    });

    // If the region exists but the city is not in it, add the city
    if (regiao && cidade && !regiao.cidades.some(c => c.nome === cidade.nome)) {
        regiao.cidades.push(cidade);
        await this.regiaoRepository.save(regiao);
    }

    // Fetch the customer status
    const status = await this.statusClienteRepository.findOne({
      where: { status_cliente_id: Number(client.tags) || null },
    });

    const segmento = await this.categoriaRepository.findOne({
      where: { categoria_id: client.segment_id },
    });

    // Create the new customer
    const novoCliente = this.clienteRepository.create({
      nome: client.name,
      codigo: client.code,
      nome_empresa: client.company_name,
      tipo_doc: client.doc_type,
      numero_doc: client.doc_number,
      ie: client.reg_number,
      endereco: client.address_street,
      num_endereco: client.address_number,
      complemento: client.address_more,
      cep: client.address_zipcode,
      bairro: client.address_district,
      cidade_string: client.address_city,
      cidade: cidade || null,
      email: client.email_1.toLowerCase(),
      celular: client.phone_number_1,
      telefone_comercial: client.phone_number_2,
      ativo: client.is_active,
      regiao, // Ensure customer is assigned to the region
      data_criacao: new Date(client.created_at),
      data_atualizacao: new Date(client.updated_at),
      status_cliente: status || null,
      segmento_id: +client.segment_id,
      categoria_cliente: segmento,
    });

    await this.clienteRepository.save(novoCliente);
    console.log(`Customer ${novoCliente.nome} saved successfully!`);
  }

  async findAllCustomers(): Promise<Cliente[]> {
    return await this.clienteRepository.find({ 
      where: { ativo: 1 },
      relations: ['cidade.estado', 'regiao', 'status_cliente', 'regiao.vendedores', 'vendedor', 'categoria_cliente'],
      order: { cidade_string: 'ASC' }
    });
  }

  findCustomerByCode(codigo: number): Promise<Cliente> {
    return this.clienteRepository.findOne({ where: { codigo }, relations: ['cidade.estado', 'regiao', 'status_cliente', 'categoria_cliente'] });
  }

  findCustomersByStatus(id: number): Promise<StatusCliente[]> {
    return this.statusClienteRepository.find({ where: { status_cliente_id: id }, relations: ['clientes'] });
  }

  async syncroIdTiny(): Promise<void> {
    console.log("🔄 Iniciando sincronização de clientes do Tiny MG e SP...");

    await this.syncroTinyForState("MG", this.apiUrlTiny);
    await this.syncroTinyForState("SP", this.apiUrlTiny);

    console.log("✅ Sincronização de clientes concluída!");
  }

  /**
   * 🔁 **Sincroniza clientes do Tiny para um estado específico (MG ou SP)**
   */
  private async syncroTinyForState(uf: string, apiUrlTiny: string): Promise<void> {
    let offset = 0;
    const limit = 100;
    
    const token = await this.tinyAuthService.getAccessToken(uf);
    if (!token) {
      console.error(`❌ Erro ao obter token para ${uf}. Pulando sincronização.`);
      return;
    }

    while (true) {
      try {
        const url = `${apiUrlTiny}${this.contactTag}?offset=${offset}`;
        console.log(`📡 Buscando clientes ${uf}: ${url}`);

        const response = await this.httpService.axiosRef.get<{ itens: TinyCustomerResponse[] }>(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const clientesData = response.data.itens;

        if (!clientesData || clientesData.length === 0) {
          console.log(`🚫 Nenhum cliente encontrado para ${uf} no offset ${offset}.`);
          break;
        }

        console.log(`✅ ${clientesData.length} clientes recebidos de ${uf}.`);

        for (const client of clientesData) {
          await this.processarClienteTiny(client, uf);
        }

        offset += limit;
      } catch (error: any) {
        console.error(`❌ Erro ao sincronizar clientes ${uf}:`, error.message);
        break;
      }
    }
  }

  private async processarClienteTiny(client: TinyCustomerResponse, uf: string): Promise<void> {
    const normalizedCpfCnpj = client.cpfCnpj.replace(/[.\-\/]/g, '');
    const cliente = await this.clienteRepository.findOne({ where: { numero_doc: normalizedCpfCnpj } });

    if (cliente) {
        cliente.tiny_id = client.id;

        await this.clienteRepository.save(cliente);
        console.log(`✅ Cliente atualizado: ${cliente.nome} (${uf})`);
    } else {
      console.warn(`⚠️ Cliente não encontrado no banco: CPF/CNPJ ${normalizedCpfCnpj} (${uf})`);
    }
  }

  async registerCustomerTiny(codigo: number): Promise<number> {
    try {
        const customer = await this.findCustomerByCode(codigo);

        if (!customer) {
          throw new Error(`🚨 Cliente com código ${codigo} não encontrado.`);
        }
        const uf = customer.cidade.estado.sigla === 'MG' || customer.cidade.estado.sigla === 'SP' 
          ? customer.cidade.estado.sigla 
          : 'MG';
        const accessToken = await this.tinyAuthService.getAccessToken(uf);

        if (!accessToken) {
          throw new Error("🚨 Não foi possível obter um token válido para exportação.");
        }

        const body: TinyCustomerDto = {
          nome: customer.nome_empresa,
          fantasia: customer.nome,
          tipoPessoa: customer.tipo_doc === 'cnpj' ? 'J' : 'F',
          cpfCnpj: customer.numero_doc,
          inscricaoEstadual: customer.ie,
          celular: customer.celular,
          email: customer.email,
          endereco: {
            endereco: customer.endereco,
            numero: customer.num_endereco,
            complemento: customer.complemento,
            bairro: customer.bairro,
            municipio: customer.cidade_string,
            cep: customer.cep,
            uf: customer.cidade.estado.sigla,
            pais: 'Brasil',
          },
          situacao: 'A',
        };
        const apiUrl = this.apiUrlTiny + this.contactTag;

        const response = await this.httpService.axiosRef.post(apiUrl, body, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log('BODY ===========>', body)

        console.log(`✅ Cliente ${codigo} registrado no Tiny com sucesso!`); 
        customer.tiny_id = response.data.id
        await this.clienteRepository.save(customer);
        return response.data.id;   

    } catch (error) {
          console.error(`❌ Erro ao registrar cliente ${codigo} no Tiny:`, error.message);
          throw error;
      }
  }

  async saveCustomer(customer: Cliente): Promise<void> {
    await this.clienteRepository.save(customer);
    return
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async updateTags(): Promise<void> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
  
    const [statusAtivo, status60, status90, status180] = await Promise.all([
      this.statusClienteRepository.findOne({ where: { status_cliente_id: 101 } }),
      this.statusClienteRepository.findOne({ where: { status_cliente_id: 104 } }),
      this.statusClienteRepository.findOne({ where: { status_cliente_id: 102 } }),
      this.statusClienteRepository.findOne({ where: { status_cliente_id: 103 } }),
    ]);
  
    if (!status60 || !status90 || !status180 || !statusAtivo) {
      console.error("❌ ERRO: Status de cliente não encontrados.");
      return;
    }
  
    const clientes = await this.clienteRepository.find({ relations: ['status_cliente'] });
  
    const clientesParaAtualizar = [];
  
    for (const cliente of clientes) {
      let dataRef = cliente.ultima_compra || cliente.data_criacao;
  
      if (!dataRef) {
        console.warn(`⚠️ Cliente ${cliente.codigo} sem data válida para análise.`);
        continue;
      }
  
      const dataRefDate = new Date(dataRef);
      dataRefDate.setHours(0, 0, 0, 0);
  
      const diferencaEmDias = Math.floor((hoje.getTime() - dataRefDate.getTime()) / (1000 * 60 * 60 * 24));
      let novoStatus = statusAtivo;
      let proxStatusDias = 60 - diferencaEmDias;
  
      if (diferencaEmDias > 180) {
        novoStatus = status180;
        proxStatusDias = null;
      } else if (diferencaEmDias > 90) {
        novoStatus = status90;
        proxStatusDias = 180 - diferencaEmDias;
      } else if (diferencaEmDias > 60) {
        novoStatus = status60;
        proxStatusDias = 90 - diferencaEmDias;
      }
  
      cliente.status_cliente = novoStatus;
      cliente.prox_status = proxStatusDias;
      clientesParaAtualizar.push(cliente);
  
      console.log(`✅ Cliente ${cliente.codigo} -> Status ${novoStatus.status_cliente_id} (Próximo em ${proxStatusDias ?? 'n/a'} dias)`);
    }
  
    await this.clienteRepository.save(clientesParaAtualizar);
    console.log("✅ Atualização de status de clientes concluída.");
  }
  

  async lastPurchase(): Promise<void> {
    const jsonFilePath = 'src/utils/datas-ultima-compra.json';

    if (!fs.existsSync(jsonFilePath)) {
        console.error(`Erro: Arquivo '${jsonFilePath}' não encontrado.`);
        return;
    }

    const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
    const datasUltimaCompra = JSON.parse(jsonData);

    for (const item of datasUltimaCompra) {
        const cliente = await this.findCustomerByCode(item.id_cliente);

        if (!cliente) {
            console.warn(`Cliente com código ${item.id_cliente} não encontrado.`);
            continue;
        }

        const dataJson = new Date(item.data_pedido);
        const dataBanco = cliente.ultima_compra ? new Date(cliente.ultima_compra) : null;

        // Se não houver data no banco ou a nova data for mais recente, atualiza
        if (!dataBanco || dataJson > dataBanco) {
            cliente.ultima_compra = item.data_pedido;
            cliente.valor_ultima_compra = item.total_pedido; // Atualiza o valor da última compra
            await this.saveCustomer(cliente);
            console.log(`✅ Cliente ${item.id_cliente} atualizado para última compra: ${item.data_pedido}, valor: ${item.total_pedido}`);
        } else {
            console.log(`🔹 Cliente ${item.id_cliente} já tem uma data mais recente no banco (${cliente.ultima_compra}). Nenhuma atualização necessária.`);
        }
    }
  }

  async addZeroCpf(): Promise<void> {
    const clientes = await this.clienteRepository.find();
  
    for (const cliente of clientes) {
      if (
        cliente.tipo_doc === 'cpf' && cliente.numero_doc.length < 11
      ) {
        const cpfOriginal = cliente.numero_doc;
        cliente.numero_doc = cliente.numero_doc.padStart(11, '0');
        await this.saveCustomer(cliente);
        console.log(`✅ CPF ajustado: ${cpfOriginal} → ${cliente.numero_doc}`);
      }
    }
  
    console.log('🎯 Ajuste de CPFs concluído.');
  }

  async putPaymentTerms() {
    const clientes = await this.clienteRepository.find();

    const prazos = "1,2,3,4,5,6,8,10,11,15,17,20,21,22,23";

    // Função para dividir array em chunks de 50
    const chunkArray = <T>(arr: T[], chunkSize: number): T[][] =>
        Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
            arr.slice(i * chunkSize, i * chunkSize + chunkSize)
        );

    const clienteChunks = chunkArray(clientes, 20);

    const apiUrl = `${this.apiUrlSellentt}mass_stores`;
    console.log('Api URL=======================>', apiUrl);

    for (let i = 0; i < clienteChunks.length; i++) {
        const batch = clienteChunks[i].map(cliente => ({
            code: cliente.codigo, // ajuste se for outro campo identificador
            payment_term_list: prazos
        }));
        console.log('Batch ==========>', batch)

        try {
            const response = await this.httpService.axiosRef.put(apiUrl, batch, {
                headers: {
                    Authorization: `Bearer ${this.tokenSellentt}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Batch ${i + 1} enviado com sucesso.`);
        } catch (error) {
            console.error(`❌ Erro ao enviar batch ${i + 1}:`, error.message);
        }
    }

    console.log('🏁 Todos os batches foram processados com sucesso.');
  }

  async syncroWallet(): Promise<void> {
    const vendedoresIds = [1, 2, 3, 4]; // ✅ IDs reais dos vendedores
    const baseUrl = this.apiUrlSellentt + this.sellerTag;
  
    for (const vendedorId of vendedoresIds) {
      const url = `${baseUrl}/${vendedorId}/${this.storeTag}`;
      console.log(`🔄 Buscando lojas para vendedor ${vendedorId}: ${url}`);
  
      try {
        const response = await this.httpService.axiosRef.get<{ data: { code: number }[] }>(url, {
          headers: { Authorization: `Bearer ${this.tokenSellentt}` },
        });
  
        const lojas = response.data.data;
  
        if (!lojas || lojas.length === 0) {
          console.warn(`⚠️ Nenhuma loja retornada para vendedor ${vendedorId}.`);
          continue;
        }
  
        console.log(`📦 ${lojas.length} lojas recebidas para vendedor ${vendedorId}.`);
  
        const vendedor = await this.sellersSevice.findBy(vendedorId); // ✅ buscar entidade completa
  
        if (!vendedor) {
          console.warn(`❌ Vendedor ${vendedorId} não encontrado.`);
          continue;
        }
  
        for (const loja of lojas) {
          const cliente = await this.clienteRepository.findOne({ where: { codigo: loja.code } });
  
          if (!cliente) {
            console.warn(`❌ Cliente com código ${loja.code} não encontrado no banco.`);
            continue;
          }
  
          cliente.vendedor = vendedor; // ✅ associa objeto vendedor
          await this.clienteRepository.save(cliente);
          console.log(`✅ Cliente ${cliente.codigo} atualizado com carteira (vendedor) = ${vendedorId}`);
        }
  
      } catch (error) {
        console.error(`❌ Erro ao buscar lojas para vendedor ${vendedorId}:`, error.message);
      }
    }
  
    console.log('🏁 Sincronização de carteiras concluída com sucesso!');
  }
  
  async updateCustomersFromJsonFile(): Promise<void> {
    const jsonFilePath = 'src/utils/lista-inativos.json';
  
    if (!fs.existsSync(jsonFilePath)) {
        console.error(`Erro: Arquivo '${jsonFilePath}' não encontrado.`);
        return;
    }
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf-8');
    let clientesInput: { codigo: number }[];
  
    try {
      clientesInput = JSON.parse(jsonContent);
    } catch (e) {
      console.error('❌ Erro ao fazer parse do JSON:', e.message);
      return;
    }
  
    // Força is_active = 0 para todos os clientes
    const clientesComIsActive = clientesInput.map(cliente => ({
      code: cliente.codigo,
      is_active: 0
    }));
  
    const chunkArray = <T>(arr: T[], size: number): T[][] =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
      );
  
    const batches = chunkArray(clientesComIsActive, 20);
    const apiUrl = `${this.apiUrlSellentt}mass_stores`;
  
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📦 Enviando lote ${i + 1}/${batches.length} com ${batch.length} clientes.`);
  
      try {
        await this.httpService.axiosRef.put(apiUrl, batch, {
          headers: {
            Authorization: `Bearer ${this.tokenSellentt}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`✅ Lote ${i + 1} enviado com sucesso.`);
      } catch (err: any) {
        console.error(`❌ Erro ao enviar lote ${i + 1}:`, err.message);
      }
    }
  
    console.log('🏁 Atualização em massa finalizada.');
  }

  async associateCustomersGrup(): Promise<GrupoCliente> {
    const grupo = await this.grupoClienteRepository.findOne({
      where: { grupo_cliente_id: 1 }, // Ajuste o ID do grupo conforme necessário
      relations: ['clientes'],
    });

    const codClientes = [445, 653, 914, 1117, 1204, 1341, 1527, 1866, 1995, 2071, 2099, 2246, 2513, 2906, 2909, 2911, 2915, 2918, 2919, 2920, 2922, 2923, 2925, 2926, 2928]

    if (!grupo) {
      console.error('Grupo não encontrado.');
      return;
    }

    for (const cod of codClientes) {
      this.clienteRepository.findOne({ where: { codigo: cod }, relations: ['grupo'] })
        .then(cliente => {
          if (cliente) {
            cliente.grupo = grupo;
            return this.clienteRepository.save(cliente);
          } else {
            console.warn(`Cliente com código ${cod} não encontrado.`);
          }
        })
        .catch(err => console.error(`Erro ao associar cliente ${cod} ao grupo:`, err));
    }
    const grupoAtualizado = await this.grupoClienteRepository.findOne({
      where: { grupo_cliente_id: 1 },
      relations: ['clientes'],
    });
    
    return grupoAtualizado
  }

  async registerBling(codigo: number): Promise<number> {
    try {
      const customer = await this.findCustomerByCode(codigo);
      if (!customer) {
        throw new Error(`🚨 Cliente com código ${codigo} não encontrado.`);
      }

      const token = await this.blingAuthService.getAccessToken('PURELI');
      if (!token) {
        throw new Error("🚨 Não foi possível obter um token válido para exportação.");
      }

      console.log('customer ==========>', customer)
      const body: CustomerBlingDto = {
        nome: customer.nome_empresa || customer.nome,
        codigo: customer.codigo.toString(),
        situacao: 'A',
        numeroDocumento: customer.numero_doc,
        fantasia: customer.nome || customer.nome_empresa,
        tipo: customer.tipo_doc === 'cnpj' ? 'J' : 'F',
        ie: customer.ie,
        email: customer.email,
        endereco: {
          geral: {
            endereco: customer.endereco,
            cep: customer.cep,
            bairro: customer.bairro,
            municipio: customer.cidade_string,
            uf: customer.cidade.estado.sigla,
            numero: customer.num_endereco,
            complemento: customer.complemento || '',
          },
          cobranca: {
            endereco: customer.endereco,
            cep: customer.cep,
            bairro: customer.bairro,
            municipio: customer.cidade_string,
            uf: customer.cidade.estado.sigla,
            numero: customer.num_endereco,
            complemento: customer.complemento || '',
          },
        },
      };
      const apiUrl = this.apiBlingUrl + this.contactTag;

      const response = await this.httpService.axiosRef.post(apiUrl, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('body =========>', body)
      console.log(`✅ Cliente ${codigo} registrado no Bling com sucesso!`);
      const bling_id = response.data.data.id

      customer.bling_id_p = bling_id;
      await this.clienteRepository.save(customer);
      return bling_id;
    }
    catch (error) {
      console.error(`❌ Erro ao registrar cliente ${codigo} no Bling:`, error.message);
      throw error;
    }
  }

  async statusPorRegiao(regiaoId: number): Promise<Array<{ id: number; nome: string; quantidade: number }>> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const periodoDias = 60;
    const dataLimite60DiasAtras = new Date(hoje.getTime() - periodoDias * 24 * 60 * 60 * 1000);
    dataLimite60DiasAtras.setHours(0, 0, 0, 0);

    const [statusAtivo, status60, status90, status180] = await Promise.all([
      this.statusClienteRepository.findOne({ where: { status_cliente_id: 101 } }),
      this.statusClienteRepository.findOne({ where: { status_cliente_id: 104 } }),
      this.statusClienteRepository.findOne({ where: { status_cliente_id: 102 } }),
      this.statusClienteRepository.findOne({ where: { status_cliente_id: 103 } }),
    ]);

    if (!status60 || !status90 || !status180 || !statusAtivo) {
      throw new Error("❌ ERRO: Status de cliente não encontrados.");
    }

    const clientes = await this.clienteRepository.find({
      where: { regiao: { regiao_id: regiaoId } },
      relations: ['status_cliente', 'regiao'],
    });

    const clienteIds = clientes.map(c => c.cliente_id);

    // Buscar todas as vendas válidas (tipo_pedido_id = 10438) até hoje
    const todasVendas = await this.vendaRepository.find({
      where: { 
        cliente: { cliente_id: In(clienteIds) },
        tipo_pedido: { tipo_pedido_id: 10438 }
      },
      relations: ['tipo_pedido', 'cliente'],
      order: { data_criacao: 'DESC' },
    });

    // Mapear última venda atual por cliente
    const ultimaVendaAtualPorCliente = new Map<number, Venda>();
    for (const venda of todasVendas) {
      if (venda.cliente) {
        const clienteId = venda.cliente.cliente_id;
        if (!ultimaVendaAtualPorCliente.has(clienteId)) {
          ultimaVendaAtualPorCliente.set(clienteId, venda);
        }
      }
    }

    // Mapear última venda até 60 dias atrás por cliente (todas as vendas até essa data)
    const ultimaVenda60DiasPorCliente = new Map<number, Venda>();
    for (const venda of todasVendas) {
      if (venda.cliente) {
        const dataVenda = new Date(venda.data_criacao);
        dataVenda.setHours(0, 0, 0, 0);
        
        // Se a venda é anterior ou igual a 60 dias atrás, considerar para cálculo do status há 60 dias
        if (dataVenda <= dataLimite60DiasAtras) {
          const clienteId = venda.cliente.cliente_id;
          if (!ultimaVenda60DiasPorCliente.has(clienteId)) {
            ultimaVenda60DiasPorCliente.set(clienteId, venda);
          }
        }
      }
    }

    // Função auxiliar para calcular status baseado em uma data de referência
    const calcularStatus = (dataRef: Date, dataComparacao: Date = hoje): StatusCliente => {
      const diferencaEmDias = Math.floor((dataComparacao.getTime() - dataRef.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diferencaEmDias > 180) {
        return status180;
      } else if (diferencaEmDias > 90) {
        return status90;
      } else if (diferencaEmDias > 60) {
        return status60;
      } else {
        return statusAtivo;
      }
    };

    // Contadores por status - atual e há 60 dias
    const contadoresAtual = {
      ativo: 0,
      atencao: 0,
      frio: 0,
      inativo: 0,
    };

    const contadores60DiasAtras = {
      ativo: 0,
      atencao: 0,
      frio: 0,
      inativo: 0,
    };

    for (const cliente of clientes) {
      // Calcular data de referência atual
      let dataRefAtual = cliente.ultima_compra || cliente.data_criacao;
      const ultimaVendaAtual = ultimaVendaAtualPorCliente.get(cliente.cliente_id);
      if (ultimaVendaAtual) {
        const dataVenda = new Date(ultimaVendaAtual.data_criacao);
        const dataUltimaCompra = cliente.ultima_compra ? new Date(cliente.ultima_compra) : null;
        if (!dataUltimaCompra || dataVenda > dataUltimaCompra) {
          dataRefAtual = ultimaVendaAtual.data_criacao;
        }
      }

      if (!dataRefAtual) {
        continue;
      }

      // Calcular status atual baseado na última compra/venda
      const dataRefAtualDate = new Date(dataRefAtual);
      dataRefAtualDate.setHours(0, 0, 0, 0);
      const statusAtual = calcularStatus(dataRefAtualDate, hoje);

      // Contar status atual
      const statusAtualId = statusAtual.status_cliente_id;
      if (statusAtualId === 101) {
        contadoresAtual.ativo++;
      } else if (statusAtualId === 104) {
        contadoresAtual.atencao++;
      } else if (statusAtualId === 102) {
        contadoresAtual.frio++;
      } else if (statusAtualId === 103) {
        contadoresAtual.inativo++;
      }

      // Calcular data de referência há 60 dias atrás
      // Buscar a última venda até 60 dias atrás, ou usar ultima_compra/data_criacao se não houver venda
      const ultimaVenda60Dias = ultimaVenda60DiasPorCliente.get(cliente.cliente_id);
      let dataRef60Dias: Date | null = null;
      
      if (ultimaVenda60Dias) {
        dataRef60Dias = new Date(ultimaVenda60Dias.data_criacao);
      } else {
        // Se não há venda até 60 dias atrás, usar ultima_compra ou data_criacao
        const ultimaCompra = cliente.ultima_compra ? new Date(cliente.ultima_compra) : null;
        const dataCriacao = cliente.data_criacao ? new Date(cliente.data_criacao) : null;
        
        if (ultimaCompra && dataCriacao) {
          dataRef60Dias = ultimaCompra > dataCriacao ? ultimaCompra : dataCriacao;
        } else {
          dataRef60Dias = ultimaCompra || dataCriacao;
        }
      }

      if (!dataRef60Dias) {
        continue;
      }

      // Calcular status há 60 dias baseado na última compra/venda até aquela data
      const dataRef60DiasDate = new Date(dataRef60Dias);
      dataRef60DiasDate.setHours(0, 0, 0, 0);
      const status60DiasAtras = calcularStatus(dataRef60DiasDate, dataLimite60DiasAtras);

      // Contar status há 60 dias
      const status60DiasId = status60DiasAtras.status_cliente_id;
      if (status60DiasId === 101) {
        contadores60DiasAtras.ativo++;
      } else if (status60DiasId === 104) {
        contadores60DiasAtras.atencao++;
      } else if (status60DiasId === 102) {
        contadores60DiasAtras.frio++;
      } else if (status60DiasId === 103) {
        contadores60DiasAtras.inativo++;
      }
    }

    return [
      {
        id: statusAtivo.status_cliente_id,
        nome: statusAtivo.nome,
        quantidade: contadoresAtual.ativo - contadores60DiasAtras.ativo,
      },
      {
        id: status60.status_cliente_id,
        nome: status60.nome,
        quantidade: contadoresAtual.atencao - contadores60DiasAtras.atencao,
      },
      {
        id: status90.status_cliente_id,
        nome: status90.nome,
        quantidade: contadoresAtual.frio - contadores60DiasAtras.frio,
      },
      {
        id: status180.status_cliente_id,
        nome: status180.nome,
        quantidade: contadoresAtual.inativo - contadores60DiasAtras.inativo,
      },
    ];
  }
}
