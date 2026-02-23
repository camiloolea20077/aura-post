import { Routes } from '@angular/router';
import { PlatformLayoutComponent } from './layout/platform-layout.component';

export const PLATFORM_ROUTES: Routes = [
  {
    path: '',
    component: PlatformLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard-platform.component').then(
            (m) => m.DashboardPlatformComponent,
          ),
      },
      {
        path: 'empresas',
        loadComponent: () =>
          import('./index/index-empresas.component').then(
            (m) => m.IndexEmpresasComponent,
          ),
      },
    ],
  },
];
