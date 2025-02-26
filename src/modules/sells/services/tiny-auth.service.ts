import { Injectable, Logger, UseFilters } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TinyTokenService } from './tiny-token.service';
import { TinyTokens } from '../../../infrastructure/database/entities';

@Injectable()
export class TinyAuthService {
    private readonly logger = new Logger(TinyAuthService.name);
    private clientIdMg: string;
    private clientIdSp: string;
    private clientSecretMg: string;
    private clientSecretSp: string;
    private initialRefreshTokenMg: string;
    private initialRefreshTokenSp: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly tinyTokenService: TinyTokenService
    ) {
        this.clientIdMg = process.env.TINY_CLIENT_ID_MG;
        this.clientIdSp = process.env.TINY_CLIENT_ID_SP;
        this.clientSecretMg = process.env.TINY_CLIENT_SECRET_MG;
        this.clientSecretSp = process.env.TINY_CLIENT_SECRET_SP;
        this.initialRefreshTokenMg = process.env.TINY_REFRESH_TOKEN_MG;
        this.initialRefreshTokenSp = process.env.TINY_REFRESH_TOKEN_SP;
    }

    @Cron(CronExpression.EVERY_DAY_AT_3PM)
    async autoRefreshToken(): Promise<void> {
        this.logger.log('🔄 Iniciando renovação automática do token...');
    
        const mg = 'MG';
        const sp = 'SP';
        let lastTokenMg = await this.tinyTokenService.getLastToken(sp);
        let lastTokenSp = await this.tinyTokenService.getLastToken(mg);
    
        if (!lastTokenMg) {
            lastTokenMg = {
                id: 0,
                access_token: '', 
                refresh_token: this.initialRefreshTokenMg,
                expires_at: new Date(),
                updated_at: new Date(),
            } as TinyTokens;
        }
        if (!lastTokenSp) {
            lastTokenSp = {
                id: 0,
                access_token: '', 
                refresh_token: this.initialRefreshTokenSp,
                expires_at: new Date(),
                updated_at: new Date(),
            } as TinyTokens;
        }
        await this.refreshAccessToken(lastTokenMg.refresh_token, mg);
        await this.refreshAccessToken(lastTokenSp.refresh_token, sp);
    }
    
    async getAccessToken(uf: string ): Promise<string> {
        const lastToken = await this.tinyTokenService.getLastToken(uf);

        if (!lastToken) {
            this.autoRefreshToken();
            const lastToken = await this.tinyTokenService.getLastToken(uf);
            return lastToken.access_token
        }

        const now = new Date();
        if (now < lastToken.expires_at) {
            return lastToken.access_token;
        }
        return this.refreshAccessToken(lastToken.refresh_token, uf);
    }

    async refreshAccessToken(refreshToken: string, uf: string): Promise<string> {
        try {
            const client_id = uf === 'MG' ? this.clientIdMg : this.clientIdSp;
            const client_secret = uf === 'MG' ? this.clientSecretMg : this.clientSecretSp;
            this.logger.log('🔄 Solicitando renovação do token...');

            const response = await this.httpService.axiosRef.post(
                'https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token',
                new URLSearchParams({
                    grant_type: 'refresh_token',
                    client_id: client_id,
                    client_secret: client_secret,
                    refresh_token: refreshToken,
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );

            const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

            if (!access_token || !newRefreshToken) {
                throw new Error('❌ Falha ao renovar tokens.');
            }

            await this.tinyTokenService.saveToken(access_token, newRefreshToken, expires_in, uf);

            this.logger.log('✅ Token atualizado com sucesso.');
            return access_token;
        } catch (error) {
            this.logger.error('❌ Erro ao renovar token:', error.response?.data || error.message);
            return '';
        }
    }
}
