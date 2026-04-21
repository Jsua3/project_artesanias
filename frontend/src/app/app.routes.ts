import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './shared/layout/shell/shell.component';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      { path: 'products', loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent), canActivate: [roleGuard(['ADMIN', 'ARTESANO'])] },
      { path: 'categories', loadComponent: () => import('./features/categories/category-list/category-list.component').then(m => m.CategoryListComponent), canActivate: [roleGuard(['ADMIN'])] },
      { path: 'artesanos', loadComponent: () => import('./features/artesanos/artesano-list/artesano-list.component').then(m => m.ArtesanoListComponent), canActivate: [roleGuard(['ADMIN'])] },

      { path: 'clientes', loadComponent: () => import('./features/clientes/cliente-list/cliente-list.component').then(m => m.ClienteListComponent), canActivate: [roleGuard(['ADMIN', 'ARTESANO'])] },
      { path: 'ventas', loadComponent: () => import('./features/ventas/venta-list/venta-list.component').then(m => m.VentaListComponent), canActivate: [roleGuard(['ADMIN', 'ARTESANO'])] },

      { path: 'stock', loadComponent: () => import('./features/stock/stock.component').then(m => m.StockComponent), canActivate: [roleGuard(['ADMIN', 'ARTESANO'])] },
      { path: 'inventory/entries', loadComponent: () => import('./features/inventory/entry-form/entry-form.component').then(m => m.EntryFormComponent), canActivate: [roleGuard(['ADMIN', 'ARTESANO'])] },
      { path: 'inventory/exits', loadComponent: () => import('./features/inventory/exit-form/exit-form.component').then(m => m.ExitFormComponent), canActivate: [roleGuard(['ADMIN', 'ARTESANO'])] },

      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent), canActivate: [roleGuard(['ADMIN', 'ARTESANO'])] },
      { path: 'admin/artisan-requests', loadComponent: () => import('./features/auth/artisan-requests/artisan-requests.component').then(m => m.ArtisanRequestsComponent), canActivate: [adminGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];
