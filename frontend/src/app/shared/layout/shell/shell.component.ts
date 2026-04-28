import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/auth.model';
import { ProfileDialogComponent } from './profile-dialog.component';
import { ThemeService } from '../../../core/services/theme.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatDividerModule, MatDialogModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private dialog = inject(MatDialog);
  isMobile = signal(window.innerWidth < 992);
  sidenavOpen = signal(window.innerWidth >= 992);

  private readonly navSections: NavSection[] = [
    {
      title: '',
      items: [
        { label: 'Panel Principal', icon: 'dashboard', route: '/dashboard' }
      ]
    },
    {
      title: 'Mi Taller',
      items: [
        { label: 'Maestros Artesanos', icon: 'person_pin', route: '/artesanos', roles: ['ADMIN'] },
        { label: 'Tipos de Artesanía', icon: 'category', route: '/categories', roles: ['ADMIN'] },
        { label: 'Mis Piezas', icon: 'palette', route: '/products', roles: ['ADMIN', 'ARTESANO'] }
      ]
    },
    {
      title: 'Comercio',
      items: [
        { label: 'Compradores', icon: 'people', route: '/clientes', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Pedidos', icon: 'receipt_long', route: '/pedidos', roles: ['ADMIN', 'ARTESANO', 'DOMICILIARIO'] },
        { label: 'Mis Ventas', icon: 'point_of_sale', route: '/ventas', roles: ['ADMIN', 'ARTESANO'] }
      ]
    },
    {
      title: 'Entregas',
      items: [
        { label: 'Mi Panel de Entregas', icon: 'delivery_dining', route: '/domiciliario/panel', roles: ['ADMIN', 'DOMICILIARIO'] },
        { label: 'Seguimiento de Entregas', icon: 'local_shipping', route: '/entregas', roles: ['ADMIN', 'DOMICILIARIO'] }
      ]
    },
    {
      title: 'Bodega',
      items: [
        { label: 'Existencias', icon: 'warehouse', route: '/stock', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Recibir Mercancía', icon: 'add_circle_outline', route: '/inventory/entries', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Registrar Salida', icon: 'remove_circle_outline', route: '/inventory/exits', roles: ['ADMIN', 'ARTESANO'] }
      ]
    },
    {
      title: 'Comunidad',
      items: [
        { label: 'Red de Artesanos', icon: 'groups', route: '/artesano/comunidad', roles: ['ARTESANO', 'ADMIN'] },
        { label: 'Ferias y Eventos', icon: 'event', route: '/artesano/eventos', roles: ['ARTESANO', 'ADMIN'] }
      ]
    },
    {
      title: 'Administración',
      items: [
        { label: 'Movimientos', icon: 'swap_horiz', route: '/movimientos', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Informes', icon: 'assessment', route: '/reports', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Usuarios del Sistema', icon: 'manage_accounts', route: '/admin/usuarios', roles: ['ADMIN'] },
        { label: 'Solicitudes de Registro', icon: 'verified_user', route: '/admin/aprobaciones', roles: ['ADMIN'] },
        { label: 'Moderación', icon: 'shield', route: '/admin/moderacion', roles: ['ADMIN'] },
        { label: 'Base de Datos', icon: 'storage', route: '/admin/database', roles: ['ADMIN'] }
      ]
    }
  ];

  readonly visibleSections = computed(() =>
    this.navSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => !item.roles || this.auth.hasAnyRole(...item.roles))
      }))
      .filter(section => section.items.length > 0)
  );

  readonly roleLabel = computed(() => {
    switch (this.auth.currentUser()?.role) {
      case 'ADMIN':        return 'Administrador';
      case 'ARTESANO':     return 'Artesano';
      case 'OPERATOR':     return 'Artesano';
      case 'CLIENTE':      return 'Cliente';
      case 'DOMICILIARIO': return this.auth.currentUser()?.courierCompany
        ? `Domiciliario · ${this.auth.currentUser()?.courierCompany}`
        : 'Domiciliario';
      default:             return this.auth.currentUser()?.role ?? '';
    }
  });

  @HostListener('window:resize')
  onResize() {
    const mobile = window.innerWidth < 992;
    this.isMobile.set(mobile);
    if (!mobile) this.sidenavOpen.set(true);
  }

  toggleSidenav() { this.sidenavOpen.update(v => !v); }

  closeMobileSidenav() {
    if (this.isMobile()) this.sidenavOpen.set(false);
  }

  openProfileDialog() {
    this.dialog.open(ProfileDialogComponent, { width: '440px', maxWidth: '95vw' });
  }
}
