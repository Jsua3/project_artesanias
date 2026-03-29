import { Component, OnInit, inject, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { ProductFormComponent } from '../product-form/product-form.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    MatTableModule, MatButtonModule,
    MatIconModule, MatCardModule, MatProgressSpinnerModule
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  displayedColumns = ['name', 'sku', 'price', 'category', 'actions'];

  // Signals derivados de los servicios
  readonly products = this.productService.products;
  readonly loading = this.productService.loading;
  readonly categoryMap = this.categoryService.categoryMap;

  /** Resuelve un categoryId a su nombre */
  getCategoryName(categoryId: string): string {
    return this.categoryMap().get(categoryId) ?? 'Sin categoría';
  }

  ngOnInit(): void {
    this.productService.loadAll();
    this.categoryService.loadAll();
  }

  openForm(product?: Product): void {
    const ref = this.dialog.open(ProductFormComponent, {
      width: '480px',
      data: product ?? null
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.productService.loadAll();
    });
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productService.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Producto eliminado', 'OK', { duration: 3000 });
        this.productService.loadAll();
      },
      error: () => this.snackBar.open('Error al eliminar el producto', 'OK', { duration: 3000 })
    });
  }
}
