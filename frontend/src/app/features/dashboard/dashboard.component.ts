import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { StockService } from '../../core/services/stock.service';
import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private stockService = inject(StockService);
  private reportService = inject(ReportService);
  auth = inject(AuthService);

  loading = signal(true);

  stats = { products: 0, categories: 0, stockItems: 0, lowStock: 0 };

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Cantidad en Stock', backgroundColor: '#3f51b5' }]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  ngOnInit(): void {
    const requests: any = {
      products: this.productService.getAll().pipe(catchError(() => of([]))),
      categories: this.categoryService.getAll().pipe(catchError(() => of([]))),
      stock: this.stockService.getAllStock().pipe(catchError(() => of([])))
    };

    if (this.auth.isAdmin()) {
      requests['alerts'] = this.reportService.getAlerts(5).pipe(catchError(() => of([])));
    }

    forkJoin(requests).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res: any) => {
        this.stats.products = res.products.length;
        this.stats.categories = res.categories.length;
        this.stats.stockItems = res.stock.length;
        this.stats.lowStock = res.alerts?.length ?? 0;

        const top10 = [...res.stock]
          .sort((a: any, b: any) => b.quantity - a.quantity)
          .slice(0, 10);

        this.barChartData = {
          labels: top10.map((s: any) => s.productId.substring(0, 8) + '...'),
          datasets: [{
            data: top10.map((s: any) => s.quantity),
            label: 'Stock',
            backgroundColor: '#3f51b5'
          }]
        };
      }
    });
  }
}
