export interface Product {
  code: string;
  name: string;
  quantity: string;
  unit_price: string;
  total_price: string;
}

export interface SellsApiResponse {
  code: number;
  region: number;
  amount: number;
  seller_code: string;
  amount_final: number;
  discount_total?: number;
  no_financial?: string;
  obs: string;
  payment_method_text: string;
  payment_term_text: string;
  installment_value: string;
  installment_qty: number;
  order_date: string;
  day: number;
  month: number;
  year: number;
  user: {
    id: number;
    name: string;
  };
  store?: {
    id: number;
    erp_id: number;
  };
  products: Product[];
  status: {
    id: number;
  };
  company: {
    id: number;
  };
  non_adherent_warning?: string;
}
