import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovementLog, StockSnapshot } from '../models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly API = `${environment.apiUrl}/api/reports`;

  constructor(private http: HttpClient) {}

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
