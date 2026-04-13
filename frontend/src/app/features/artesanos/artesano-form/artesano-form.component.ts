import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ArtesanoService } from '../../../core/services/artesano.service';
import { Artesano, ArtesanoRequest } from '../../../core/models/artesano.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-artesano-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressSpinnerModule,
    ImageUploadComponent
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} Artesano</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <app-image-upload
          [currentImage]="imageSignal"
          placeholder="Foto del artesano"
          alt="Artesano"
          [maxWidth]="400"
          [maxHeight]="400"
          (imageChange)="onImageChange($event)">
        </app-image-upload>

        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Especialidad</mat-label>
          <input matInput formControlName="especialidad" placeholder="Ej: Tejido, Cerámica, Madera..." />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Ubicación</mat-label>
          <input matInput formControlName="ubicacion" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid || loading()" (click)="submit()">
        @if (loading()) { <mat-spinner diameter="20" /> } @else { Guardar }
      </button>
    </mat-dialog-actions>
  `
})
export class ArtesanoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private artesanoService = inject(ArtesanoService);
  private dialogRef = inject(MatDialogRef<ArtesanoFormComponent>);
  data: Artesano | null = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  imageSignal = signal<string | null>(null);

  form = this.fb.group({
    nombre: ['', Validators.required],
    especialidad: [''],
    telefono: [''],
    email: [''],
    ubicacion: ['']
  });

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        nombre: this.data.nombre,
        especialidad: this.data.especialidad ?? '',
        telefono: this.data.telefono ?? '',
        email: this.data.email ?? '',
        ubicacion: this.data.ubicacion ?? ''
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
    if (this.form.invalid) return;
    this.loading.set(true);

    const req: ArtesanoRequest = {
      nombre: this.form.value.nombre!,
      especialidad: this.form.value.especialidad || undefined,
      telefono: this.form.value.telefono || undefined,
      email: this.form.value.email || undefined,
      ubicacion: this.form.value.ubicacion || undefined,
      imageUrl: this.imageSignal() || undefined
    };

    const op = this.data
      ? this.artesanoService.update(this.data.id, req)
      : this.artesanoService.create(req);

    op.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.loading.set(false)
    });
  }
}
