import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClienteVentaRequest, Venta } from '../models/venta.model';

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
}
