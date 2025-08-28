export interface IBlingAuthRepository {
    autoRefreshToken(): Promise<void>;
    getAccessToken(uf: string): Promise<string>;
    refreshAccessToken(refreshToken: string, uf: string): Promise<string>;
}