import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterClienteRequest } from '../../../core/models/auth.model';
import { LiquidPointerDirective } from '../../../core/directives/liquid-pointer.directive';
import { switchMap } from 'rxjs/operators';

declare const google: any;

@Component({
  selector: 'app-register-cliente',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    LiquidPointerDirective,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './register-cliente.component.html',
  styleUrl: './register-cliente.component.scss'
})
export class RegisterClienteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    username:    ['', [Validators.required, Validators.minLength(3)]],
    password:    ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = false;
  error = '';
  hidePassword = true;

  readonly googleReady = signal(false);
  readonly googleLoading = signal(false);

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
          setTimeout(() => {
            const container = document.getElementById('google-signup-btn');
            if (container) {
              google.accounts.id.renderButton(container, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signup_with',
                shape: 'rectangular',
                width: 380,
                locale: 'es'
              });
            }
          }, 0);
        });
      },
      error: () => {}
    });
  }

  private loadGoogleScript(): Promise<void> {
    return new Promise(resolve => {
      if (typeof google !== 'undefined' && google?.accounts) { resolve(); return; }
      const existing = document.getElementById('google-gsi-script');
      if (existing) { existing.addEventListener('load', () => resolve()); return; }
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
        const next = this.route.snapshot.queryParamMap.get('next') || '/';
        await this.router.navigateByUrl(next);
      },
      error: (err: HttpErrorResponse) => {
        this.googleLoading.set(false);
        this.error = err.error?.message || 'No se pudo continuar con Google. Intenta de nuevo.';
      }
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const req: RegisterClienteRequest = this.form.value as RegisterClienteRequest;
    this.auth.registerCliente(req).pipe(
      switchMap(() => this.auth.login({ username: req.username, password: req.password }))
    ).subscribe({
      next: () => {
        const next = this.route.snapshot.queryParamMap.get('next') || '/';
        this.router.navigateByUrl(next);
      },
      error: (err) => {
        if (err?.status === 409) {
          this.error = 'Ese nombre de usuario ya está en uso.';
        } else {
          this.error = 'No se pudo crear la cuenta. Intenta de nuevo.';
        }
        this.loading = false;
      }
    });
  }
}
