export interface Artesano {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  especialidad?: string;
  ubicacion?: string;
  imageUrl?: string;
  active: boolean;
  createdAt?: string;
}

export interface ArtesanoRequest {
  nombre: string;
  telefono?: string;
  email?: string;
  especialidad?: string;
  ubicacion?: string;
  imageUrl?: string;
}
