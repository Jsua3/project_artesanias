import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpErrorResponse } from '@angular/common/http';
import { LiquidPointerDirective } from '../../../core/directives/liquid-pointer.directive';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ClienteVentaService } from '../../../core/services/cliente-venta.service';
import { ClienteVentaRequest, VentaItemRequest } from '../../../core/models/venta.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatStepperModule, MatFormFieldModule, MatInputModule,
    LiquidPointerDirective
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
  private fb = inject(FormBuilder);

  readonly lines = this.cart.lines;
  readonly total = this.cart.total;
  readonly isEmpty = this.cart.isEmpty;
  readonly linesCount = computed(() => this.lines().length);

  readonly submitting = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly canceledBanner = signal(false);

  readonly isLoggedCliente = computed(
    () => this.auth.isLoggedIn() && this.auth.currentUser()?.role === 'CLIENTE'
  );
  readonly currentDisplayName = computed(
    () => this.auth.currentUser()?.displayName || this.auth.currentUser()?.username || ''
  );

  shippingForm = this.fb.group({
    recipientName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    recipientPhone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    notes: ['']
  });

  ngOnInit(): void {
    const canceled = this.route.snapshot.queryParamMap.get('canceled');
    if (canceled === '1') this.canceledBanner.set(true);

    const user = this.auth.currentUser();
    if (user) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
        || user.displayName || '';
      this.shippingForm.patchValue({
        recipientName: fullName,
        recipientPhone: user.phone ?? '',
        address: user.address ?? '',
      });
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
    if (this.isEmpty()) { this.errorMsg.set('Tu bolsa está vacía.'); return; }
    if (!this.isLoggedCliente()) { this.goToRegister(); return; }

    this.shippingForm.markAllAsTouched();
    if (this.shippingForm.invalid) { this.errorMsg.set('Completa los datos de envío.'); return; }

    const sv = this.shippingForm.value;
    const items: VentaItemRequest[] = this.cart.snapshot().map(l => ({
      productId: l.productId,
      cantidad: l.qty
    }));
    const payload: ClienteVentaRequest = {
      items,
      displayName: this.auth.currentUser()?.displayName ?? undefined,
      recipientName: sv.recipientName ?? '',
      recipientPhone: sv.recipientPhone ?? '',
      address: sv.address ?? '',
      city: sv.city ?? '',
      notes: sv.notes ?? undefined,
    };

    this.submitting.set(true);
    this.errorMsg.set(null);
    this.canceledBanner.set(false);

    this.ventas.create(payload).subscribe({
      next: venta => {
        this.ventas.createCheckoutSession(venta.id).subscribe({
          next: session => {
            this.cart.clear();
            window.location.href = session.url;
          },
          error: (err: HttpErrorResponse) => {
            this.submitting.set(false);
            if (err.status === 503) {
              this.errorMsg.set('El pago no está disponible ahora. Tu pedido quedó guardado.');
              this.cart.clear();
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
          this.errorMsg.set('Algún producto ya no está disponible. Revisa tu bolsa.');
        } else {
          this.errorMsg.set('No pudimos crear el pedido. Intenta de nuevo en un momento.');
        }
      }
    });
  }
}
