export interface ProdutoAPIResponse {
  id: number;
  code: string;
  erp_id: string;
  name: string;
  average_weight: number;
  price: {
    default: number;
  };
  price_cost: number;
  ean: string;
  ncm: string;
  is_active: number;
  category: {
    id: number;
    name: string;
  };
  catalog: {
    image: string | null;
  };
  created_at: Date;
  updated_at: Date;
  description: {
    html: string;
  };
}
