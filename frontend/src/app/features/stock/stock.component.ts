import { Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { StockService } from '../../core/services/stock.service';
import { StockResponse } from '../../core/models/stock.model';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [MatTableModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss'
})
export class StockComponent implements OnInit {
  private stockService = inject(StockService);

  displayedColumns = ['productId', 'quantity', 'status'];
  stock: StockResponse[] = [];
  loading = signal(true);

  ngOnInit(): void {
    this.stockService.getAllStock().pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: data => this.stock = data
    });
  }

  getStatus(qty: number): { label: string; color: string } {
    if (qty === 0) return { label: 'Sin stock', color: 'warn' };
    if (qty <= 5) return { label: 'Stock bajo', color: 'accent' };
    return { label: 'Disponible', color: 'primary' };
  }
}
