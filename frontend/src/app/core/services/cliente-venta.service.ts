import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClienteVentaRequest, Venta } from '../models/venta.model';

/** Respuesta del endpoint POST /api/cliente-ventas/{id}/checkout-session. */
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Cliente HTTP para el flujo de compra del marketplace. Todas las rutas
 * requieren JWT con rol CLIENTE (el gateway las gatea en
 * /api/cliente-ventas/**).
 */
@Injectable({ providedIn: 'root' })
export class ClienteVentaService {
  private readonly API = `${environment.apiUrl}/api/cliente-ventas`;
  private http = inject(HttpClient);

  /** Crea una Venta PENDIENTE a partir del carrito actual. */
  create(req: ClienteVentaRequest): Observable<Venta> {
    return this.http.post<Venta>(this.API, req);
  }

  /** Historial del propio cliente. */
  mias(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.API}/mias`);
  }

  /** Detalle de una venta propia (403 si no es tuya). */
  byId(id: string): Observable<Venta> {
    return this.http.get<Venta>(`${this.API}/${id}`);
  }

  /**
   * Fase 2b. Crea una Stripe Checkout Session para una venta PENDIENTE propia
   * y devuelve la URL hosted a la que hay que redirigir al cliente. Posibles
   * respuestas de error:
   *   401/403 → sesión inválida o no es dueño
   *   409 → la venta ya no está PENDIENTE
   *   502 → Stripe rechazó la petición
   *   503 → Stripe no está configurado en el servidor
   */
  createCheckoutSession(ventaId: string): Observable<CheckoutSessionResponse> {
    return this.http.post<CheckoutSessionResponse>(
      `${this.API}/${ventaId}/checkout-session`,
      {}
    );
  }
}
