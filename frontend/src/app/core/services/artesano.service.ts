import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Artesano, ArtesanoRequest } from '../models/artesano.model';

@Injectable({ providedIn: 'root' })
export class ArtesanoService {
  private readonly API = `${environment.apiUrl}/api/artesanos`;
  private http = inject(HttpClient);

  private _artesanos = signal<Artesano[]>([]);
  private _loading = signal(false);

  readonly artesanos = this._artesanos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly artesanoCount = computed(() => this._artesanos().length);

  /** Mapa id → nombre para resolver IDs en otros componentes */
  readonly artesanoMap = computed(() => {
    const map = new Map<string, string>();
    for (const a of this._artesanos()) {
      map.set(a.id, a.nombre);
    }
    return map;
  });

  loadAll(): void {
    this._loading.set(true);
    this.http.get<Artesano[]>(this.API).subscribe({
      next: data => {
        this._artesanos.set(data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  getAll(): Observable<Artesano[]> {
    return this.http.get<Artesano[]>(this.API);
  }

  getById(id: string): Observable<Artesano> {
    return this.http.get<Artesano>(`${this.API}/${id}`);
  }

  create(req: ArtesanoRequest): Observable<Artesano> {
    return this.http.post<Artesano>(this.API, req).pipe(
      tap(() => this.loadAll())
    );
  }

  update(id: string, req: ArtesanoRequest): Observable<Artesano> {
    return this.http.put<Artesano>(`${this.API}/${id}`, req).pipe(
      tap(() => this.loadAll())
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`).pipe(
      tap(() => this.loadAll())
    );
  }
}
