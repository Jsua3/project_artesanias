import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StockService } from '../../../core/services/stock.service';
import { ProductService } from '../../../core/services/product.service';
import { EntryRequest } from '../../../core/models/stock.model';

@Component({
  selector: 'app-entry-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './entry-form.component.html',
  styleUrl: './entry-form.component.scss'
})
export class EntryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private stockService = inject(StockService);
  private productService = inject(ProductService);
  private snackBar = inject(MatSnackBar);

  // Signal derivado del servicio
  readonly products = this.productService.products;
  loading = signal(false);

  form = this.fb.group({
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  ngOnInit(): void {
    this.productService.loadAll();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const request: EntryRequest = {
      productId: this.form.value.productId!,
      quantity: this.form.value.quantity!,
      notes: this.form.value.notes ?? undefined
    };

    this.stockService.createEntry(request).subscribe({
      next: () => {
        this.snackBar.open('Entrada registrada correctamente', 'OK', { duration: 3000 });
        this.form.reset({ quantity: 1 });
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Error al registrar la entrada', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }
}
