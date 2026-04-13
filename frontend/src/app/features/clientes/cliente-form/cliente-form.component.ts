import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteService } from '../../../core/services/cliente.service';
import { Cliente, ClienteRequest } from '../../../core/models/cliente.model';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} Cliente</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
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
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="direccion" />
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
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clienteService = inject(ClienteService);
  private dialogRef = inject(MatDialogRef<ClienteFormComponent>);
  data: Cliente | null = inject(MAT_DIALOG_DATA);

  loading = signal(false);

  form = this.fb.group({
    nombre: ['', Validators.required],
    telefono: [''],
    email: [''],
    direccion: ['']
  });

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        nombre: this.data.nombre,
        telefono: this.data.telefono ?? '',
        email: this.data.email ?? '',
        direccion: this.data.direccion ?? ''
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const req: ClienteRequest = {
      nombre: this.form.value.nombre!,
      telefono: this.form.value.telefono || undefined,
      email: this.form.value.email || undefined,
      direccion: this.form.value.direccion || undefined
    };

    const op = this.data
      ? this.clienteService.update(this.data.id, req)
      : this.clienteService.create(req);

    op.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.loading.set(false)
    });
  }
}
