import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VentaService } from '../../../core/services/venta.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { ProductService } from '../../../core/services/product.service';
import { VentaRequest } from '../../../core/models/venta.model';

@Component({
  selector: 'app-venta-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>Nueva Venta</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Cliente</mat-label>
          <mat-select formControlName="clienteId">
            @for (c of clientes(); track c.id) {
              <mat-option [value]="c.id">{{ c.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div formArrayName="items">
          @for (item of items.controls; track $index) {
            <div [formGroupName]="$index" class="item-row">
              <mat-form-field appearance="outline" style="flex:2">
                <mat-label>Artesanía</mat-label>
                <mat-select formControlName="productId">
                  @for (p of products(); track p.id) {
                    <mat-option [value]="p.id">{{ p.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" style="flex:1">
                <mat-label>Cantidad</mat-label>
                <input matInput type="number" formControlName="cantidad" min="1" />
              </mat-form-field>
              <button mat-icon-button color="warn" type="button" (click)="removeItem($index)">
                <mat-icon>remove_circle</mat-icon>
              </button>
            </div>
          }
        </div>

        <button mat-stroked-button type="button" (click)="addItem()" style="align-self: flex-start;">
          <mat-icon>add</mat-icon> Agregar artesanía
        </button>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid || items.length === 0 || loading()"
              (click)="submit()">
        @if (loading()) { <mat-spinner diameter="20" /> } @else { Registrar Venta }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .item-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    @media (max-width: 480px) {
      .item-row {
        flex-direction: column;
        align-items: stretch;
        gap: 0;
      }
      .item-row mat-form-field {
        flex: 1 1 auto !important;
      }
      .item-row button {
        align-self: flex-end;
      }
    }
  `]
})
export class VentaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ventaService = inject(VentaService);
  private clienteService = inject(ClienteService);
  private productService = inject(ProductService);
  private dialogRef = inject(MatDialogRef<VentaFormComponent>);

  loading = signal(false);

  readonly clientes = this.clienteService.clientes;
  readonly products = this.productService.products;

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
    this.addItem();
  }

  addItem(): void {
    this.items.push(this.fb.group({
      productId: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid || this.items.length === 0) return;
    this.loading.set(true);

    const req: VentaRequest = {
      clienteId: this.form.value.clienteId!,
      items: this.items.value.map((i: any) => ({
        productId: i.productId,
        cantidad: i.cantidad
      }))
    };

    this.ventaService.create(req).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.loading.set(false)
    });
  }
}
