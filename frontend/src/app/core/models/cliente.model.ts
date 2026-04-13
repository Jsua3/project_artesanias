export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  active: boolean;
}

export interface ClienteRequest {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}
