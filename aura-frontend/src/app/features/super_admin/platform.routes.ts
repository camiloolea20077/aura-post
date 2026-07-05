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
      {
        path: 'clientes',
        loadComponent: () =>
          import('./clientes/index-clientes.component').then(
            (m) => m.IndexClientesComponent,
          ),
      },
      {
        path: 'errores',
        loadComponent: () =>
          import('./monitor-errores/monitor-errores.component').then(
            (m) => m.MonitorErroresComponent,
          ),
      },
      {
        path: 'permisos/:id',
        loadComponent: () =>
          import('./permisos-empresa/index-permisos.component').then(
            (m) => m.IndexPermisosComponent,
          ),
      },
      {
        path: 'modulos',
        loadComponent: () =>
          import('./modulos/index/index-modulos.component').then(
            (m) => m.IndexModulosComponent,
          ),
      },
      {
        path: 'modulos/:id/submodulos',
        loadComponent: () =>
          import('./modulos/index/index-submodulos.component').then(
            (m) => m.IndexSubmodulosComponent,
          ),
      },
    ],
  },
];
