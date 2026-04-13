export interface VentaDetalle {
  id: string;
  productId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  clienteId: string;
  vendedorId: string;
  total: number;
  estado: 'COMPLETADA' | 'ANULADA';
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
