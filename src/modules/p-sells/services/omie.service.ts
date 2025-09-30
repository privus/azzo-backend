import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PSell } from '../../../infrastructure/database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OmieService {
    private readonly logger = new Logger(OmieService.name);
    private readonly clientKey: string;
    private readonly clientSecret: string;
    private readonly apiOmieUrl: string;
    private readonly tag = 'financas/contareceber/'
    
    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(PSell) private readonly pSellsRepository: Repository<PSell>,
    ) {
        this.clientSecret = process.env.OMIE_APP_SECRET_PERSONIZI;
        this.clientKey = process.env.OMIE_APP_KEY_PERSONIZI;
        this.apiOmieUrl = process.env.OMIE_API_URL;
    }

    async getOrdersReceived() {
        const body = {
            call: "ListarContasReceber",
            param: [
            {
                pagina: 4,
                registros_por_pagina: 100,
                apenas_importado_api: "S",
            }
            ],
            app_key: this.clientKey,
            app_secret: this.clientSecret
        };
    
        try {
            const response = await this.httpService.axiosRef.post(
                this.apiOmieUrl + this.tag,
                body,
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    async insertOmieCod() {
        const vendas = await this.pSellsRepository.find({ where: { cod_omie: null } });
        const response = await this.getOrdersReceived();
        const orders = response?.conta_receber_cadastro || [];
    
        // Cria um mapa de integração para busca rápida
        const ordersMap = new Map(
            orders.map(order => [
                order.codigo_lancamento_integracao,
                order.codigo_lancamento_omie
            ])
        );
    
        for (const venda of vendas) {
            const omieCode = ordersMap.get(venda.cod_bling?.toString());
            if (omieCode) {
                venda.cod_omie = +omieCode;
                await this.pSellsRepository.save(venda);
                this.logger.log(`Venda ${venda.codigo} atualizada com cod_omie ${venda.cod_omie}`);
            }
        }
    }
    
}
