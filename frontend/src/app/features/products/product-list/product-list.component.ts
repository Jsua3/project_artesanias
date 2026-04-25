import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { ArtesanoService } from '../../../core/services/artesano.service';
import { StockService } from '../../../core/services/stock.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private artesanoService = inject(ArtesanoService);
  private stockService = inject(StockService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  readonly products = this.productService.products;
  readonly loading = this.productService.loading;
  readonly categoryMap = this.categoryService.categoryMap;
  readonly canManageProducts = computed(() => this.auth.canManageProducts());
  readonly selectedFilter = signal<'todos' | 'publicados' | 'stock-bajo' | 'sin-stock'>('todos');

  readonly artesanoMap = computed(() => {
    const map = new Map<string, string>();
    this.artesanoService.artesanos().forEach(a => map.set(a.id, a.nombre));
    return map;
  });

  readonly stockMap = computed(() => {
    const map = new Map<string, number>();
    this.stockService.stock().forEach(s => map.set(s.productId, s.quantity));
    return map;
  });

  readonly filteredProducts = computed(() => {
    const filter = this.selectedFilter();
    return this.products().filter(product => {
      const stock = this.getStockQty(product.id);
      if (filter === 'publicados') return product.active;
      if (filter === 'stock-bajo') return stock > 0 && this.isLowStock(product.id, product.stockMinimo);
      if (filter === 'sin-stock') return stock === 0;
      return true;
    });
  });

  readonly lowStockCount = computed(() =>
    this.products().filter(product => this.getStockQty(product.id) > 0 && this.isLowStock(product.id, product.stockMinimo)).length
  );

  readonly noStockCount = computed(() =>
    this.products().filter(product => this.getStockQty(product.id) === 0).length
  );

  setFilter(filter: 'todos' | 'publicados' | 'stock-bajo' | 'sin-stock'): void {
    this.selectedFilter.set(filter);
  }

  getCategoryName(categoryId: string): string {
    return this.categoryMap().get(categoryId) ?? 'Sin categoría';
  }

  getArtesanoName(artesanoId?: string): string {
    if (!artesanoId) return 'Artesano desconocido';
    return this.artesanoMap().get(artesanoId) ?? 'Artesano desconocido';
  }

  getStockQty(productId: string): number {
    return this.stockMap().get(productId) ?? 0;
  }

  isLowStock(productId: string, stockMinimo?: number): boolean {
    const qty = this.getStockQty(productId);
    return qty <= (stockMinimo ?? 5);
  }

  ngOnInit(): void {
    this.loadProducts();
    this.categoryService.loadAll();
    this.artesanoService.loadAll();
    this.stockService.loadAll();
  }

  openForm(product?: Product): void {
    if (!this.canManageProducts()) return;

    const ref = this.dialog.open(ProductFormComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: product ?? null
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.loadProducts();
    });
  }

  delete(id: string): void {
    if (!this.canManageProducts()) return;
    if (!confirm('¿Eliminar esta artesanía?')) return;

    this.productService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Artesanía eliminada', 'OK', { duration: 3000 });
        this.loadProducts();
      },
      error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
    });
  }

  toggleStatus(product: Product): void {
    if (!this.canManageProducts()) return;
    const nextState = !product.active;
    this.productService.updateStatus(product.id, nextState).subscribe({
      next: () => {
        this.snackBar.open(nextState ? 'Artesania publicada' : 'Artesania ocultada', 'OK', { duration: 2500 });
        this.loadProducts();
      },
      error: () => this.snackBar.open('No se pudo actualizar el estado', 'OK', { duration: 3000 })
    });
  }

  private loadProducts(): void {
    if (this.canManageProducts()) {
      this.productService.loadForManagement();
      return;
    }
    this.productService.loadAll();
  }
}
