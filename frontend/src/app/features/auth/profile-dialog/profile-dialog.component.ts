import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { ProfileStatus } from '../../../core/models/profile-status.model';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="profile-dialog-header">
      <h2 mat-dialog-title>Mi Perfil</h2>
      <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    @if (profileStatus() && !profileStatus()!.profileComplete) {
      <div class="modal-warning-banner">
        <mat-icon>error</mat-icon>
        Debes llenar todos los campos para acceder a las funcionalidades del sistema.
      </div>
    }

    <mat-dialog-content>
      <form [formGroup]="form" class="profile-form-grid">
        <!-- Avatar -->
        <div class="avatar-section">
          <div class="avatar-wrap" (click)="triggerFileInput()">
            @if (avatarPreview()) {
              <img [src]="avatarPreview()" alt="Avatar" class="avatar-img">
            } @else {
              <mat-icon class="avatar-placeholder">person</mat-icon>
            }
            <div class="avatar-overlay"><mat-icon>photo_camera</mat-icon></div>
          </div>
          <input #fileInput type="file" accept="image/*" style="display:none"
                 (change)="onFileChange($event)">
          <p class="avatar-hint">Haz click para cambiar foto</p>
        </div>

        <!-- Campos principales -->
        <div class="form-fields">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre <span class="required">*</span></mat-label>
              <input matInput formControlName="firstName" placeholder="Tu nombre">
              @if (form.controls['firstName'].invalid && form.controls['firstName'].touched) {
                <mat-error>Campo requerido</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Apellido <span class="required">*</span></mat-label>
              <input matInput formControlName="lastName" placeholder="Tu apellido">
              @if (form.controls['lastName'].invalid && form.controls['lastName'].touched) {
                <mat-error>Campo requerido</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Nombre visible <span class="required">*</span></mat-label>
            <input matInput formControlName="displayName">
            @if (form.controls['displayName'].invalid && form.controls['displayName'].touched) {
              <mat-error>Campo requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Teléfono (10 dígitos) <span class="required">*</span></mat-label>
            <input matInput formControlName="phone" type="tel" maxlength="10"
                   placeholder="3001234567">
            <mat-hint align="end">{{ form.controls['phone'].value?.length || 0 }}/10</mat-hint>
            @if (form.controls['phone'].errors?.['required'] && form.controls['phone'].touched) {
              <mat-error>Campo requerido</mat-error>
            }
            @if (form.controls['phone'].errors?.['pattern'] && form.controls['phone'].touched) {
              <mat-error>El teléfono debe tener exactamente 10 dígitos numéricos</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Localidad / Municipio <span class="required">*</span></mat-label>
            <input matInput formControlName="locality">
            @if (form.controls['locality'].invalid && form.controls['locality'].touched) {
              <mat-error>Campo requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Dirección <span class="required">*</span></mat-label>
            <input matInput formControlName="address">
            @if (form.controls['address'].invalid && form.controls['address'].touched) {
              <mat-error>Campo requerido</mat-error>
            }
          </mat-form-field>

          @if (isArtesano()) {
            <mat-form-field appearance="outline">
              <mat-label>Especialidad / Oficio <span class="required">*</span></mat-label>
              <input matInput formControlName="craftType">
              @if (form.controls['craftType'].invalid && form.controls['craftType'].touched) {
                <mat-error>Campo requerido</mat-error>
              }
            </mat-form-field>
          }

          <mat-form-field appearance="outline">
            <mat-label>Biografía</mat-label>
            <textarea matInput formControlName="bio" rows="3"></textarea>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
        {{ saving() ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .profile-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px 0;
    }
    .modal-warning-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #d32f2f;
      color: #fff;
      padding: 12px 24px;
      font-size: 0.9rem;
      font-weight: 500;
      mat-icon { font-size: 20px; }
    }
    .profile-form-grid {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 24px;
      @media (max-width: 720px) { grid-template-columns: 1fr; }
    }
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 8px;
    }
    .avatar-wrap {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      background: #f5f0eb;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #c89b6e;
      &:hover .avatar-overlay { opacity: 1; }
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .avatar-placeholder { font-size: 64px; color: #c89b6e; }
    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity .2s;
      mat-icon { color: #fff; font-size: 32px; }
    }
    .avatar-hint { font-size: 0.75rem; color: #888; margin-top: 8px; text-align: center; }
    .form-fields { display: flex; flex-direction: column; gap: 4px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .required { color: #d32f2f; }
    mat-form-field { width: 100%; }
  `]
})
export class ProfileDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ProfileDialogComponent>);

  profileStatus = signal<ProfileStatus | null>(null);
  saving = signal(false);
  avatarPreview = signal<string | null>(null);
  private avatarBase64: string | null = null;

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    displayName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    locality: ['', Validators.required],
    address: ['', Validators.required],
    craftType: [''],
    bio: [''],
  });

  isArtesano(): boolean {
    return this.auth.currentUser()?.role === 'ARTESANO';
  }

  ngOnInit(): void {
    if (this.isArtesano()) {
      this.form.controls['craftType'].setValidators(Validators.required);
      this.form.controls['craftType'].updateValueAndValidity();
    }

    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        displayName: user.displayName ?? '',
        phone: user.phone ?? '',
        locality: user.locality ?? '',
        address: user.address ?? '',
        craftType: user.craftType ?? '',
        bio: user.bio ?? '',
      });
      if (user.avatarUrl) {
        this.avatarPreview.set(user.avatarUrl);
      }
    }

    this.profileService.getProfileStatus().subscribe({
      next: s => this.profileStatus.set(s),
      error: () => {}
    });
  }

  triggerFileInput(): void {
    document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
  }

  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.avatarPreview.set(result);
      this.avatarBase64 = result;
    };
    reader.readAsDataURL(file);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    const payload: any = { ...this.form.value };
    if (this.avatarBase64) {
      payload['avatarUrl'] = this.avatarBase64;
    }

    this.auth.updateProfile(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Perfil actualizado correctamente', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message ?? 'Error al guardar el perfil';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      }
    });
  }
}
