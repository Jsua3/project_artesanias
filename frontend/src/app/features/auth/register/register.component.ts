import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { CourierMode, RegisterRequest, UserRole } from '../../../core/models/auth.model';
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
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['CLIENTE' as UserRole, Validators.required],
    courierMode: ['INDEPENDIENTE' as CourierMode],
    courierCompanySelection: [''],
    courierCompanyOther: ['']
  });

  loading = false;
  error = '';
  successMessage = '';
  hidePassword = true;
  readonly roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'CLIENTE', label: 'Cliente', description: 'Registro directo para clientes del sistema.' },
    { value: 'ARTESANO', label: 'Artesano', description: 'Requiere aprobacion del administrador antes de iniciar sesion.' },
    { value: 'DOMICILIARIO', label: 'Domiciliario', description: 'Registro para domiciliarios.' }
  ];
  readonly courierModeOptions: { value: CourierMode; label: string; description: string }[] = [
    { value: 'INDEPENDIENTE', label: 'Independiente', description: 'Trabaja como persona natural dentro de la plataforma.' },
    { value: 'EMPRESA', label: 'Empresa', description: 'Pertenece a alguna de nuestras empresas asociadas.' }
  ];
  readonly courierCompanyOptions = [
    'UPS',
    'Servientrega',
    'FeedEx',
    'Inter Rapidisimo',
    'Coordinadora',
    'OTRA'
  ];

  constructor() {
    this.route.queryParamMap.subscribe(params => {
      const requestedRole = params.get('role') as UserRole | null;
      const isValidRole = this.roleOptions.some(option => option.value === requestedRole);

      if (requestedRole && isValidRole) {
        this.form.patchValue({ role: requestedRole });
      }
    });

    this.form.controls.role.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncCourierValidators());

    this.form.controls.courierMode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncCourierValidators());

    this.form.controls.courierCompanySelection.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.syncCourierValidators());

    this.syncCourierValidators();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const payload: RegisterRequest = {
      username: this.form.controls.username.value ?? '',
      password: this.form.controls.password.value ?? '',
      role: this.form.controls.role.value as UserRole,
      courierMode: this.isCourierRole() ? (this.form.controls.courierMode.value as CourierMode) : null,
      courierCompany: this.resolveCourierCompany()
    };

    this.auth.register(payload).subscribe({
      next: user => {
        this.loading = false;

        if ((user.role === 'ARTESANO' || user.role === 'DOMICILIARIO') && user.approvalStatus === 'PENDING') {
          const roleLabel = user.role === 'DOMICILIARIO' ? 'domiciliario' : 'artesano';
          this.successMessage = `Solicitud de ${roleLabel} enviada. Un administrador debe aprobarla antes de que puedas iniciar sesion.`;
          this.form.reset({
            username: '',
            password: '',
            role: 'CLIENTE',
            courierMode: 'INDEPENDIENTE',
            courierCompanySelection: '',
            courierCompanyOther: ''
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

  selectedRoleDescription(): string {
    return this.roleOptions.find(option => option.value === this.form.controls.role.value)?.description ?? '';
  }

  selectedCourierModeDescription(): string {
    return this.courierModeOptions.find(option => option.value === this.form.controls.courierMode.value)?.description ?? '';
  }

  isCourierRole(): boolean {
    return this.form.controls.role.value === 'DOMICILIARIO';
  }

  requiresCourierCompany(): boolean {
    return this.isCourierRole() && this.form.controls.courierMode.value === 'EMPRESA';
  }

  isOtherCourierCompanySelected(): boolean {
    return this.requiresCourierCompany() && this.form.controls.courierCompanySelection.value === 'OTRA';
  }

  private resolveCourierCompany(): string | null {
    if (!this.requiresCourierCompany()) {
      return null;
    }

    if (this.isOtherCourierCompanySelected()) {
      return this.form.controls.courierCompanyOther.value?.trim() || null;
    }

    return this.form.controls.courierCompanySelection.value?.trim() || null;
  }

  private syncCourierValidators(): void {
    const courierModeControl = this.form.controls.courierMode;
    const courierCompanySelectionControl = this.form.controls.courierCompanySelection;
    const courierCompanyOtherControl = this.form.controls.courierCompanyOther;

    if (this.isCourierRole()) {
      courierModeControl.setValidators([Validators.required]);
      if (this.requiresCourierCompany()) {
        courierCompanySelectionControl.setValidators([Validators.required]);
        if (this.isOtherCourierCompanySelected()) {
          courierCompanyOtherControl.setValidators([Validators.required, Validators.minLength(2)]);
        } else {
          courierCompanyOtherControl.clearValidators();
          courierCompanyOtherControl.setValue('', { emitEvent: false });
        }
      } else {
        courierCompanySelectionControl.clearValidators();
        courierCompanySelectionControl.setValue('', { emitEvent: false });
        courierCompanyOtherControl.clearValidators();
        courierCompanyOtherControl.setValue('', { emitEvent: false });
      }
    } else {
      courierModeControl.clearValidators();
      courierModeControl.setValue('INDEPENDIENTE', { emitEvent: false });
      courierCompanySelectionControl.clearValidators();
      courierCompanySelectionControl.setValue('', { emitEvent: false });
      courierCompanyOtherControl.clearValidators();
      courierCompanyOtherControl.setValue('', { emitEvent: false });
    }

    courierModeControl.updateValueAndValidity({ emitEvent: false });
    courierCompanySelectionControl.updateValueAndValidity({ emitEvent: false });
    courierCompanyOtherControl.updateValueAndValidity({ emitEvent: false });
  }
}
