import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LiquidPointerDirective } from '../../../core/directives/liquid-pointer.directive';
import { ClienteVentaService } from '../../../core/services/cliente-venta.service';
import { Venta, VentaEstado } from '../../../core/models/venta.model';

@Component({
  selector: 'app-mis-pedidos-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, DatePipe,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    LiquidPointerDirective
  ],
  templateUrl: './mis-pedidos-list.component.html',
  styleUrl: './mis-pedidos.component.scss'
})
export class MisPedidosListComponent {
  private ventas = inject(ClienteVentaService);

  readonly trackingSteps = [
    { label: 'Pedido confirmado', value: 10 },
    { label: 'En preparacion', value: 40 },
    { label: 'Listo para recoger', value: 55 },
    { label: 'En camino', value: 85 },
    { label: 'Entregado', value: 100 }
  ];

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pedidos = signal<Venta[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.ventas.mias().subscribe({
      next: data => {
        // Más recientes primero
        const sorted = [...data].sort((a, b) =>
          (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
        );
        this.pedidos.set(sorted);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No pudimos cargar tus pedidos. Intenta de nuevo.');
      }
    });
  }

  formatPrice(n: number): string {
    return '$ ' + (n ?? 0).toLocaleString('es-CO');
  }

  badgeClass(estado: VentaEstado): string {
    switch (estado) {
      case 'PENDIENTE':  return 'badge badge--pending';
      case 'PAGADA':     return 'badge badge--paid';
      case 'COMPLETADA': return 'badge badge--done';
      case 'ANULADA':    return 'badge badge--void';
      default:           return 'badge';
    }
  }

  badgeLabel(estado: VentaEstado): string {
    switch (estado) {
      case 'PENDIENTE':  return 'Pendiente';
      case 'PAGADA':     return 'Pagada';
      case 'COMPLETADA': return 'Completada';
      case 'ANULADA':    return 'Anulada';
      default:           return estado;
    }
  }

  deliveryProgress(pedido: Venta): number {
    if (pedido.estado === 'ANULADA') return 0;
    if (pedido.estado === 'COMPLETADA') return 100;
    if (pedido.delivery?.progress) return pedido.delivery.progress;
    if (pedido.estado === 'PAGADA') return 10;
    return 5;
  }

  trackingLabel(pedido: Venta): string {
    if (pedido.estado === 'ANULADA') return 'Pedido anulado';
    if (pedido.estado === 'PENDIENTE') return 'Pago pendiente';
    switch (pedido.delivery?.stage) {
      case 'EMPACADO':
        return 'En preparacion';
      case 'RECOGIDO':
        return 'Listo para recoger';
      case 'EN_RUTA':
        return 'En camino';
      case 'ENTREGADO':
        return 'Entregado';
      default:
        return 'Pedido confirmado';
    }
  }

  isStepDone(pedido: Venta, value: number): boolean {
    return this.deliveryProgress(pedido) >= value;
  }
}
