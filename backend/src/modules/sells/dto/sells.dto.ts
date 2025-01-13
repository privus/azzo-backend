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
  amount_final: number;
  amount_final_discount: string;
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
  store: {
    id: number;
    erp_id: number;
  };
  products: Product[];
  status: {
    name: string;
  };
  company: {
    id: number;
  };
}
