import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { VentaService } from '../../core/services/venta.service';
import { AuthService } from '../../core/services/auth.service';
import { Venta, VentaEstado } from '../../core/models/venta.model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe, CurrencyPipe,
    MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatChipsModule
  ],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.scss'
})
export class MovimientosComponent implements OnInit {
  private ventaService = inject(VentaService);
  private authService = inject(AuthService);
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');
  readonly productMap = this.productService.productMap;

  ventas = signal<Venta[]>([]);
  loading = signal(false);

  filterForm = this.fb.group({
    estado: [''],
    fechaDesde: [''],
    fechaHasta: ['']
  });

  readonly estadoOptions: { value: string; label: string }[] = [
    { value: '', label: 'Todos los estados' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'PAGADA', label: 'Pagada' },
    { value: 'COMPLETADA', label: 'Completada' },
    { value: 'ANULADA', label: 'Anulada' }
  ];

  readonly filteredVentas = computed(() => {
    const estado = this.filterForm.value.estado ?? '';
    const desde = this.filterForm.value.fechaDesde ? new Date(this.filterForm.value.fechaDesde) : null;
    const hasta = this.filterForm.value.fechaHasta ? new Date(this.filterForm.value.fechaHasta + 'T23:59:59') : null;

    return this.ventas().filter(v => {
      if (estado && v.estado !== estado) return false;
      if (desde && new Date(v.createdAt) < desde) return false;
      if (hasta && new Date(v.createdAt) > hasta) return false;
      return true;
    });
  });

  readonly totalVentas = computed(() =>
    this.filteredVentas().reduce((acc, v) => acc + (v.total ?? 0), 0)
  );

  readonly ventasPagadas = computed(() =>
    this.filteredVentas().filter(v => v.estado === 'PAGADA' || v.estado === 'COMPLETADA').length
  );

  displayedColumns = ['fecha', 'productos', 'cliente', 'total', 'estado'];

  ngOnInit(): void {
    this.productService.loadForManagement();
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    const source$ = this.isAdmin()
      ? this.ventaService.getAll()
      : this.ventaService.getMaestroMias();

    source$.subscribe({
      next: data => {
        this.ventas.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  limpiarFiltros(): void {
    this.filterForm.reset({ estado: '', fechaDesde: '', fechaHasta: '' });
  }

  getProductosLabel(venta: Venta): string {
    if (!venta.detalles?.length) return '—';
    return venta.detalles
      .map(d => {
        const nombre = this.productMap().get(d.productId) ?? d.productId.substring(0, 8) + '…';
        return `${nombre} ×${d.cantidad}`;
      })
      .join(', ');
  }

  getEstadoClass(estado: VentaEstado): string {
    switch (estado) {
      case 'PAGADA': return 'estado-pagada';
      case 'COMPLETADA': return 'estado-completada';
      case 'ANULADA': return 'estado-anulada';
      default: return 'estado-pendiente';
    }
  }

  exportarExcel(): void {
    const rows = this.filteredVentas();
    if (!rows.length) return;

    const headers = ['ID', 'Fecha', 'Cliente', 'Productos', 'Total (COP)', 'Estado'];
    const data = rows.map(v => [
      v.id,
      new Date(v.createdAt).toLocaleString('es-CO'),
      v.shipping?.recipientName ?? v.clienteName ?? v.clienteId?.substring(0, 8) ?? '—',
      this.getProductosLabel(v),
      v.total ?? 0,
      v.estado
    ]);

    const csvContent = [headers, ...data]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimientos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
