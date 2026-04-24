import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Venta } from '../../core/models/venta.model';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { ProductService } from '../../core/services/product.service';
import { ReportService } from '../../core/services/report.service';
import { StockService } from '../../core/services/stock.service';
import { VentaService } from '../../core/services/venta.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    DatePipe,
    RouterLink,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private stockService = inject(StockService);
  private reportService = inject(ReportService);
  private ventaService = inject(VentaService);
  auth = inject(AuthService);

  isAdmin = computed(() => this.auth.isAdmin());
  isArtesano = computed(() => this.auth.isArtesano());
  isDomiciliario = computed(() => this.auth.isDomiciliario());

  loading = computed(() => {
    if (this.isDomiciliario()) {
      return this.ventaService.deliveriesLoading();
    }

    return this.productService.loading() ||
      this.categoryService.loading() ||
      this.stockService.loading() ||
      (this.isAdmin() && this.ventaService.deliveriesLoading());
  });

  stats = computed(() => {
    if (this.isDomiciliario()) {
      const deliveries = this.ventaService.deliveries();
      return [
        { value: deliveries.filter(venta => venta.delivery.progress < 100).length, label: 'Entregas activas', icon: 'local_shipping', tone: 'terracotta' },
        { value: deliveries.filter(venta => venta.delivery.stage === 'EN_RUTA').length, label: 'En ruta', icon: 'route', tone: 'sage' },
        { value: deliveries.filter(venta => venta.delivery.stage === 'ENTREGADO').length, label: 'Entregadas', icon: 'task_alt', tone: 'mauve' }
      ];
    }

    if (this.isAdmin()) {
      const deliveries = this.ventaService.deliveries();
      return [
        { value: this.productService.productCount(), label: 'Artesanias', icon: 'palette', tone: 'terracotta' },
        { value: this.categoryService.categoryCount(), label: 'Categorias', icon: 'category', tone: 'mauve' },
        { value: deliveries.filter(venta => venta.delivery.stage !== 'ENTREGADO').length, label: 'Entregas activas', icon: 'local_shipping', tone: 'sage' },
        { value: this.reportService.alerts().length, label: 'Stock bajo', icon: 'warning_amber', tone: 'danger' }
      ];
    }

    if (this.isArtesano()) {
      return [
        { value: this.productService.productCount(), label: 'Artesanias', icon: 'palette', tone: 'terracotta' },
        { value: this.stockService.stockCount(), label: 'En stock', icon: 'warehouse', tone: 'sage' },
        { value: this.reportService.alerts().length, label: 'Alertas', icon: 'warning_amber', tone: 'danger' }
      ];
    }

    return [
      { value: this.productService.productCount(), label: 'Artesanias', icon: 'palette', tone: 'terracotta' },
      { value: this.categoryService.categoryCount(), label: 'Categorias', icon: 'category', tone: 'mauve' },
      { value: this.stockService.stockCount(), label: 'En stock', icon: 'warehouse', tone: 'sage' },
      { value: this.reportService.alerts().length, label: 'Stock bajo', icon: 'warning_amber', tone: 'danger' }
    ];
  });

  quickLinks = computed(() => {
    if (this.isAdmin()) {
      return [
        { label: 'Artesanos', route: '/artesanos', icon: 'person_pin' },
        { label: 'Categorias', route: '/categories', icon: 'category' },
        { label: 'Artesanias', route: '/products', icon: 'palette' },
        { label: 'Clientes', route: '/clientes', icon: 'people' },
        { label: 'Pedidos', route: '/pedidos', icon: 'receipt_long' },
        { label: 'Ventas', route: '/ventas', icon: 'point_of_sale' },
        { label: 'Entregas', route: '/entregas', icon: 'local_shipping' },
        { label: 'Panel de entregas', route: '/domiciliario/panel', icon: 'delivery_dining' },
        { label: 'Inventario', route: '/stock', icon: 'inventory_2' },
        { label: 'Reportes', route: '/reports', icon: 'assessment' },
        { label: 'Solicitudes', route: '/admin/aprobaciones', icon: 'verified_user' },
        { label: 'Moderacion', route: '/admin/moderacion', icon: 'shield' }
      ];
    }

    if (this.isDomiciliario()) {
      return [
        { label: 'Pedidos', route: '/pedidos', icon: 'receipt_long' },
        { label: 'Gestionar entregas', route: '/entregas', icon: 'local_shipping' }
      ];
    }

    return [
      { label: 'Gestionar artesanias', route: '/products', icon: 'palette' },
      { label: 'Pedidos', route: '/pedidos', icon: 'receipt_long' },
      { label: 'Ventas', route: '/ventas', icon: 'point_of_sale' },
      { label: 'Inventario', route: '/stock', icon: 'inventory_2' },
      { label: 'Reportes', route: '/reports', icon: 'assessment' }
    ];
  });

  recentDeliveries = computed(() =>
    this.ventaService.deliveries()
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  );

  barChartData = computed<ChartData<'bar'>>(() => {
    const top10 = this.stockService.top10ByQuantity();
    const productMap = this.productService.productMap();
    return {
      labels: top10.map(s => productMap.get(s.productId) ?? `${s.productId.substring(0, 8)}...`),
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
    if (this.isDomiciliario()) {
      this.ventaService.loadDeliveries();
      return;
    }

    this.productService.loadAll();
    this.categoryService.loadAll();
    this.stockService.loadAll();
    if (this.auth.canAccessReports()) {
      this.reportService.loadAll();
    }
    if (this.isAdmin()) {
      this.ventaService.loadDeliveries();
    }
  }

  deliveryTitle(venta: Venta): string {
    return `Pedido ${venta.id.slice(0, 8).toUpperCase()}`;
  }

  deliveryStageLabel(stage: Venta['delivery']['stage']): string {
    switch (stage) {
      case 'EMPACADO':
        return 'Pedido empacado';
      case 'RECOGIDO':
        return 'Recogido por domiciliario';
      case 'EN_RUTA':
        return 'En camino al cliente';
      case 'ENTREGADO':
        return 'Entregado al cliente';
      default:
        return 'Pendiente de alistamiento';
    }
  }
}
