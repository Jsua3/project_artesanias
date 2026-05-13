/** Respuesta de /api/products (público, GET). */
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  categoryIds?: string[];
  artesanoId?: string | null;
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
  especialidad?: string | null;
  ubicacion?: string | null;
  imageUrl?: string | null;
}

/** Respuesta de /api/stock/{productId}. */
export interface Stock {
  productId: string;
  quantity: number;
}
