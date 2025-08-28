import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlingTokens } from '../../../infrastructure/database/entities';
import { IBlingTokenRepository } from '../../../domain/repositories';

@Injectable()
export class BlingTokenService implements IBlingTokenRepository {
    constructor(
        @InjectRepository(BlingTokens)
        private readonly tokenRepository: Repository<BlingTokens>,
    ) {}

    async getLastToken(company: string): Promise<BlingTokens | null> {
        const tokens = await this.tokenRepository.find({
            where: { company }, // Filtra pela empresa desejada
            order: { updated_at: 'DESC' }, // Ordena pelo mais recente
            take: 1, // Pega apenas o último
        });

        return tokens.length > 0 ? tokens[0] : null;
    }

    async saveToken(accessToken: string, refreshToken: string, expiresIn: number, company: string): Promise<void> {
        const expiresAt = new Date(Date.now() + expiresIn * 1000); // Converte segundos para timestamp

        let tokenEntry = await this.getLastToken(company);
        if (!tokenEntry) {
            tokenEntry = this.tokenRepository.create({
                company, // 🔹 Adicionando a empresa corretamente!
            });
        }

        tokenEntry.access_token = accessToken;
        tokenEntry.refresh_token = refreshToken;
        tokenEntry.expires_at = expiresAt;
        tokenEntry.company = company;

        await this.tokenRepository.save(tokenEntry);
    }

    async deleteToken(): Promise<void> {
        await this.tokenRepository.delete({});
    }
}
