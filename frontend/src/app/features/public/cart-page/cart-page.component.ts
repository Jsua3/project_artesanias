import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent {
  cart = inject(CartService);
  private router = inject(Router);

  readonly lines = this.cart.lines;
  readonly total = this.cart.total;
  readonly isEmpty = this.cart.isEmpty;
  readonly linesCount = computed(() => this.lines().length);

  formatPrice(n: number): string {
    return '$ ' + n.toLocaleString('es-CO');
  }

  inc(productId: string, currentQty: number): void {
    this.cart.updateQty(productId, currentQty + 1);
  }

  dec(productId: string, currentQty: number): void {
    this.cart.updateQty(productId, currentQty - 1);
  }

  remove(productId: string): void {
    this.cart.remove(productId);
  }

  clear(): void {
    this.cart.clear();
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
