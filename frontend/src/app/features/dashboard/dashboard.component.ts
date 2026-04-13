import { Component, OnInit, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
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

  // Loading derivado de los servicios
  loading = computed(() =>
    this.productService.loading() ||
    this.categoryService.loading() ||
    this.stockService.loading()
  );

  // Stats derivados reactivamente con computed()
  stats = computed(() => ({
    products: this.productService.productCount(),
    categories: this.categoryService.categoryCount(),
    stockItems: this.stockService.stockCount(),
    lowStock: this.reportService.alerts().length
  }));

  // Datos del gráfico derivados con computed()
  barChartData = computed<ChartData<'bar'>>(() => {
    const top10 = this.stockService.top10ByQuantity();
    const productMap = this.productService.productMap();
    return {
      labels: top10.map(s => productMap.get(s.productId) ?? s.productId.substring(0, 8) + '...'),
      datasets: [{
        data: top10.map(s => s.quantity),
        label: 'Stock',
        backgroundColor: '#A67C52',
        borderRadius: 8,
        borderSkipped: false
      }]
    };
  });

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#3A3530',
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Outfit' },
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(166,124,82,0.08)' },
        ticks: { font: { family: 'Outfit', size: 12 }, color: '#7A7370' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Outfit', size: 11 }, color: '#7A7370', maxRotation: 45 }
      }
    }
  };

  ngOnInit(): void {
    this.productService.loadAll();
    this.categoryService.loadAll();
    this.stockService.loadAll();
    if (this.auth.isAdmin()) {
      this.reportService.loadAll();
    }
  }
}
