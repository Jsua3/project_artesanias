import { Component, OnInit, inject } from '@angular/core';
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
import { Product } from '../../../core/models/product.model';

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

  products: Product[] = [];
  loading = false;

  form = this.fb.group({
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    notes: ['']
  });

  ngOnInit(): void {
    this.productService.getAll().subscribe(p => this.products = p);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.stockService.createEntry(this.form.value as any).subscribe({
      next: () => {
        this.snackBar.open('Entrada registrada correctamente', 'OK', { duration: 3000 });
        this.form.reset({ quantity: 1 });
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error al registrar la entrada', 'OK', { duration: 3000 });
        this.loading = false;
      }
    });
  }
}
