import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovementLog, StockSnapshot } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly API = `${environment.apiUrl}/api/reports`;
  private http = inject(HttpClient);

  // Estado reactivo
  private _summary = signal<StockSnapshot[]>([]);
  private _history = signal<MovementLog[]>([]);
  private _alerts = signal<StockSnapshot[]>([]);
  private _loading = signal(false);

  // Signals de solo lectura
  readonly summary = this._summary.asReadonly();
  readonly history = this._history.asReadonly();
  readonly alerts = this._alerts.asReadonly();
  readonly loading = this._loading.asReadonly();

  /** Carga todos los datos de reportes de una sola vez */
  loadAll(alertThreshold = 5): void {
    this._loading.set(true);
    forkJoin({
      summary: this.getSummary().pipe(catchError(() => of([]))),
      history: this.getHistory().pipe(catchError(() => of([]))),
      alerts: this.getAlerts(alertThreshold).pipe(catchError(() => of([])))
    }).subscribe({
      next: res => {
        this._summary.set(res.summary);
        this._history.set(res.history);
        this._alerts.set(res.alerts);
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  getSummary(): Observable<StockSnapshot[]> {
    return this.http.get<StockSnapshot[]>(`${this.API}/summary`);
  }

  getHistory(): Observable<MovementLog[]> {
    return this.http.get<MovementLog[]>(`${this.API}/history`);
  }

  getAlerts(threshold = 5): Observable<StockSnapshot[]> {
    return this.http.get<StockSnapshot[]>(`${this.API}/alerts?threshold=${threshold}`);
  }
}
