import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
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
export class MisPedidoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ventas = inject(ClienteVentaService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly pedido = signal<Venta | null>(null);

  readonly isPendiente = computed(() => this.pedido()?.estado === 'PENDIENTE');
  readonly isPagada = computed(() => {
    const e = this.pedido()?.estado;
    return e === 'PAGADA' || e === 'COMPLETADA';
  });

  /** Venimos del success URL de Stripe (?paid=1). */
  readonly cameFromPaid = signal(false);
  /** Reintentar el pago desde el detalle está en curso. */
  readonly retryingPay = signal(false);
  readonly retryError = signal<string | null>(null);

  /**
   * Poll inicial cuando llegamos con ?paid=1 y el webhook todavia no
   * mueve la venta a PAGADA. Reintenta la carga unas cuantas veces
   * con espaciado creciente.
   */
  private pollAttempts = 0;
  private readonly POLL_MAX_ATTEMPTS = 5;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.error.set('Pedido inválido.');
      return;
    }
    this.cameFromPaid.set(this.route.snapshot.queryParamMap.get('paid') === '1');
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.ventas.byId(id).subscribe({
      next: venta => {
        this.pedido.set(venta);
        this.loading.set(false);

        // Si venimos del success URL pero la venta aún es PENDIENTE,
        // el webhook probablemente está en vuelo. Repolleamos unas veces.
        if (this.cameFromPaid()
            && venta.estado === 'PENDIENTE'
            && this.pollAttempts < this.POLL_MAX_ATTEMPTS) {
          this.pollAttempts++;
          const delay = 1500 + this.pollAttempts * 1000;
          setTimeout(() => this.load(id), delay);
        }
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

  /** Reabre una Checkout Session para reintentar un pedido que quedó PENDIENTE. */
  retryPay(): void {
    const p = this.pedido();
    if (!p || this.retryingPay()) return;
    this.retryingPay.set(true);
    this.retryError.set(null);
    this.ventas.createCheckoutSession(p.id).subscribe({
      next: session => {
        window.location.href = session.url;
      },
      error: (err: HttpErrorResponse) => {
        this.retryingPay.set(false);
        if (err.status === 503) {
          this.retryError.set('El pago no está disponible en este momento. Inténtalo más tarde.');
        } else if (err.status === 409) {
          this.retryError.set('Este pedido ya no se puede pagar.');
        } else if (err.status === 502) {
          this.retryError.set('No pudimos conectar con el proveedor de pagos. Intenta de nuevo en un momento.');
        } else {
          this.retryError.set('No pudimos reiniciar el pago. Intenta de nuevo.');
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
