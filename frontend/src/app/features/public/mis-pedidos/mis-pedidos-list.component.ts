import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteVentaService } from '../../../core/services/cliente-venta.service';
import { Venta, VentaEstado } from '../../../core/models/venta.model';

@Component({
  selector: 'app-mis-pedidos-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, DatePipe,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './mis-pedidos-list.component.html',
  styleUrl: './mis-pedidos.component.scss'
})
export class MisPedidosListComponent {
  private ventas = inject(ClienteVentaService);

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
}
