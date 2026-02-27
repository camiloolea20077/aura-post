import { Routes } from '@angular/router';

export const CUENTAS_ROUTES: Routes = [
  {
    path: 'cuentas-cobrar',
    loadComponent: () =>
      import('./index-cuentas-por-cobrar/index-cuentas-por-cobrar.component').then(
        (m) => m.IndexCuentasPorCobrarComponent,
      ),
  },
  {
    path: 'cuentas-pagar',
    loadComponent: () =>
      import('./index-cuentas-por-pagar/index-cuentas-por-pagar.component').then(
        (m) => m.IndexCuentasPorPagarComponent,
      ),
  },
];
