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
import { AuthService } from '../../../core/services/auth.service';
import { Product, ProductDraft, ProductFormData, ProductRequest } from '../../../core/models/product.model';
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
  auth = inject(AuthService);
  private dialogRef = inject(MatDialogRef<ProductFormComponent>);
  private snackBar = inject(MatSnackBar);
  rawData: Product | ProductFormData | null = inject(MAT_DIALOG_DATA);
  product = this.resolveProduct(this.rawData);
  draft = this.resolveDraft(this.rawData);

  readonly categories = this.categoryService.categories;
  readonly artesanos = this.artesanoService.artesanos;
  loading = signal(false);
  imageSignal = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stockMinimo: [5, [Validators.required, Validators.min(0)]],
    categoryIds: [[] as string[], Validators.required],
    artesanoId: ['']
  });

  ngOnInit(): void {
    this.categoryService.loadAll();
    if (this.auth.isAdmin()) {
      this.artesanoService.loadAll();
    }

    if (this.product) {
      const existingCategoryIds = this.product.categoryIds?.length
        ? this.product.categoryIds
        : (this.product.categoryId ? [this.product.categoryId] : []);
      this.form.patchValue({
        name: this.product.name,
        description: this.product.description ?? '',
        price: this.product.price,
        stockMinimo: this.product.stockMinimo ?? 5,
        categoryIds: existingCategoryIds,
        artesanoId: this.product.artesanoId ?? ''
      });
      if (this.product.imageUrl) {
        this.imageSignal.set(this.product.imageUrl);
      }
      return;
    }

    if (this.draft) {
      this.form.patchValue({
        name: this.draft.name,
        description: this.draft.description ?? '',
        price: this.draft.price,
        stockMinimo: this.draft.stockMinimo ?? 1,
        categoryIds: this.draft.categoryIds ?? [],
        artesanoId: this.draft.artesanoId ?? ''
      });
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
      } else if (!this.form.value.categoryIds?.length) {
        this.snackBar.open('Selecciona al menos una categoría.', 'OK', { duration: 3000 });
      } else {
        this.snackBar.open('Completa los campos obligatorios antes de guardar.', 'OK', { duration: 3000 });
      }
      return;
    }

    this.loading.set(true);

    const selectedCategoryIds = (this.form.value.categoryIds ?? []) as string[];
    const req: ProductRequest = {
      name: this.form.value.name!,
      sku: this.product ? this.product.sku : undefined,
      description: this.form.value.description || undefined,
      price: this.form.value.price!,
      imageUrl: this.imageSignal() || undefined,
      stockMinimo: this.form.value.stockMinimo ?? 5,
      categoryIds: selectedCategoryIds,
      categoryId: selectedCategoryIds[0] || undefined,
      artesanoId: this.auth.isAdmin() ? this.form.value.artesanoId || undefined : undefined
    };

    const op = this.product
      ? this.productService.update(this.product.id, req)
      : this.productService.create(req);

    op.subscribe({
      next: () => this.dialogRef.close(true),
      error: (error) => {
        this.loading.set(false);
        this.snackBar.open(error?.error?.message || 'No fue posible guardar la artesania.', 'OK', { duration: 3500 });
      }
    });
  }

  private resolveProduct(data: Product | ProductFormData | null): Product | null {
    if (!data) return null;
    if (this.isProductFormData(data)) return data.product ?? null;
    return data;
  }

  private resolveDraft(data: Product | ProductFormData | null): ProductDraft | null {
    if (!data || !this.isProductFormData(data)) return null;
    return data.draft ?? null;
  }

  private isProductFormData(data: Product | ProductFormData): data is ProductFormData {
    return 'product' in data || 'draft' in data;
  }
}
