import { UpdateProductDto } from 'src/modules/products/dto/update-product.dto';
import { Produto } from '../../infrastructure/database/entities';

export interface IProductsRepository {
  syncroProducts(): Promise<void>;
  syncroSupplier(): Promise<void>;
  syncroTinyIds(): Promise<void>;
  findAllProducts(): Promise<Produto[]>;
  findProductById(id: number): Promise<Produto>;
  findBy(param: Partial<Produto>): Promise<Produto | null>;
  updateProduct(id: number, data: UpdateProductDto): Promise<string>;
  incrementStock(produto_id: number, quantidade: number): Promise<void>;
  findProductByPartialCode(partialCode: string): Promise<Produto[] | undefined>;
  findByEan(ean: string): Promise<Produto[] | null>;
  decrementStock(produto_id: number, quantidade: number): Promise<void>;
  saveProduct(product: Produto): Promise<Produto>;
  updateStockMinimumFromJson(): Promise<void>;
  activeProducts(product_id: number): Promise<void>;
  findAllUni(fornecedor_id: number): Promise<Produto[]>;
}
