export type VentaEstado = 'PENDIENTE' | 'PAGADA' | 'COMPLETADA' | 'ANULADA';

export interface DeliveryTracking {
  assignedCourierId?: string | null;
  packed: boolean;
  pickedUp: boolean;
  onTheWay: boolean;
  delivered: boolean;
  progress: number;
  stage: 'PENDIENTE' | 'EMPACADO' | 'RECOGIDO' | 'EN_RUTA' | 'ENTREGADO';
  updatedAt?: string | null;
}

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
  estado: VentaEstado;
  createdAt: string;
  delivery: DeliveryTracking;
  detalles: VentaDetalle[];
}

export interface VentaItemRequest {
  productId: string;
  cantidad: number;
}

export interface ClienteVentaRequest {
  items: VentaItemRequest[];
  displayName?: string;
}

export interface VentaRequest {
  clienteId: string;
  items: VentaItemRequest[];
}

export interface DeliveryTrackingUpdateRequest {
  packed: boolean;
  pickedUp: boolean;
  onTheWay: boolean;
  delivered: boolean;
}
