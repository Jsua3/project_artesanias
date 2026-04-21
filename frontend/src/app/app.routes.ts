import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { notClienteGuard } from './core/guards/not-cliente.guard';
import { ShellComponent } from './shared/layout/shell/shell.component';

export const routes: Routes = [
  // Tienda pública (sin login)
  {
    path: '',
    loadComponent: () =>
      import('./features/public/public-landing/public-landing.component')
        .then(m => m.PublicLandingComponent)
  },

  // Auth
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: 'registro-cliente',
    loadComponent: () =>
      import('./features/auth/register-cliente/register-cliente.component')
        .then(m => m.RegisterClienteComponent)
  },

  // Carrito público y checkout
  {
    path: 'carrito',
    loadComponent: () =>
      import('./features/public/cart-page/cart-page.component')
        .then(m => m.CartPageComponent)
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/public/checkout/checkout.component')
        .then(m => m.CheckoutComponent)
  },

  // Pedidos del cliente (requiere login CLIENTE)
  {
    path: 'mis-pedidos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/public/mis-pedidos/mis-pedidos-list.component')
        .then(m => m.MisPedidosListComponent)
  },
  {
    path: 'mis-pedidos/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/public/mis-pedidos/mis-pedido-detail.component')
        .then(m => m.MisPedidoDetailComponent)
  },

  // Backoffice (solo ADMIN/OPERATOR)
  {
    path: 'admin',
    component: ShellComponent,
    canActivate: [authGuard, notClienteGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // Catálogo
      { path: 'products', loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent) },
      { path: 'categories', loadComponent: () => import('./features/categories/category-list/category-list.component').then(m => m.CategoryListComponent) },
      { path: 'artesanos', loadComponent: () => import('./features/artesanos/artesano-list/artesano-list.component').then(m => m.ArtesanoListComponent) },

      // Ventas y clientes
      { path: 'clientes', loadComponent: () => import('./features/clientes/cliente-list/cliente-list.component').then(m => m.ClienteListComponent) },
      { path: 'ventas', loadComponent: () => import('./features/ventas/venta-list/venta-list.component').then(m => m.VentaListComponent) },

      // Inventario
      { path: 'stock', loadComponent: () => import('./features/stock/stock.component').then(m => m.StockComponent) },
      { path: 'inventory/entries', loadComponent: () => import('./features/inventory/entry-form/entry-form.component').then(m => m.EntryFormComponent) },
      { path: 'inventory/exits', loadComponent: () => import('./features/inventory/exit-form/exit-form.component').then(m => m.ExitFormComponent) },

      // Admin-only
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent), canActivate: [adminGuard] },
    ]
  },

  { path: '**', redirectTo: '' }
];
