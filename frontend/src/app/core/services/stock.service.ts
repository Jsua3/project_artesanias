import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StockResponse, EntryRequest, ExitRequest } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly BASE = environment.apiUrl;
  private http = inject(HttpClient);

  // Estado reactivo
  private _stock = signal<StockResponse[]>([]);
  private _loading = signal(false);

  // Signals de solo lectura
  readonly stock = this._stock.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly stockCount = computed(() => this._stock().length);

  /** Top 10 productos por cantidad de stock */
  readonly top10ByQuantity = computed(() =>
    [...this._stock()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  );

  /** Cantidad de productos con stock bajo (≤ 5) */
  readonly lowStockCount = computed(() =>
    this._stock().filter(s => s.quantity <= 5).length
  );

  loadAll(): void {
    this._loading.set(true);
    this.http.get<StockResponse[]>(`${this.BASE}/api/stock`).pipe(
      timeout(3000),
      catchError(() => of([]))
    ).subscribe({
      next: data => {
        this._stock.set(data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  getAllStock(): Observable<StockResponse[]> {
    return this.http.get<StockResponse[]>(`${this.BASE}/api/stock`);
  }

  getStockByProduct(productId: string): Observable<StockResponse> {
    return this.http.get<StockResponse>(`${this.BASE}/api/stock/${productId}`);
  }

  createEntry(req: EntryRequest): Observable<StockResponse> {
    return this.http.post<StockResponse>(`${this.BASE}/api/entries`, req).pipe(
      tap(() => this.loadAll())
    );
  }

  createExit(req: ExitRequest): Observable<StockResponse> {
    return this.http.post<StockResponse>(`${this.BASE}/api/exits`, req).pipe(
      tap(() => this.loadAll())
    );
  }
}
