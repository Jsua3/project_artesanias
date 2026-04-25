import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Product, ProductRequest } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API = `${environment.apiUrl}/api/products`;
  private http = inject(HttpClient);

  // Estado reactivo
  private _products = signal<Product[]>([]);
  private _loading = signal(false);

  // Signals de solo lectura
  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly productCount = computed(() => this._products().length);

  /** Mapa id → nombre para resolver IDs en otros componentes */
  readonly productMap = computed(() => {
    const map = new Map<string, string>();
    for (const p of this._products()) {
      map.set(p.id, p.name);
    }
    return map;
  });

  loadAll(): void {
    this._loading.set(true);
    this.http.get<Product[]>(this.API).pipe(
      timeout(3000),
      catchError(() => of([]))
    ).subscribe({
      next: data => {
        this._products.set(data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  loadForManagement(): void {
    this._loading.set(true);
    this.http.get<Product[]>(`${this.API}/admin/all`).pipe(
      timeout(3000),
      catchError(() => of([]))
    ).subscribe({
      next: data => {
        this._products.set(data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.API);
  }

  getAllForManagement(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API}/admin/all`);
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API}/${id}`);
  }

  create(req: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.API, req).pipe(
      tap(() => this.loadAll())
    );
  }

  update(id: string, req: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.API}/${id}`, req).pipe(
      tap(() => this.loadAll())
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`).pipe(
      tap(() => this.loadAll())
    );
  }

  updateStatus(id: string, active: boolean): Observable<Product> {
    return this.http.patch<Product>(`${this.API}/${id}/active`, { active }).pipe(
      tap(() => this.loadForManagement())
    );
  }
}
