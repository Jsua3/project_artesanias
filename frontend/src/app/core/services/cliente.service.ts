import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente, ClienteRequest } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly API = `${environment.apiUrl}/api/clientes`;
  private http = inject(HttpClient);

  private _clientes = signal<Cliente[]>([]);
  private _loading = signal(false);

  readonly clientes = this._clientes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly clienteCount = computed(() => this._clientes().length);

  /** Mapa id → nombre para resolver IDs en otros componentes */
  readonly clienteMap = computed(() => {
    const map = new Map<string, string>();
    for (const c of this._clientes()) {
      map.set(c.id, c.nombre);
    }
    return map;
  });

  loadAll(): void {
    this._loading.set(true);
    this.http.get<Cliente[]>(this.API).subscribe({
      next: data => {
        this._clientes.set(data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  getAll(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.API);
  }

  getById(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.API}/${id}`);
  }

  create(req: ClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.API, req).pipe(
      tap(() => this.loadAll())
    );
  }

  update(id: string, req: ClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.API}/${id}`, req).pipe(
      tap(() => this.loadAll())
    );
  }
}
