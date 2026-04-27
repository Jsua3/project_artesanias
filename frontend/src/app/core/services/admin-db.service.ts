import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class AdminDbService {
  private readonly BASE = `${environment.apiUrl}/api/admin/db`;
  private http = inject(HttpClient);

  private get<T>(path: string, params: Record<string, string | number>): Observable<PagedResponse<T>> {
    let p = new HttpParams();
    for (const k of Object.keys(params)) {
      const v = params[k];
      if (v !== undefined && v !== null && v !== '') {
        p = p.set(k, String(v));
      }
    }
    return this.http.get<PagedResponse<T>>(`${this.BASE}/${path}`, { params: p });
  }

  listUsers(page = 0, size = 20, search = ''): Observable<PagedResponse<any>> {
    return this.get('users', { page, size, search });
  }

  listArtesanos(page = 0, size = 20, search = ''): Observable<PagedResponse<any>> {
    return this.get('artesanos', { page, size, search });
  }

  listProducts(page = 0, size = 20, artesanoId = ''): Observable<PagedResponse<any>> {
    return this.get('products', { page, size, artesanoId });
  }

  listClientes(page = 0, size = 20, search = ''): Observable<PagedResponse<any>> {
    return this.get('clientes', { page, size, search });
  }

  listVentas(page = 0, size = 20, estado = ''): Observable<PagedResponse<any>> {
    return this.get('ventas', { page, size, estado });
  }

  listPedidos(page = 0, size = 20): Observable<PagedResponse<any>> {
    return this.get('pedidos', { page, size });
  }

  listPosts(page = 0, size = 20, estado = ''): Observable<PagedResponse<any>> {
    return this.get('posts', { page, size, estado });
  }

  listEventos(page = 0, size = 20, estado = ''): Observable<PagedResponse<any>> {
    return this.get('eventos', { page, size, estado });
  }
}
