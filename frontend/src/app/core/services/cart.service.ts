import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models/catalog.model';

/** Item persistido en localStorage — guardamos lo mínimo y el snapshot visual. */
export interface CartLine {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  qty: number;
}

const STORAGE_KEY = 'cart_v1';

/**
 * Carrito en memoria basado en signals, con persistencia a localStorage.
 * El carrito es puramente cliente; el precio final lo re-valida el backend
 * al crear la Venta (VentaService.createClienteVenta).
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _lines = signal<CartLine[]>(this.loadFromStorage());

  /** Lectura-solo del estado del carrito. */
  readonly lines = this._lines.asReadonly();
  readonly count = computed(() => this._lines().reduce((a, l) => a + l.qty, 0));
  readonly total = computed(() =>
    this._lines().reduce((a, l) => a + l.price * l.qty, 0)
  );
  readonly isEmpty = computed(() => this._lines().length === 0);

  add(product: Product, qty = 1): void {
    if (!product || !product.id) return;
    const existing = this._lines().find(l => l.productId === product.id);
    if (existing) {
      this._lines.update(ls =>
        ls.map(l =>
          l.productId === product.id ? { ...l, qty: l.qty + qty } : l
        )
      );
    } else {
      this._lines.update(ls => [
        ...ls,
        {
          productId: product.id,
          name: product.name,
          price: product.price ?? 0,
          imageUrl: product.imageUrl ?? null,
          qty,
        },
      ]);
    }
    this.persist();
  }

  updateQty(productId: string, qty: number): void {
    if (qty <= 0) {
      this.remove(productId);
      return;
    }
    this._lines.update(ls =>
      ls.map(l => (l.productId === productId ? { ...l, qty } : l))
    );
    this.persist();
  }

  remove(productId: string): void {
    this._lines.update(ls => ls.filter(l => l.productId !== productId));
    this.persist();
  }

  clear(): void {
    this._lines.set([]);
    this.persist();
  }

  /** Snapshot inmutable para enviar al backend. */
  snapshot(): CartLine[] {
    return this._lines();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._lines()));
    } catch {
      /* ignore quota errors */
    }
  }

  private loadFromStorage(): CartLine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartLine[];
      return Array.isArray(parsed)
        ? parsed.filter(
            l => l && typeof l.productId === 'string' && typeof l.qty === 'number'
          )
        : [];
    } catch {
      return [];
    }
  }
}
