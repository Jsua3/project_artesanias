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
    displayName: ['']
  });

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        displayName: user.displayName ?? ''
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
      avatarUrl: this.avatarSignal() || undefined
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
