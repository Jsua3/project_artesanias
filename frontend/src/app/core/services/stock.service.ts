import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockResponse, EntryRequest, ExitRequest } from '../models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly BASE = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllStock(): Observable<StockResponse[]> {
    return this.http.get<StockResponse[]>(`${this.BASE}/api/stock`);
  }

  getStockByProduct(productId: string): Observable<StockResponse> {
    return this.http.get<StockResponse>(`${this.BASE}/api/stock/${productId}`);
  }

  createEntry(req: EntryRequest): Observable<any> {
    return this.http.post(`${this.BASE}/api/entries`, req);
  }

  createExit(req: ExitRequest): Observable<any> {
    return this.http.post(`${this.BASE}/api/exits`, req);
  }
}
