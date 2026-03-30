import { Routes } from '@angular/router';

export const VENDEDORES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./index/index-vendedores.component').then(
        (m) => m.IndexVendedoresComponent,
      ),
  },
  {
    path: 'locales',
    loadComponent: () =>
      import('./locales/index/index-locales.component').then(
        (m) => m.IndexLocalesComponent,
      ),
  },
  {
    path: 'rutas',
    loadComponent: () =>
      import('./rutas/index/index-rutas.component').then(
        (m) => m.IndexRutasComponent,
      ),
  },
  {
    path: 'visitas',
    loadComponent: () =>
      import('./visitas/index/index-visitas.component').then(
        (m) => m.IndexVisitasComponent,
      ),
  },
];
