import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { notClienteGuard } from './core/guards/not-cliente.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './shared/layout/shell/shell.component';

// ---------------------------------------------------------------------------
// Rutas públicas (CLIENTE + visitantes — sin ShellComponent)
// ---------------------------------------------------------------------------
const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/public/public-landing/public-landing.component').then(m => m.PublicLandingComponent)
  },
  {
    path: 'carrito',
    loadComponent: () => import('./features/public/cart-page/cart-page.component').then(m => m.CartPageComponent)
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/public/checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  {
    path: 'mis-pedidos',
    canActivate: [authGuard],
    loadComponent: () => import('./features/public/mis-pedidos/mis-pedidos-list.component').then(m => m.MisPedidosListComponent)
  },
  {
    path: 'mis-pedidos/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/public/mis-pedidos/mis-pedido-detail.component').then(m => m.MisPedidoDetailComponent)
  },
];

// ---------------------------------------------------------------------------
// Rutas de autenticación
// ---------------------------------------------------------------------------
const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'registro-cliente',
    loadComponent: () => import('./features/auth/register-cliente/register-cliente.component').then(m => m.RegisterClienteComponent)
  },
];

// ---------------------------------------------------------------------------
// Rutas dentro del Shell (sidebar azul — ADMIN / ARTESANO / DOMICILIARIO)
// ---------------------------------------------------------------------------
const SHELL_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Dashboard general ────────────────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // ── Catálogo (Admin) ─────────────────────────────────────────────────────
  {
    path: 'products',
    canActivate: [roleGuard(['ADMIN', 'ARTESANO'])],
    loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent)
  },
  {
    path: 'categories',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/categories/category-list/category-list.component').then(m => m.CategoryListComponent)
  },
  {
    path: 'artesanos',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/artesanos/artesano-list/artesano-list.component').then(m => m.ArtesanoListComponent)
  },

  // ── Ventas y clientes ────────────────────────────────────────────────────
  {
    path: 'clientes',
    canActivate: [roleGuard(['ADMIN', 'ARTESANO'])],
    loadComponent: () => import('./features/clientes/cliente-list/cliente-list.component').then(m => m.ClienteListComponent)
  },
  {
    path: 'ventas',
    canActivate: [roleGuard(['ADMIN', 'ARTESANO'])],
    loadComponent: () => import('./features/ventas/venta-list/venta-list.component').then(m => m.VentaListComponent)
  },
  {
    path: 'pedidos',
    canActivate: [roleGuard(['ADMIN', 'ARTESANO', 'DOMICILIARIO'])],
    loadComponent: () => import('./features/pedidos/pedido-list/pedido-list.component').then(m => m.PedidoListComponent)
  },

  // ── Inventario ───────────────────────────────────────────────────────────
  {
    path: 'stock',
    canActivate: [roleGuard(['ADMIN', 'ARTESANO'])],
    loadComponent: () => import('./features/stock/stock.component').then(m => m.StockComponent)
  },
  {
    path: 'inventory/entries',
    canActivate: [roleGuard(['ADMIN', 'ARTESANO'])],
    loadComponent: () => import('./features/inventory/entry-form/entry-form.component').then(m => m.EntryFormComponent)
  },
  {
    path: 'inventory/exits',
    canActivate: [roleGuard(['ADMIN', 'ARTESANO'])],
    loadComponent: () => import('./features/inventory/exit-form/exit-form.component').then(m => m.ExitFormComponent)
  },

  // ── Logística ────────────────────────────────────────────────────────────
  {
    path: 'entregas',
    canActivate: [roleGuard(['ADMIN', 'DOMICILIARIO'])],
    loadComponent: () => import('./features/entregas/delivery-list/delivery-list.component').then(m => m.DeliveryListComponent)
  },

  // ── Reportes ─────────────────────────────────────────────────────────────
  {
    path: 'reports',
    canActivate: [roleGuard(['ADMIN', 'ARTESANO'])],
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
  },

  // ────────────────────────────────────────────────────────────────────────
  // SECCIÓN ARTESANO
  // ────────────────────────────────────────────────────────────────────────
  {
    path: 'artesano',
    canActivate: [roleGuard(['ARTESANO', 'ADMIN'])],
    children: [
      {
        path: 'comunidad',
        loadComponent: () => import('./features/comunidad/comunidad-feed/comunidad-feed.component').then(m => m.ComunidadFeedComponent)
      },
      {
        path: 'eventos',
        loadComponent: () => import('./features/comunidad/eventos/eventos.component').then(m => m.EventosComponent)
      },
    ]
  },

  // ────────────────────────────────────────────────────────────────────────
  // SECCIÓN DOMICILIARIO
  // ────────────────────────────────────────────────────────────────────────
  {
    path: 'domiciliario',
    canActivate: [roleGuard(['DOMICILIARIO', 'ADMIN'])],
    children: [
      {
        path: 'panel',
        loadComponent: () => import('./features/domiciliario/panel/delivery-panel.component').then(m => m.DeliveryPanelComponent)
      },
      { path: '', redirectTo: 'panel', pathMatch: 'full' }
    ]
  },

  // ────────────────────────────────────────────────────────────────────────
  // SECCIÓN ADMIN
  // ────────────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: 'artisan-requests',
        loadComponent: () => import('./features/auth/artisan-requests/artisan-requests.component').then(m => m.ArtisanRequestsComponent)
      },
      {
        path: 'aprobaciones',
        loadComponent: () => import('./features/auth/artisan-requests/artisan-requests.component').then(m => m.ArtisanRequestsComponent)
      },
      {
        path: 'moderacion',
        loadComponent: () => import('./features/comunidad/moderacion/moderacion.component').then(m => m.ModeracionComponent)
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
    ]
  },
];

// ---------------------------------------------------------------------------
// Tabla de rutas principal
// ---------------------------------------------------------------------------
export const routes: Routes = [
  ...PUBLIC_ROUTES,
  ...AUTH_ROUTES,
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard, notClienteGuard],
    children: SHELL_ROUTES
  },
  { path: '**', redirectTo: '' }
];
