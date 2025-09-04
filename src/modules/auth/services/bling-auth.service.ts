import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BlingTokens } from '../../../infrastructure/database/entities';
import { IBlingTokenRepository } from '../../../domain/repositories';

@Injectable()
export class BlingAuthService {
    private readonly logger = new Logger(BlingAuthService.name);
    private clientIdPureli: string;
    private clientSecretPureli: string;
    private initialRefreshTokenPureli: string;
    private clientIdAzzo: string;
    private clientSecretAzzo: string;
    private initialRefreshTokenAzzo: string;
    private clientIdPersonizi: string;
    private clientSecretPersonizi: string;
    private initialRefreshTokenPersonizi: string;

    constructor(
        private readonly httpService: HttpService,
        @Inject('IBlingTokenRepository') private readonly blingTokenService: IBlingTokenRepository
    ) {
        this.clientIdPureli = process.env.BLING_CLIENT_ID_PURELI;
        this.clientSecretPureli = process.env.BLING_CLIENT_SECRET_PURELI;
        this.initialRefreshTokenPureli = process.env.BLING_REFRESH_TOKEN_PURELI;
        this.clientIdAzzo = process.env.BLING_CLIENT_ID_AZZO;
        this.clientSecretAzzo = process.env.BLING_CLIENT_SECRET_AZZO;
        this.initialRefreshTokenAzzo = process.env.BLING_REFRESH_TOKEN_AZZO;
        this.clientIdPersonizi = process.env.BLING_CLIENT_ID_PERSONIZI;
        this.clientSecretPersonizi = process.env.BLING_CLIENT_SECRET_PERSONIZI;
        this.initialRefreshTokenPersonizi = process.env.BLING_REFRESH_TOKEN_PERSONIZI;
    }
    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    async autoRefreshToken(): Promise<void> {
        this.logger.log('🔄 Iniciando renovação automática do token...');
    
        const pureli = 'PURELI';
        const azzo = 'AZZO';
        const personizi = 'PERSONIZI';
        let lastTokenPureli = await this.blingTokenService.getLastToken(pureli);
        let lastTokenAzzo = await this.blingTokenService.getLastToken(azzo);
        let lastTokenPersonizi = await this.blingTokenService.getLastToken(personizi);
    
        if (!lastTokenPureli) {
            lastTokenPureli = {
                id: 0,
                access_token: '', 
                refresh_token: this.initialRefreshTokenPureli,
                expires_at: new Date(),
                updated_at: new Date(),
            } as BlingTokens;
        }

        if (!lastTokenAzzo) {
            lastTokenAzzo = {
                id: 0,
                access_token: '', 
                refresh_token: this.initialRefreshTokenAzzo,
                expires_at: new Date(),
                updated_at: new Date(),
            } as BlingTokens;
        }

        if (!lastTokenPersonizi) {
            lastTokenPersonizi = {
                id: 0,
                access_token: '', 
                refresh_token: this.initialRefreshTokenPersonizi,
                expires_at: new Date(),
                updated_at: new Date(),
            } as BlingTokens;
        }

        await this.refreshAccessToken(lastTokenPureli.refresh_token, pureli);
        await this.refreshAccessToken(lastTokenAzzo.refresh_token, azzo);
        await this.refreshAccessToken(lastTokenPersonizi.refresh_token, personizi);
    }

    async getAccessToken(company: string ): Promise<string> {
        const lastToken = await this.blingTokenService.getLastToken(company);

        if (!lastToken) {
            this.autoRefreshToken();
            const lastToken = await this.blingTokenService.getLastToken(company);
            return lastToken.access_token;
        }

        const now = new Date();
        if (lastToken.expires_at > now) {
            return lastToken.access_token;
        }
        return this.refreshAccessToken(lastToken.refresh_token, company);
    }

    async refreshAccessToken(refreshToken: string, company: string): Promise<string> {
        try {
            const client_id = 
                company === 'PURELI' ? this.clientIdPureli :
                company === 'AZZO' ? this.clientIdAzzo :
                company === 'PERSONIZI' ? this.clientIdPersonizi : null;
    
            const client_secret =
                company === 'PURELI' ? this.clientSecretPureli :
                company === 'AZZO' ? this.clientSecretAzzo :
                company === 'PERSONIZI' ? this.clientSecretPersonizi : null;
    
            if (!client_id || !client_secret) {
                this.logger.error(`❌ Credenciais ausentes para empresa ${company}`);
                throw new Error(`Credenciais inválidas para ${company}`);
            }
    
            this.logger.log(`🔄 Solicitando renovação do token para ${company}...`);
    
            const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
    
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '1.0',
                'Authorization': `Basic ${basicAuth}`,
            };
    
            const data = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            });
    
            const response = await this.httpService.axiosRef.post(
                'https://api.bling.com.br/Api/v3/oauth/token',
                data,
                { headers }
            );
    
            const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;
    
            await this.blingTokenService.saveToken(access_token, newRefreshToken, expires_in, company);
    
            this.logger.log(`✅ Token renovado com sucesso para ${company}`);
            return access_token;
        } catch (error) {
            const errorMessage = error?.response?.data?.error?.description || error.message;
            this.logger.error(`❌ Erro ao renovar token para ${company}: ${errorMessage}`);
            throw new Error('Erro ao renovar o token');
        }
    }
    
}

