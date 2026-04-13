export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  categoryId: string;
  artesanoId?: string;
  imageUrl?: string;
  stockMinimo?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRequest {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  artesanoId?: string;
  stockMinimo?: number;
}
