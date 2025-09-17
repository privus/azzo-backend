import { BlingTokens } from '../../infrastructure/database/entities';

export interface IBlingTokenRepository {
    getLastToken(company: string): Promise<BlingTokens | null>;
    saveToken(accessToken: string, refreshToken: string, expiresIn: number, uf: string): Promise<void>;
    deleteToken(): Promise<void>;
}