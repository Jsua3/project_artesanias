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
  updatedBy?: string | null;
  packedAt?: string | null;
  pickedUpAt?: string | null;
  onTheWayAt?: string | null;
  deliveredAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  evidenceUrl?: string | null;
  notes?: string | null;
}

export interface VentaDetalle {
  id: string;
  productId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ShippingInfo {
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface CourierCard {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string;
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
  shipping?: ShippingInfo | null;
  courier?: CourierCard | null;
  clienteName?: string | null;
}

export interface VentaItemRequest {
  productId: string;
  cantidad: number;
}

export interface ClienteVentaRequest {
  items: VentaItemRequest[];
  displayName?: string;
  recipientName?: string;
  recipientPhone?: string;
  address?: string;
  city?: string;
  notes?: string;
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
  evidenceUrl?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
