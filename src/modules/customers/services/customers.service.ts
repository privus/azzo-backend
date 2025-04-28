import { TinyAuthService } from './../../sells/services/tiny-auth.service';
import { Body, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerAPIResponse, TinyCustomerDto, TinyCustomerResponse } from '../dto';
import { Regiao, StatusCliente, Cidade, Cliente, CategoriaCliente } from '../../../infrastructure/database/entities';
import { ICustomersRepository, ISellersRepository } from '../../../domain/repositories';
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



  constructor(
    @InjectRepository(Cliente) private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Cidade) private readonly cidadeRepository: Repository<Cidade>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
    @InjectRepository(StatusCliente) private readonly statusClienteRepository: Repository<StatusCliente>,
    @InjectRepository(CategoriaCliente) private readonly categoriaRepository: Repository<CategoriaCliente>,
    @Inject('ISellersRepository') private readonly sellersSevice: ISellersRepository,
    private readonly tinyAuthService: TinyAuthService,  
    private readonly httpService: HttpService,
  ) {
    this.tokenSellentt = process.env.SELLENTT_API_TOKEN;
    this.apiUrlSellentt = process.env.SELLENTT_API_URL;
    this.apiUrlTiny = process.env.TINY_API_URL;
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
      relations: ['cidade.estado', 'regiao', 'status_cliente', 'regiao.vendedores', 'vendedor', 'categoria_cliente'] 
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

        const uf = customer.cidade.estado.sigla;
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
    const clientes = await this.clienteRepository.find({ relations: ['status_cliente'] });
    const hoje = new Date();
  
    // Preload status IDs to avoid multiple DB queries
    const status60 = await this.statusClienteRepository.findOne({ where: { status_cliente_id: 104 } });
    const status90 = await this.statusClienteRepository.findOne({ where: { status_cliente_id: 102 } });
    const status180 = await this.statusClienteRepository.findOne({ where: { status_cliente_id: 103 } });
    const statusAtivo = await this.statusClienteRepository.findOne({ where: { status_cliente_id: 101 } });
  
    if (!status60 || !status90 || !status180 || !statusAtivo) {
      console.error("❌ ERRO: Um ou mais status de cliente não foram encontrados no banco.");
      return;
    }
  
    for (const cliente of clientes) {
  
      let dataRef = cliente.ultima_compra || cliente.data_criacao;
      const isUsingDataCriacao = !cliente.ultima_compra;
      
      if (isUsingDataCriacao) {
        console.log(`🔹 Cliente ${cliente.codigo} sem data última compra. Mantendo status.`);
        continue;
      }

      const dataRefDate = new Date(dataRef);
      dataRefDate.setHours(0, 0, 0, 0);
      const hojeSemHora = new Date();
      hojeSemHora.setHours(0, 0, 0, 0);
  
      const diferencaEmDias = Math.floor((hojeSemHora.getTime() - dataRefDate.getTime()) / (1000 * 60 * 60 * 24));  
 
      let novoStatus = statusAtivo;
      let proxStatusDias = null;
  
      if (diferencaEmDias > 180) {
        novoStatus = status180;
        proxStatusDias = null;
      } else if (diferencaEmDias > 90) {
        novoStatus = status90;
        proxStatusDias = 180 - diferencaEmDias;
      } else if (diferencaEmDias > 60) {
        novoStatus = status60;
        proxStatusDias = 90 - diferencaEmDias;
      } else {
        novoStatus = statusAtivo;
        proxStatusDias = 60 - diferencaEmDias;
      }
  
      cliente.status_cliente = novoStatus;
      cliente.prox_status = proxStatusDias;
      await this.clienteRepository.save(cliente);
      console.log(`✅ Cliente ${cliente.codigo} atualizado para status ${cliente.status_cliente.status_cliente_id}, próxima mudança em ${proxStatusDias ?? 'n/a'} dias`);
    }
  
    console.log("✅ Atualização de tags concluída.");
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

    const prazos = "1,2,3,4,5,6,8,10,11,15,17,20,21,22";

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
  
  
}
