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
        { value: this.productService.productCount(), label: 'Publicadas', icon: 'palette', tone: 'terracotta' },
        { value: this.reportService.alerts().length, label: 'Stock bajo', icon: 'warning_amber', tone: 'danger' },
        { value: this.topSoldProducts().length, label: 'Con ventas', icon: 'trending_up', tone: 'sage' },
        { value: this.recentVentas().length, label: 'Ventas recientes', icon: 'receipt_long', tone: 'mauve' }
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

  recentVentas = computed(() =>
    this.ventaService.ventas()
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  );

  lowStockProducts = computed(() => {
    const stockById = new Map(this.stockService.stock().map(s => [s.productId, s.quantity]));
    return this.productService.products()
      .map(product => ({ name: product.name, stock: stockById.get(product.id) ?? 0, min: product.stockMinimo ?? 5 }))
      .filter(item => item.stock <= item.min)
      .slice(0, 4);
  });

  productSalesRows = computed(() => {
    const sales = new Map<string, number>();
    this.ventaService.ventas().forEach(venta => {
      venta.detalles?.forEach(detalle => {
        sales.set(detalle.productId, (sales.get(detalle.productId) ?? 0) + detalle.cantidad);
      });
    });

    return this.productService.products()
      .map(product => ({
        id: product.id,
        name: product.name,
        sold: sales.get(product.id) ?? 0
      }));
  });

  topSoldProducts = computed(() =>
    this.productSalesRows()
      .filter(item => item.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 4)
  );

  slowSoldProducts = computed(() =>
    this.productSalesRows()
      .sort((a, b) => a.sold - b.sold)
      .slice(0, 4)
  );

  profileCompletion = computed(() => {
    const user = this.auth.currentUser();
    if (typeof user?.profileCompletion === 'number') {
      return user.profileCompletion;
    }
    const checks = [
      !!user?.displayName,
      !!user?.avatarUrl,
      !!user?.username,
      !!user?.bio,
      !!user?.locality,
      !!user?.craftType,
      user?.approvalStatus === 'APPROVED'
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  profileNote = computed(() => {
    const user = this.auth.currentUser();
    if (user?.profileComplete) {
      return 'Perfil completo. Tu catálogo ya tiene una ficha sólida para compradores.';
    }
    return 'Completa foto, bio, localidad y oficio para desbloquear una ficha más confiable.';
  });

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
    if (this.auth.canAccessOperations()) {
      this.ventaService.loadAll();
    }
    if (this.isAdmin()) {
      this.ventaService.loadDeliveries();
    }
  }

  formatPrice(n: number): string {
    return '$ ' + (n ?? 0).toLocaleString('es-CO');
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
