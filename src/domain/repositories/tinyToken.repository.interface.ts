import { TinyTokens } from '../../infrastructure/database/entities';

export interface ITinyTokenRepository {
    getLastToken(uf: string): Promise<TinyTokens | null>;
    saveToken(accessToken: string, refreshToken: string, expiresIn: number, uf: string): Promise<void>;
    deleteToken(): Promise<void>;
}