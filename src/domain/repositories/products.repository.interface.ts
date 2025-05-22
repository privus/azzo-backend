import { Produto } from '../../infrastructure/database/entities';

export interface IProductsRepository {
  syncroProducts(): Promise<void>;
  syncroSupplier(): Promise<void>;
  syncroTinyIds(): Promise<void>;
  findAllProducts(): Promise<Produto[]>;
  findProductById(id: number): Promise<Produto>;
  findBy(param: Partial<Produto>): Promise<Produto | null>;
  updateTinyCodes(id: number, updateTinyDto: { tiny_mg: number; tiny_sp: number }): Promise<string>;
  incrementStock(produto_id: number, quantidade: number): Promise<void>;
  findProductByPartialCode(partialCode: string): Promise<Produto[] | undefined>;
  findByEan(ean: number): Promise<Produto[] | null>;
}
