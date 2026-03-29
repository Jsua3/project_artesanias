import { Component, OnInit, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { StockService } from '../../core/services/stock.service';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [MatTableModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss'
})
export class StockComponent implements OnInit {
  private stockService = inject(StockService);
  private productService = inject(ProductService);

  displayedColumns = ['product', 'quantity', 'status'];

  // Signals derivados de los servicios
  readonly stock = this.stockService.stock;
  readonly loading = this.stockService.loading;
  readonly productMap = this.productService.productMap;

  ngOnInit(): void {
    this.stockService.loadAll();
    this.productService.loadAll();
  }

  getProductName(productId: string): string {
    return this.productMap().get(productId) ?? productId.substring(0, 8) + '...';
  }

  getStatus(qty: number): { label: string; color: string } {
    if (qty === 0) return { label: 'Sin stock', color: 'warn' };
    if (qty <= 5) return { label: 'Stock bajo', color: 'accent' };
    return { label: 'Disponible', color: 'primary' };
  }
}
