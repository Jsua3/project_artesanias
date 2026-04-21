import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteVentaService } from '../../../core/services/cliente-venta.service';
import { ClienteVentaRequest, VentaItemRequest } from '../../../core/models/venta.model';

/**
 * Página de checkout para el flujo CLIENTE. Hoy sólo confirma el pedido y
 * crea una Venta en estado PENDIENTE (Fase 2a, sin pago). El pago con
 * Stripe Checkout llega en 2b.
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
export class CheckoutComponent {
  cart = inject(CartService);
  auth = inject(AuthService);
  private ventas = inject(ClienteVentaService);
  private router = inject(Router);

  readonly lines = this.cart.lines;
  readonly total = this.cart.total;
  readonly isEmpty = this.cart.isEmpty;
  readonly linesCount = computed(() => this.lines().length);

  readonly submitting = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly isLoggedCliente = computed(
    () => this.auth.isLoggedIn() && this.auth.currentUser()?.role === 'CLIENTE'
  );
  readonly currentDisplayName = computed(
    () => this.auth.currentUser()?.displayName
      || this.auth.currentUser()?.username
      || ''
  );

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

    this.ventas.create(payload).subscribe({
      next: venta => {
        this.cart.clear();
        this.submitting.set(false);
        this.router.navigate(['/mis-pedidos', venta.id]);
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
