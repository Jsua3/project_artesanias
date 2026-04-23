import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeliveryTrackingUpdateRequest, Venta, VentaRequest } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly API = `${environment.apiUrl}/api/ventas`;
  private http = inject(HttpClient);

  private _ventas = signal<Venta[]>([]);
  private _loading = signal(false);
  private _deliveries = signal<Venta[]>([]);
  private _deliveriesLoading = signal(false);

  readonly ventas = this._ventas.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly deliveries = this._deliveries.asReadonly();
  readonly deliveriesLoading = this._deliveriesLoading.asReadonly();

  loadAll(): void {
    this._loading.set(true);
    this.http.get<Venta[]>(this.API).subscribe({
      next: data => {
        this._ventas.set(data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  getAll(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.API);
  }

  getById(id: string): Observable<Venta> {
    return this.http.get<Venta>(`${this.API}/${id}`);
  }

  getByCliente(clienteId: string): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.API}/cliente/${clienteId}`);
  }

  loadDeliveries(): void {
    this._deliveriesLoading.set(true);
    this.http.get<Venta[]>(`${this.API}/entregas`).subscribe({
      next: data => {
        this._deliveries.set(data);
        this._deliveriesLoading.set(false);
      },
      error: () => this._deliveriesLoading.set(false)
    });
  }

  getDeliveries(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.API}/entregas`);
  }

  create(req: VentaRequest): Observable<Venta> {
    return this.http.post<Venta>(this.API, req).pipe(
      tap(() => {
        this.loadAll();
        this.loadDeliveries();
      })
    );
  }

  anular(id: string): Observable<Venta> {
    return this.http.put<Venta>(`${this.API}/${id}/anular`, {}).pipe(
      tap(() => {
        this.loadAll();
        this.loadDeliveries();
      })
    );
  }

  updateDeliveryTracking(id: string, req: DeliveryTrackingUpdateRequest): Observable<Venta> {
    return this.http.patch<Venta>(`${this.API}/${id}/seguimiento`, req).pipe(
      tap(() => {
        this.loadDeliveries();
        this.loadAll();
      })
    );
  }
}
