import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Product } from '../../../core/models/product.model';
import { VentaRequest } from '../../../core/models/venta.model';
import { ClienteService } from '../../../core/services/cliente.service';
import { ProductService } from '../../../core/services/product.service';
import { StockService } from '../../../core/services/stock.service';
import { VentaService } from '../../../core/services/venta.service';

@Component({
  selector: 'app-venta-form',
  standalone: true,
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './venta-form.component.html',
  styleUrl: './venta-form.component.scss'
})
export class VentaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private productService = inject(ProductService);
  private stockService = inject(StockService);
  private dialogRef = inject(MatDialogRef<VentaFormComponent>);

  loading = signal(false);

  readonly clientes = this.clienteService.clientes;
  readonly products = this.productService.products;
  readonly stockMap = computed(() => {
    const map = new Map<string, number>();
    this.stockService.stock().forEach(stock => map.set(stock.productId, stock.quantity));
    return map;
  });

  form = this.fb.group({
    clienteId: ['', Validators.required],
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit(): void {
    this.clienteService.loadAll();
    this.productService.loadAll();
    this.stockService.loadAll();
  }

  addProduct(product: Product): void {
    const existingIndex = this.findItemIndex(product.id);

    if (existingIndex >= 0) {
      this.incrementItem(existingIndex, 1);
      return;
    }

    this.items.push(this.fb.group({
      productId: [product.id, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  incrementItem(index: number, delta: number): void {
    const control = this.items.at(index).get('cantidad');
    if (!control) return;

    const next = Math.max(1, Number(control.value ?? 1) + delta);
    control.setValue(next);
    control.markAsDirty();
  }

  isSelected(productId: string): boolean {
    return this.findItemIndex(productId) >= 0;
  }

  selectedProductAt(index: number): Product | undefined {
    const productId = this.productIdAt(index);
    if (!productId) return undefined;

    return this.products().find(product => product.id === productId);
  }

  productIdAt(index: number): string {
    return this.items.at(index).get('productId')?.value ?? '';
  }

  productNameAt(index: number): string {
    return this.selectedProductAt(index)?.name ?? 'Artesania';
  }

  quantityAt(index: number): number {
    return Number(this.items.at(index).get('cantidad')?.value ?? 1);
  }

  itemSubtotal(index: number): number {
    const product = this.selectedProductAt(index);
    return (product?.price ?? 0) * this.quantityAt(index);
  }

  estimatedTotal(): number {
    return this.items.controls.reduce((total, _, index) => total + this.itemSubtotal(index), 0);
  }

  productImage(product: Product): string {
    return product.imageUrl || '/assets/placeholder-vasija.svg';
  }

  getStockQty(productId: string): number | null {
    const stocks = this.stockMap();
    return stocks.has(productId) ? stocks.get(productId)! : null;
  }

  stockLabel(productId: string): string {
    const qty = this.getStockQty(productId);
    return qty === null ? 'Stock por confirmar' : `${qty} uds`;
  }

  isLowStock(product: Product): boolean {
    const qty = this.getStockQty(product.id);
    return qty !== null && qty <= (product.stockMinimo ?? 5);
  }

  handleCardPointer(event: PointerEvent): void {
    const card = event.currentTarget as HTMLElement | null;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const px = x / rect.width;
    const py = y / rect.height;

    card.style.setProperty('--mx', `${x}px`);
    card.style.setProperty('--my', `${y}px`);
    card.style.setProperty('--rx', `${(0.5 - py) * 7}deg`);
    card.style.setProperty('--ry', `${(px - 0.5) * 9}deg`);
  }

  resetCardPointer(event: PointerEvent): void {
    const card = event.currentTarget as HTMLElement | null;
    if (!card) return;

    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  }

  submit(): void {
    if (this.form.invalid || this.items.length === 0) return;
    this.loading.set(true);

    const req: VentaRequest = {
      clienteId: this.form.value.clienteId!,
      items: this.items.value.map((item: { productId: string; cantidad: number }) => ({
        productId: item.productId,
        cantidad: item.cantidad
      }))
    };

    this.ventaService.create(req).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.loading.set(false)
    });
  }

  private findItemIndex(productId: string): number {
    return this.items.controls.findIndex(control => control.get('productId')?.value === productId);
  }
}
