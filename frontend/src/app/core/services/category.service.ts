import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Category, CategoryRequest } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly API = `${environment.apiUrl}/api/categories`;
  private http = inject(HttpClient);

  // Estado reactivo
  private _categories = signal<Category[]>([]);
  private _loading = signal(false);

  // Signals de solo lectura
  readonly categories = this._categories.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly categoryCount = computed(() => this._categories().length);

  /** Mapa id → nombre para resolver IDs en otros componentes */
  readonly categoryMap = computed(() => {
    const map = new Map<string, string>();
    for (const c of this._categories()) {
      map.set(c.id, c.name);
    }
    return map;
  });

  loadAll(): void {
    this._loading.set(true);
    this.http.get<Category[]>(this.API).pipe(
      timeout(3000),
      catchError(() => of([]))
    ).subscribe({
      next: data => {
        this._categories.set(data);
        this._loading.set(false);
      },
      error: () => this._loading.set(false)
    });
  }

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.API);
  }

  create(req: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.API, req).pipe(
      tap(() => this.loadAll())
    );
  }

  update(id: string, req: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.API}/${id}`, req).pipe(
      tap(() => this.loadAll())
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`).pipe(
      tap(() => this.loadAll())
    );
  }
}
