import { Produto } from '../../infrastructure/database/entities';
import { ProdutoAPIResponse } from '../../modules/products/dto/products.dto';

export interface IProductsRepository {
  syncroProducts(): Promise<ProdutoAPIResponse[]>;
  findAllProducts(): Promise<Produto[]>;
  findProductById(id: number): Promise<Produto>;
}
