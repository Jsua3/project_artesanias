import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressSpinnerModule,
    ImageUploadComponent
  ],
  template: `
    <h2 mat-dialog-title>Mi Perfil</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div style="display: flex; justify-content: center;">
          <div style="width: 160px;">
            <app-image-upload
              [currentImage]="avatarSignal"
              placeholder="Tu foto"
              alt="Avatar"
              [maxWidth]="300"
              [maxHeight]="300"
              [quality]="0.7"
              (imageChange)="onAvatarChange($event)">
            </app-image-upload>
          </div>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Nombre para mostrar</mat-label>
          <input matInput formControlName="displayName"
                 [placeholder]="auth.currentUser()?.username ?? ''" />
        </mat-form-field>

        <div class="profile-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="firstName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="lastName" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Telefono</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Localidad</mat-label>
            <input matInput formControlName="locality" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Tipo de artesania</mat-label>
          <input matInput formControlName="craftType" placeholder="Ej: cesteria, ceramica, tejido" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Direccion</mat-label>
          <textarea matInput formControlName="address" rows="2"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Bio</mat-label>
          <textarea matInput formControlName="bio" rows="3" placeholder="Cuenta brevemente tu oficio, territorio o taller"></textarea>
        </mat-form-field>

        <p class="profile-info">
          <strong>Usuario:</strong> {{ auth.currentUser()?.username }}<br>
          <strong>Rol:</strong> {{ auth.currentUser()?.role }}
        </p>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="loading()" (click)="save()">
        @if (loading()) { <mat-spinner diameter="18" /> } @else { Guardar }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .profile-info {
      font-size: 0.85rem;
      color: var(--text-light, #7A7370);
      margin: 0;
      line-height: 1.8;
    }
    .dialog-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: min(560px, 82vw);
    }
    .profile-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0 12px;
    }
    @media (max-width: 560px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfileDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  auth = inject(AuthService);
  private dialogRef = inject(MatDialogRef<ProfileDialogComponent>);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  avatarSignal = signal<string | null>(null);

  form = this.fb.group({
    displayName: [''],
    firstName: [''],
    lastName: [''],
    phone: [''],
    locality: [''],
    craftType: [''],
    address: [''],
    bio: ['']
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        displayName: user.displayName ?? '',
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phone: user.phone ?? '',
        locality: user.locality ?? '',
        craftType: user.craftType ?? '',
        address: user.address ?? '',
        bio: user.bio ?? ''
      });
      if (user.avatarUrl) {
        this.avatarSignal.set(user.avatarUrl);
      }
    }
  }

  onAvatarChange(dataUrl: string | null): void {
    this.avatarSignal.set(dataUrl);
  }

  save(): void {
    this.loading.set(true);
    this.auth.updateProfile({
      displayName: this.form.value.displayName || undefined,
      avatarUrl: this.avatarSignal() || undefined,
      firstName: this.form.value.firstName || undefined,
      lastName: this.form.value.lastName || undefined,
      phone: this.form.value.phone || undefined,
      locality: this.form.value.locality || undefined,
      craftType: this.form.value.craftType || undefined,
      address: this.form.value.address || undefined,
      bio: this.form.value.bio || undefined
    }).subscribe({
      next: () => {
        this.snackBar.open('Perfil actualizado', 'OK', { duration: 3000 });
        this.dialogRef.close();
      },
      error: () => {
        this.snackBar.open('Error al actualizar perfil', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }
}
