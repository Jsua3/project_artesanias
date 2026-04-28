export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  categoryId: string;      // categoría primaria (compatibilidad)
  categoryIds?: string[];  // todas las categorías
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
  categoryId?: string;     // legacy
  categoryIds?: string[];  // múltiples categorías
  artesanoId?: string;
  stockMinimo?: number;
}
