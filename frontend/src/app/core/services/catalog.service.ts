import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, Category, Artesano, Stock } from '../models/catalog.model';

/**
 * Cliente HTTP para el catálogo público. Los GET de /api/products,
 * /api/categories y /api/artesanos se sirven sin JWT desde el gateway,
 * así que esta clase se usa también desde el landing anónimo.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly API = environment.apiUrl;
  private http = inject(HttpClient);

  // Caché ligera compartida por los callers — evita N request en la misma carga
  private products$?: Observable<Product[]>;
  private categories$?: Observable<Category[]>;
  private artesanos$?: Observable<Artesano[]>;

  getProducts(refresh = false): Observable<Product[]> {
    if (refresh || !this.products$) {
      this.products$ = this.http
        .get<Product[]>(`${this.API}/api/products`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.products$;
  }

  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API}/api/products/${id}`);
  }

  getCategories(refresh = false): Observable<Category[]> {
    if (refresh || !this.categories$) {
      this.categories$ = this.http
        .get<Category[]>(`${this.API}/api/categories`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.categories$;
  }

  getArtesanos(refresh = false): Observable<Artesano[]> {
    if (refresh || !this.artesanos$) {
      this.artesanos$ = this.http
        .get<Artesano[]>(`${this.API}/api/artesanos`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.artesanos$;
  }

  /** Stock público para pintar "quedan N" (solo lectura) — ruta protegida actualmente. */
  getStock(productId: string): Observable<Stock> {
    return this.http.get<Stock>(`${this.API}/api/stock/${productId}`);
  }
}
