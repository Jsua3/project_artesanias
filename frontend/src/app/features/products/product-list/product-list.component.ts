import { Component, OnInit, inject, computed } from '@angular/core';
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

  /** Map artesanoId → Artesano name */
  readonly artesanoMap = computed(() => {
    const map = new Map<string, string>();
    this.artesanoService.artesanos().forEach(a => map.set(a.id, a.nombre));
    return map;
  });

  /** Map productId → stock quantity */
  readonly stockMap = computed(() => {
    const map = new Map<string, number>();
    this.stockService.stock().forEach(s => map.set(s.productId, s.quantity));
    return map;
  });

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
    this.productService.loadAll();
    this.categoryService.loadAll();
    this.artesanoService.loadAll();
    this.stockService.loadAll();
  }

  openForm(product?: Product): void {
    const ref = this.dialog.open(ProductFormComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: product ?? null
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.productService.loadAll();
    });
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar esta artesanía?')) return;
    this.productService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Artesanía eliminada', 'OK', { duration: 3000 });
        this.productService.loadAll();
      },
      error: () => this.snackBar.open('Error al eliminar', 'OK', { duration: 3000 })
    });
  }
}
