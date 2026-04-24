import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChildren, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent implements AfterViewInit, OnDestroy {
  cart = inject(CartService);
  private router = inject(Router);

  readonly lines = this.cart.lines;
  readonly total = this.cart.total;
  readonly isEmpty = this.cart.isEmpty;
  readonly linesCount = computed(() => this.lines().length);

  @ViewChildren('cartItem') itemElements!: QueryList<ElementRef<HTMLElement>>;

  private observer: IntersectionObserver | null = null;

  ngAfterViewInit(): void {
    this.initScrollytelling();
    // Re-observe cuando cambie el número de ítems
    this.itemElements.changes.subscribe(() => this.initScrollytelling());
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private initScrollytelling(): void {
    this.observer?.disconnect();

    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.observer?.unobserve(entry.target); // una sola vez
          }
        });
      },
      { threshold: 0.15 }
    );

    this.itemElements.forEach(ref => {
      ref.nativeElement.classList.remove('is-visible');
      this.observer!.observe(ref.nativeElement);
    });
  }

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
