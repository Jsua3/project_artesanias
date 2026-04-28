import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile, UserRole } from '../../../core/models/auth.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe,
    MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent implements OnInit {
  private authService = inject(AuthService);

  usuarios = signal<UserProfile[]>([]);
  loading = signal(false);

  searchCtrl = new FormControl('');
  rolCtrl = new FormControl('');

  readonly rolOptions: { value: string; label: string }[] = [
    { value: '',            label: 'Todos los roles' },
    { value: 'ADMIN',       label: 'Administrador' },
    { value: 'ARTESANO',    label: 'Artesano' },
    { value: 'DOMICILIARIO',label: 'Domiciliario' },
    { value: 'CLIENTE',     label: 'Cliente' }
  ];

  readonly filtered = computed(() => {
    const q   = (this.searchCtrl.value ?? '').toLowerCase();
    const rol = this.rolCtrl.value ?? '';
    return this.usuarios().filter(u => {
      if (rol && u.role !== rol) return false;
      if (!q) return true;
      return u.username?.toLowerCase().includes(q)
          || u.displayName?.toLowerCase().includes(q)
          || u.locality?.toLowerCase().includes(q)
          || u.craftType?.toLowerCase().includes(q);
    });
  });

  readonly totals = computed(() => ({
    total:        this.usuarios().length,
    admins:       this.usuarios().filter(u => u.role === 'ADMIN').length,
    artesanos:    this.usuarios().filter(u => u.role === 'ARTESANO').length,
    domiciliarios:this.usuarios().filter(u => u.role === 'DOMICILIARIO').length,
    clientes:     this.usuarios().filter(u => u.role === 'CLIENTE').length,
    pendientes:   this.usuarios().filter(u => u.approvalStatus === 'PENDING').length
  }));

  displayedColumns = ['avatar','usuario','rol','estado','perfil','courier','localidad','artesania','fecha'];

  ngOnInit(): void {
    this.cargar();
    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe();
    this.rolCtrl.valueChanges.subscribe();
  }

  cargar(): void {
    this.loading.set(true);
    this.authService.getUsers().subscribe({
      next: data => { this.usuarios.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  rolLabel(role: UserRole): string {
    const map: Record<string, string> = {
      ADMIN: 'Administrador', ARTESANO: 'Artesano',
      DOMICILIARIO: 'Domiciliario', CLIENTE: 'Cliente'
    };
    return map[role] ?? role;
  }

  rolClass(role: UserRole): string {
    const map: Record<string, string> = {
      ADMIN: 'rol-admin', ARTESANO: 'rol-artesano',
      DOMICILIARIO: 'rol-domiciliario', CLIENTE: 'rol-cliente'
    };
    return map[role] ?? '';
  }

  estadoLabel(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'Aprobado', PENDING: 'Pendiente', REJECTED: 'Rechazado'
    };
    return map[status] ?? status;
  }

  estadoClass(status: string): string {
    const map: Record<string, string> = {
      APPROVED: 'estado-aprobado', PENDING: 'estado-pendiente', REJECTED: 'estado-rechazado'
    };
    return map[status] ?? '';
  }

  initials(u: UserProfile): string {
    return (u.displayName || u.username || '?').charAt(0).toUpperCase();
  }
}
