import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private stockService = inject(StockService);
  private reportService = inject(ReportService);
  auth = inject(AuthService);

  loading = computed(() =>
    this.productService.loading() ||
    this.categoryService.loading() ||
    this.stockService.loading()
  );

  isArtesano = computed(() => this.auth.isArtesano());

  stats = computed(() => {
    if (this.isArtesano()) {
      return [
        { value: this.productService.productCount(), label: 'Artesanías', icon: 'palette', tone: 'terracotta' },
        { value: this.stockService.stockCount(), label: 'En stock', icon: 'warehouse', tone: 'sage' },
        { value: this.reportService.alerts().length, label: 'Alertas', icon: 'warning_amber', tone: 'danger' }
      ];
    }

    return [
      { value: this.productService.productCount(), label: 'Artesanías', icon: 'palette', tone: 'terracotta' },
      { value: this.categoryService.categoryCount(), label: 'Categorías', icon: 'category', tone: 'mauve' },
      { value: this.stockService.stockCount(), label: 'En stock', icon: 'warehouse', tone: 'sage' },
      { value: this.reportService.alerts().length, label: 'Stock bajo', icon: 'warning_amber', tone: 'danger' }
    ];
  });

  quickLinks = [
    { label: 'Gestionar artesanías', route: '/products', icon: 'palette' },
    { label: 'Ventas', route: '/ventas', icon: 'point_of_sale' },
    { label: 'Inventario', route: '/stock', icon: 'inventory_2' },
    { label: 'Reportes', route: '/reports', icon: 'assessment' }
  ];

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
    if (this.auth.canAccessReports()) {
      this.reportService.loadAll();
    }
  }
}
