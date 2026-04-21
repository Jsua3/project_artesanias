import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterClienteRequest } from '../../../core/models/auth.model';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-register-cliente',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './register-cliente.component.html',
  styleUrl: './register-cliente.component.scss'
})
export class RegisterClienteComponent {
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

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const req: RegisterClienteRequest = this.form.value as RegisterClienteRequest;
    // Después del registro, iniciamos sesión automáticamente para que el cliente
    // pueda comprar / agregar a la wishlist inmediatamente.
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
