import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserRole } from '../../../core/models/auth.model';
import { LiquidPointerDirective } from '../../../core/directives/liquid-pointer.directive';
import { AuthService } from '../../../core/services/auth.service';

declare const google: any;

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
    MatProgressSpinnerModule,
    LiquidPointerDirective
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
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

  readonly googleReady = signal(false);
  readonly googleLoading = signal(false);

  readonly registerOptions: { role: UserRole; label: string; description: string }[] = [
    { role: 'CLIENTE', label: 'Cliente', description: 'Registro directo para clientes del sistema.' },
    { role: 'ARTESANO', label: 'Artesano', description: 'Requiere aprobacion del administrador antes de iniciar sesion.' },
    { role: 'DOMICILIARIO', label: 'Domiciliario', description: 'Registro para domiciliarios.' }
  ];

  ngOnInit(): void {
    this.initGoogleSignIn();
  }

  private initGoogleSignIn(): void {
    this.auth.getPublicConfig().subscribe({
      next: ({ googleClientId }) => {
        if (!googleClientId) return;
        this.loadGoogleScript().then(() => {
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response: { credential: string }) =>
              this.handleGoogleCredential(response.credential),
            auto_select: false,
            cancel_on_tap_outside: true
          });
          this.googleReady.set(true);
          // Renderiza el botón oficial de Google en el contenedor
          setTimeout(() => {
            const container = document.getElementById('google-signin-btn');
            if (container) {
              google.accounts.id.renderButton(container, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                width: 380,
                locale: 'es'
              });
            }
          }, 0);
        });
      },
      error: () => { /* Google no disponible — no interrumpe el flujo normal */ }
    });
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise(resolve => {
      if (typeof google !== 'undefined' && google?.accounts) {
        resolve();
        return;
      }
      const existing = document.getElementById('google-gsi-script');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        return;
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  private handleGoogleCredential(credential: string): void {
    this.googleLoading.set(true);
    this.error = '';
    this.auth.loginWithGoogle(credential).subscribe({
      next: async () => {
        this.googleLoading.set(false);
        await this.router.navigateByUrl(this.auth.homeRouteForCurrentUser());
      },
      error: (err: HttpErrorResponse) => {
        this.googleLoading.set(false);
        this.error = err.error?.message || 'No se pudo iniciar sesion con Google. Intenta de nuevo.';
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.value as any).subscribe({
      next: async () => {
        try {
          await this.router.navigateByUrl(this.auth.homeRouteForCurrentUser());
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
