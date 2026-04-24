import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserRole } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';
  hidePassword = true;
  readonly registerOptions: { role: UserRole; label: string; description: string }[] = [
    { role: 'CLIENTE', label: 'Cliente', description: 'Registro directo para clientes del sistema.' },
    { role: 'ARTESANO', label: 'Artesano', description: 'Requiere aprobacion del administrador antes de iniciar sesion.' },
    { role: 'DOMICILIARIO', label: 'Domiciliario', description: 'Registro para domiciliarios.' }
  ];

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.value as any).subscribe({
      next: async () => {
        try {
          // CLIENTEs van a la tienda pública; el resto al panel de gestión
          const destination = this.auth.isCliente() ? '/' : '/dashboard';
          await this.router.navigate([destination]);
        } catch {
          this.error = 'Inicio de sesion correcto, pero no se pudo abrir el panel.';
        } finally {
          this.loading = false;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || 'Usuario o contrasena incorrectos';
        this.loading = false;
      }
    });
  }
}
