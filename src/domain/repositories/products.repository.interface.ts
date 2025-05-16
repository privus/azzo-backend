import { Produto } from '../../infrastructure/database/entities';
import { ProdutoAPIResponse } from '../../modules/products/dto/products.dto';

export interface IProductsRepository {
  syncroProducts(): Promise<ProdutoAPIResponse[]>;
  findAllProducts(): Promise<Produto[]>;
  findProductById(id: number): Promise<Produto>;
  findBy(param: Partial<Produto>): Promise<Produto | null>;
  updateTinyCodes(id: number, updateTinyDto: { tiny_mg: number; tiny_sp: number }): Promise<void>;
  incrementStock(produto_id: number, quantidade: number): Promise<void>;
}
