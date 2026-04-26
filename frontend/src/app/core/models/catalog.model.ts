/** Respuesta de /api/products (público, GET). */
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  imageUrl?: string | null;
  stockMinimo?: number | null;
  categoryId?: string | null;
  artesanoId?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Respuesta de /api/categories (público, GET). */
export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
}

/** Respuesta de /api/artesanos (público, GET). */
export interface Artesano {
  id: string;
  nombre: string;
  telefono?: string | null;
  email?: string | null;
  especialidad?: string | null;
  ubicacion?: string | null;
  imageUrl?: string | null;
  active?: boolean;
  createdAt?: string;
}

/** Respuesta de /api/stock/{productId}. */
export interface Stock {
  productId: string;
  quantity: number;
}
