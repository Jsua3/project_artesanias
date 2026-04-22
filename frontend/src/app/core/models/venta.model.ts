export interface VentaDetalle {
  id: string;
  productId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/** Estados que puede tener una venta (Fase 2a agrega PENDIENTE + PAGADA). */
export type VentaEstado = 'PENDIENTE' | 'PAGADA' | 'COMPLETADA' | 'ANULADA';

export interface Venta {
  id: string;
  clienteId: string;
  vendedorId: string;
  total: number;
  estado: VentaEstado;
  createdAt: string;
  detalles: VentaDetalle[];
}

export interface VentaItemRequest {
  productId: string;
  cantidad: number;
}

export interface VentaRequest {
  clienteId: string;
  items: VentaItemRequest[];
}

/** Payload que envia el CLIENTE al checkout (no lleva clienteId ni precios). */
export interface ClienteVentaRequest {
  items: VentaItemRequest[];
  displayName?: string;
}
