import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PSell } from '../../../infrastructure/database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Between, Not, IsNull } from 'typeorm';

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
                pagina: 1,
                registros_por_pagina: 400,
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


    async deleteOrdersByDateRange(startDate: string, endDate: string) {
        const vendas = await this.pSellsRepository.find({
            where: {
                data_pedido: Between(new Date(startDate), new Date(endDate)),
                cod_omie: Not(IsNull()),
            },
        });

        if (!vendas.length) {
            this.logger.warn(`Nenhuma venda com cod_omie encontrada entre ${startDate} e ${endDate}.`);
            return;
        }

        for (const venda of vendas) {
            try {
                const result = await this.deleteOrder(venda.cod_omie);
                this.logger.log(`Excluído com sucesso: venda ${venda.codigo}, cod_omie ${venda.cod_omie}`);
            } catch (err) {
                this.logger.error(`Erro ao excluir cod_omie ${venda.cod_omie} para venda ${venda.codigo}: ${err.message}`);
            }
        }
    }

    private async deleteOrder(codOmie: number) {
        const body = {
            call: "ExcluirContaReceber",
            param: [{ chave_lancamento: codOmie }],
            app_key: this.clientKey,
            app_secret: this.clientSecret,
        };
    
        try {
            const response = await this.httpService.axiosRef.post(
                this.apiOmieUrl + this.tag,
                body
            );
            return response.data;
        } catch (error) {
            this.logger.error(`Erro na API Omie: ${error.message}`);
            throw error;
        }
    }    
}
