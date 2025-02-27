import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TinyTokens } from '../../../infrastructure/database/entities';
import { ITinyTokenRepository } from '../../../domain/repositories';

@Injectable()
export class TinyTokenService implements ITinyTokenRepository {
    constructor(
        @InjectRepository(TinyTokens)
        private readonly tokenRepository: Repository<TinyTokens>,
    ) {}

    async getLastToken(uf: string): Promise<TinyTokens | null> {
        const tokens = await this.tokenRepository.find({
            where: { uf }, // Filtra pelo estado desejado
            order: { updated_at: 'DESC' }, // Ordena pelo mais recente
            take: 1, // Pega apenas o último
        });
    
        return tokens.length > 0 ? tokens[0] : null;
    }
    
   
    async saveToken(accessToken: string, refreshToken: string, expiresIn: number, uf: string): Promise<void> {
        const expiresAt = new Date(Date.now() + expiresIn * 1000); // Converte segundos para timestamp
    
        let tokenEntry = await this.getLastToken(uf);
        if (!tokenEntry) {
            tokenEntry = this.tokenRepository.create({
                uf, // 🔹 Adicionando o estado corretamente!
            });
        }
    
        tokenEntry.access_token = accessToken;
        tokenEntry.refresh_token = refreshToken;
        tokenEntry.expires_at = expiresAt;
        tokenEntry.uf = uf;
    
        await this.tokenRepository.save(tokenEntry);
    }
    
    async deleteToken(): Promise<void> {
        await this.tokenRepository.delete({});
    }
}
