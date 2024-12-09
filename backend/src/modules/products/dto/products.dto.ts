export interface ProdutoAPIResponse {
  id: number;
  code: number;
  erp_id: string;
  name: string;
  average_weight: number;
  price: {
    default: number;
  };
  price_cost: number;
  ean: number;
  ncm: number;
  maximum_discount: number | null;
  is_active: number;
  category: {
    id: number;
    name: string;
  };
  catalog: {
    image: string | null;
  };
}
