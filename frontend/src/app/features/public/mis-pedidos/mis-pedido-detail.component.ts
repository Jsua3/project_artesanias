import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteVentaService } from '../../../core/services/cliente-venta.service';
import { Venta, VentaEstado } from '../../../core/models/venta.model';

@Component({
  selector: 'app-mis-pedido-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, DatePipe,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './mis-pedido-detail.component.html',
  styleUrl: './mis-pedidos.component.scss'
})
export class MisPedidoDetailComponent {
  private route = inject(ActivatedRoute);
  private ventas = inject(ClienteVentaService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pedido = signal<Venta | null>(null);

  readonly isPendiente = computed(() => this.pedido()?.estado === 'PENDIENTE');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.error.set('Pedido inválido.');
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.ventas.byId(id).subscribe({
      next: venta => {
        this.pedido.set(venta);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        if (err.status === 403) {
          this.error.set('Este pedido no es tuyo.');
        } else if (err.status === 404) {
          this.error.set('No encontramos este pedido.');
        } else {
          this.error.set('No pudimos cargar el pedido.');
        }
      }
    });
  }

  formatPrice(n: number): string {
    return '$ ' + (n ?? 0).toLocaleString('es-CO');
  }

  badgeClass(estado: VentaEstado | undefined): string {
    switch (estado) {
      case 'PENDIENTE':  return 'badge badge--pending';
      case 'PAGADA':     return 'badge badge--paid';
      case 'COMPLETADA': return 'badge badge--done';
      case 'ANULADA':    return 'badge badge--void';
      default:           return 'badge';
    }
  }

  badgeLabel(estado: VentaEstado | undefined): string {
    switch (estado) {
      case 'PENDIENTE':  return 'Pendiente';
      case 'PAGADA':     return 'Pagada';
      case 'COMPLETADA': return 'Completada';
      case 'ANULADA':    return 'Anulada';
      default:           return estado ?? '';
    }
  }
}
