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
  private dialog = inject(MatDialog);
  isMobile = signal(window.innerWidth < 992);
  sidenavOpen = signal(window.innerWidth >= 992);

  private readonly navSections: NavSection[] = [
    {
      title: '',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }
      ]
    },
    {
      title: 'Catalogo',
      items: [
        { label: 'Artesanos', icon: 'person_pin', route: '/artesanos', roles: ['ADMIN'] },
        { label: 'Categorias', icon: 'category', route: '/categories', roles: ['ADMIN'] },
        { label: 'Artesanias', icon: 'palette', route: '/products', roles: ['ADMIN', 'ARTESANO'] }
      ]
    },
    {
      title: 'Ventas',
      items: [
        { label: 'Clientes', icon: 'people', route: '/clientes', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Pedidos', icon: 'receipt_long', route: '/pedidos', roles: ['ADMIN', 'ARTESANO', 'DOMICILIARIO'] },
        { label: 'Ventas', icon: 'point_of_sale', route: '/ventas', roles: ['ADMIN', 'ARTESANO'] }
      ]
    },
    {
      title: 'Logistica',
      items: [
        { label: 'Panel de entregas', icon: 'delivery_dining', route: '/domiciliario/panel', roles: ['DOMICILIARIO'] },
        { label: 'Entregas', icon: 'local_shipping', route: '/entregas', roles: ['ADMIN', 'DOMICILIARIO'] }
      ]
    },
    {
      title: 'Inventario',
      items: [
        { label: 'Stock', icon: 'warehouse', route: '/stock', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Entradas', icon: 'add_circle_outline', route: '/inventory/entries', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Salidas', icon: 'remove_circle_outline', route: '/inventory/exits', roles: ['ADMIN', 'ARTESANO'] }
      ]
    },
    {
      title: 'Comunidad',
      items: [
        { label: 'Feed artesanos', icon: 'groups', route: '/artesano/comunidad', roles: ['ARTESANO', 'ADMIN'] },
        { label: 'Eventos y ferias', icon: 'event', route: '/artesano/eventos', roles: ['ARTESANO', 'ADMIN'] }
      ]
    },
    {
      title: 'Admin',
      items: [
        { label: 'Reportes', icon: 'assessment', route: '/reports', roles: ['ADMIN', 'ARTESANO'] },
        { label: 'Solicitudes de acceso', icon: 'verified_user', route: '/admin/aprobaciones', roles: ['ADMIN'] },
        { label: 'Moderación comunidad', icon: 'shield', route: '/admin/moderacion', roles: ['ADMIN'] }
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
      case 'ADMIN':
        return 'Administrador';
      case 'ARTESANO':
        return 'Artesano';
      case 'OPERATOR':
        return 'Artesano';
      case 'CLIENTE':
        return 'Cliente';
      case 'DOMICILIARIO':
        return this.auth.currentUser()?.courierCompany
          ? `Domiciliario - ${this.auth.currentUser()?.courierCompany}`
          : 'Domiciliario';
      default:
        return this.auth.currentUser()?.role ?? '';
    }
  });

  @HostListener('window:resize')
  onResize() {
    const mobile = window.innerWidth < 992;
    this.isMobile.set(mobile);
    if (!mobile) this.sidenavOpen.set(true);
  }

  toggleSidenav() {
    this.sidenavOpen.update(v => !v);
  }

  closeMobileSidenav() {
    if (this.isMobile()) {
      this.sidenavOpen.set(false);
    }
  }

  openProfileDialog() {
    this.dialog.open(ProfileDialogComponent, {
      width: '440px',
      maxWidth: '95vw'
    });
  }
}
