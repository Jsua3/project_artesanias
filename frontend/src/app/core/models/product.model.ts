export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  categoryId: string;
}

export interface ProductRequest {
  name: string;
  sku?: string;
  price: number;
  categoryId: string;
}
