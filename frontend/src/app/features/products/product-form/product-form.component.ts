import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { Product, ProductRequest } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private dialogRef = inject(MatDialogRef<ProductFormComponent>);
  data: Product | null = inject(MAT_DIALOG_DATA);

  // Signal derivado del servicio
  readonly categories = this.categoryService.categories;
  loading = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required]
  });

  ngOnInit(): void {
    this.categoryService.loadAll();
    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        price: this.data.price,
        categoryId: this.data.categoryId
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const req: ProductRequest = {
      name: this.form.value.name!,
      sku: this.data ? this.data.sku : undefined,
      price: this.form.value.price!,
      categoryId: this.form.value.categoryId!
    };

    const op = this.data
      ? this.productService.update(this.data.id, req)
      : this.productService.create(req);

    op.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.loading.set(false)
    });
  }
}
