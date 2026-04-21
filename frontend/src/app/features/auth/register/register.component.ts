import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RegisterRequest, UserRole } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['CLIENTE' as UserRole, Validators.required]
  });

  loading = false;
  error = '';
  successMessage = '';
  hidePassword = true;
  readonly roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'CLIENTE', label: 'Cliente', description: 'Registro directo para clientes del sistema.' },
    { value: 'ARTESANO', label: 'Artesano', description: 'Requiere aprobacion del administrador antes de iniciar sesion.' }
  ];

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const requestedRole = params.get('role') as UserRole | null;
      const isValidRole = this.roleOptions.some(option => option.value === requestedRole);

      if (requestedRole && isValidRole) {
        this.form.patchValue({ role: requestedRole });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const payload = this.form.getRawValue() as RegisterRequest;
    this.auth.register(payload).subscribe({
      next: user => {
        this.loading = false;

        if (user.role === 'ARTESANO' && user.approvalStatus === 'PENDING') {
          this.successMessage = 'Solicitud de artesano enviada. Un administrador debe aprobarla antes de que puedas iniciar sesion.';
          this.form.reset({
            username: '',
            password: '',
            role: 'CLIENTE'
          });
          return;
        }

        this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Error al registrar. El usuario puede ya existir.';
        this.loading = false;
      }
    });
  }
}
