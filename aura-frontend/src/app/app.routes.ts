import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pages/pos/pos.component').then(
            (m) => m.PosComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/pages/products/products.component').then(
            (m) => m.ProductsComponent
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/pages/inventory/inventory.component').then(
            (m) => m.InventoryComponent
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/pages/customers/customers.component').then(
            (m) => m.CustomersComponent
          ),
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/suppliers/pages/suppliers/suppliers.component').then(
            (m) => m.SuppliersComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/pages/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
