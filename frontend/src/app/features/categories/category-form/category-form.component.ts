import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CategoryService } from '../../../core/services/category.service';
import { Category, CategoryRequest } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar Categoría' : 'Nueva Categoría' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width:100%">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="form.invalid">Guardar</button>
    </mat-dialog-actions>
  `
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private dialogRef = inject(MatDialogRef<CategoryFormComponent>);
  data: Category | null = inject(MAT_DIALOG_DATA);

  form = this.fb.group({ name: ['', Validators.required] });

  ngOnInit(): void {
    if (this.data) this.form.patchValue(this.data);
  }

  submit(): void {
    if (this.form.invalid) return;

    const req: CategoryRequest = {
      name: this.form.value.name!
    };

    const op = this.data
      ? this.categoryService.update(this.data.id, req)
      : this.categoryService.create(req);

    op.subscribe({ next: () => this.dialogRef.close(true) });
  }
}
