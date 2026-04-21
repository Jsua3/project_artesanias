import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { ArtesanoService } from '../../../core/services/artesano.service';
import { Product, ProductRequest } from '../../../core/models/product.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, ImageUploadComponent
  ],
  templateUrl: './product-form.component.html',
  styles: [`
    .form-row {
      display: flex;
      gap: 12px;

      mat-form-field { flex: 1; }
    }

    .sku-readonly {
      font-size: 0.85rem;
      color: var(--text-light, #7A7370);
      margin: 0 0 8px;

      code {
        background: rgba(166, 124, 82, 0.08);
        padding: 2px 8px;
        border-radius: 4px;
      }
    }

    .full-width { width: 100%; }

    @media (max-width: 480px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private artesanoService = inject(ArtesanoService);
  private dialogRef = inject(MatDialogRef<ProductFormComponent>);
  private snackBar = inject(MatSnackBar);
  data: Product | null = inject(MAT_DIALOG_DATA);

  readonly categories = this.categoryService.categories;
  readonly artesanos = this.artesanoService.artesanos;
  loading = signal(false);
  imageSignal = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [5, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required],
    artesanoId: ['']
  });

  ngOnInit(): void {
    this.categoryService.loadAll();
    this.artesanoService.loadAll();

    if (this.data) {
      this.form.patchValue({
        name: this.data.name,
        description: this.data.description ?? '',
        price: this.data.price,
        stockMinimo: this.data.stockMinimo ?? 5,
        categoryId: this.data.categoryId,
        artesanoId: this.data.artesanoId ?? ''
      });
      if (this.data.imageUrl) {
        this.imageSignal.set(this.data.imageUrl);
      }
    }
  }

  onImageChange(dataUrl: string | null): void {
    this.imageSignal.set(dataUrl);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      if (!this.categories().length) {
        this.snackBar.open('No hay categorias disponibles para asociar la artesania.', 'OK', { duration: 3500 });
      } else {
        this.snackBar.open('Completa los campos obligatorios antes de guardar.', 'OK', { duration: 3000 });
      }
      return;
    }

    this.loading.set(true);

    const req: ProductRequest = {
      name: this.form.value.name!,
      sku: this.data ? this.data.sku : undefined,
      description: this.form.value.description || undefined,
      price: this.form.value.price!,
      imageUrl: this.imageSignal() || undefined,
      stockMinimo: this.form.value.stockMinimo ?? 5,
      categoryId: this.form.value.categoryId!,
      artesanoId: this.form.value.artesanoId || undefined
    };

    const op = this.data
      ? this.productService.update(this.data.id, req)
      : this.productService.create(req);

    op.subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.loading.set(false);
        this.snackBar.open(error?.error?.message || 'No fue posible guardar la artesania.', 'OK', { duration: 3500 });
      }
    });
  }
}
