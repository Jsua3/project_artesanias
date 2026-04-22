import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteVentaService } from '../../../core/services/cliente-venta.service';
import { ClienteVentaRequest, VentaItemRequest } from '../../../core/models/venta.model';

/**
 * Página de checkout para el flujo CLIENTE. Crea una Venta en estado
 * PENDIENTE, luego abre una Stripe Checkout Session (Fase 2b) y redirige
 * al cliente a la hosted page.
 */
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  cart = inject(CartService);
  auth = inject(AuthService);
  private ventas = inject(ClienteVentaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly lines = this.cart.lines;
  readonly total = this.cart.total;
  readonly isEmpty = this.cart.isEmpty;
  readonly linesCount = computed(() => this.lines().length);

  readonly submitting = signal(false);
  readonly errorMsg = signal<string | null>(null);
  /** Banner "cancelaste el pago, intenta de nuevo" cuando Stripe nos devuelve ?canceled=1. */
  readonly canceledBanner = signal(false);

  readonly isLoggedCliente = computed(
    () => this.auth.isLoggedIn() && this.auth.currentUser()?.role === 'CLIENTE'
  );
  readonly currentDisplayName = computed(
    () => this.auth.currentUser()?.displayName
      || this.auth.currentUser()?.username
      || ''
  );

  ngOnInit(): void {
    const canceled = this.route.snapshot.queryParamMap.get('canceled');
    if (canceled === '1') {
      this.canceledBanner.set(true);
    }
  }

  formatPrice(n: number): string {
    return '$ ' + n.toLocaleString('es-CO');
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { next: '/checkout' } });
  }

  goToRegister(): void {
    this.router.navigate(['/registro-cliente'], { queryParams: { next: '/checkout' } });
  }

  confirm(): void {
    if (this.submitting()) return;
    if (this.isEmpty()) {
      this.errorMsg.set('Tu bolsa está vacía.');
      return;
    }
    if (!this.isLoggedCliente()) {
      // Doble seguro: el template ya muestra el CTA de login/registro.
      this.goToRegister();
      return;
    }

    const items: VentaItemRequest[] = this.cart.snapshot().map(l => ({
      productId: l.productId,
      cantidad: l.qty
    }));
    const payload: ClienteVentaRequest = {
      items,
      displayName: this.auth.currentUser()?.displayName ?? undefined
    };

    this.submitting.set(true);
    this.errorMsg.set(null);
    this.canceledBanner.set(false);

    // Flujo 2b: crea la venta PENDIENTE, luego crea Checkout Session
    // en Stripe y redirige. El carrito se limpia al salir de la página;
    // si Stripe devuelve ?canceled=1 la venta queda PENDIENTE y el cliente
    // puede reintentar desde /mis-pedidos/:id o aquí con otro carrito.
    this.ventas.create(payload).subscribe({
      next: venta => {
        this.ventas.createCheckoutSession(venta.id).subscribe({
          next: session => {
            // Carrito fuera — el pedido ya existe en el servidor.
            this.cart.clear();
            // Redirección a la página hosted de Stripe.
            window.location.href = session.url;
          },
          error: (err: HttpErrorResponse) => {
            this.submitting.set(false);
            // La venta ya fue creada como PENDIENTE. Podemos mandarlos al
            // detalle para que reintenten el pago luego.
            if (err.status === 503) {
              this.errorMsg.set('El pago no está disponible en este momento. Tu pedido quedó guardado — inténtalo de nuevo más tarde.');
              this.cart.clear();
              this.router.navigate(['/mis-pedidos', venta.id]);
              return;
            }
            if (err.status === 502) {
              this.errorMsg.set('No pudimos conectar con el proveedor de pagos. Intenta de nuevo en un momento.');
              return;
            }
            if (err.status === 409) {
              this.errorMsg.set('Este pedido ya no se puede pagar (estado distinto a pendiente).');
              this.router.navigate(['/mis-pedidos', venta.id]);
              return;
            }
            this.errorMsg.set('No pudimos iniciar el pago. Intenta de nuevo en un momento.');
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        if (err.status === 401 || err.status === 403) {
          this.errorMsg.set('Tu sesión expiró. Inicia sesión de nuevo para confirmar.');
        } else if (err.status === 409) {
          this.errorMsg.set('Algún producto ya no está disponible al precio actual. Revisa tu bolsa.');
        } else if (err.status === 400) {
          this.errorMsg.set('Hay un problema con los productos de tu bolsa.');
        } else {
          this.errorMsg.set('No pudimos crear el pedido. Intenta de nuevo en un momento.');
        }
      }
    });
  }
}
