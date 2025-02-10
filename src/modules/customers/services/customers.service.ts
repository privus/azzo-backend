import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerAPIResponse } from '../dto/customers.dto';
import { Regiao, StatusCliente, Cidade, Cliente } from '../../../infrastructure/database/entities';

@Injectable()
export class CustomersService {
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly apiTag = 'stores'; // Initialize apiTag properly

  constructor(
    @InjectRepository(Cliente) private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(Cidade) private readonly cidadeRepository: Repository<Cidade>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
    @InjectRepository(StatusCliente) private readonly statusClienteRepository: Repository<StatusCliente>,
    private readonly httpService: HttpService,
  ) {
    this.token = process.env.SELLENTT_API_TOKEN;
    this.apiUrl = process.env.SELLENTT_API_URL;
  }

  async syncroCostumers(): Promise<void> {
    let page = 1;

    while (true) {
      try {
        // Construct the request URL
        const url = `${this.apiUrl}${this.apiTag}?page=${page}`;
        console.log(`Requesting: ${url}`); // Log the URL for debugging

        // Perform the HTTP request
        const response = await this.httpService.axiosRef.get<{ data: CustomerAPIResponse[] }>(url, {
          headers: {
            Authorization: `Bearer ${this.token}`,
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

    if (existingClient) {
      console.log(`Customer with code ${client.code} already exists. Skipping...`);
      return;
    }

    const cidade = await this.cidadeRepository.findOne({
      where: { nome: client.address_city },
      relations: ['estado'],
    });

    let regiao = await this.regiaoRepository.findOne({
      where: { codigo: client.region_code },
    });

    if (!regiao && client.region_code == 9) {
      regiao = this.regiaoRepository.create({
        nome: 'Região Geral',
        codigo: 9,
        cidades: cidade ? [cidade] : [],
      });
      await this.regiaoRepository.save(regiao);
    }

    const status = await this.statusClienteRepository.findOne({
      where: { status_cliente_id: Number(client.tags) },
    });

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
      regiao,
      data_criacao: new Date(client.created_at),
      data_atualizacao: new Date(client.updated_at),
      status_cliente: status || null,
    });

    await this.clienteRepository.save(novoCliente);
    console.log(`Customer ${novoCliente.nome} saved successfully!`);
  }

  findAllCostumers(): Promise<Cliente[]> {
    return this.clienteRepository.find({ relations: ['cidade.estado', 'regiao', 'status_cliente'] });
  }

  findCostumerByCode(codigo: number): Promise<Cliente> {
    return this.clienteRepository.findOne({ where: { codigo }, relations: ['cidade.estado', 'regiao', 'status_cliente'] });
  }

  findCostumersByStatus(id: number): Promise<StatusCliente[]> {
    return this.statusClienteRepository.find({ where: { status_cliente_id: id }, relations: ['clientes'] });
  }
}
