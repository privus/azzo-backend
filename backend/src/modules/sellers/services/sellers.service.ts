import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendedor, Regiao } from '../../../infrastructure/database/entities';
import { ConfigService } from '@nestjs/config';
import { SellerAPIResponse } from '../dto/sellers.dto';

@Injectable()
export class SellersService {
  private readonly apiUrl = 'https://app.pedidosdigitais.com.br/api/v2/seller';
  private readonly token: string;

  constructor(
    @InjectRepository(Vendedor) private readonly vendedorRepository: Repository<Vendedor>,
    @InjectRepository(Regiao) private readonly regiaoRepository: Repository<Regiao>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.token = this.configService.get<string>('SELLENTT_API_TOKEN');
  }

  async syncroSellers(): Promise<void> {
    try {
      const response = await this.httpService.axiosRef.get<{ data: SellerAPIResponse[] }>(this.apiUrl, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const sellersData = response.data.data;
      console.log('Vendedores recebidos =>', sellersData);
      for (const seller of sellersData) {
        await this.processSeller(seller);
      }
    } catch (error) {
      console.error('Erro ao sincronizar vendedores:', error);
      throw error;
    }
  }

  private async processSeller(seller: SellerAPIResponse) {
    // 1) Busca a região pelo ID (ou, se preferir, pelo campo 'nome')
    const regiao = await this.regiaoRepository.findOne({
      where: { codigo: seller.region_code },
    });

    // 2) Cria ou atualiza o vendedor
    const novoVendedor = this.vendedorRepository.create({
      codigo: seller.code,
      nome: seller.name,
      ativo: seller.is_active,
      data_criacao: seller.created_at,
      regiao: regiao || null, // Se não encontrar a região, salva null ou trate como desejar
    });

    // 3) Salva no banco
    await this.vendedorRepository.save(novoVendedor);
    console.log('Vendedor sincronizado =>', novoVendedor);
  }

  async findBy(param: Partial<Vendedor>): Promise<Vendedor | null> {
    return this.vendedorRepository.findOne({ where: param });
  }
}
