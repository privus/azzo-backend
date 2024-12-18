export interface CustomerAPIResponse {
  code: number;
  name: string;
  company_name: string;
  doc_type: string;
  doc_number: string;
  reg_number: string;
  address_street: string;
  address_number: string;
  address_more: string;
  address_zipcode: string;
  address_district: string;
  address_city: string;
  email_1: string;
  phone_number_1: string;
  phone_number_2: string;
  is_active: number;
  created_at: Date;
  updated_at: string;
}
