import { SellerAPIResponse } from '../../modules/sellers/dto/sellers.dto';
import { Vendedor } from '../../infrastructure/database/entities';

export interface ISellersRepository {
  syncroSellers(): Promise<void>;
  processSeller(seller: SellerAPIResponse): Promise<Vendedor>;
  findBy(id: number): Promise<Vendedor>;
  findAllSellers(): Promise<Vendedor[]>;
}
