import { Routes } from '@angular/router';

/**
 * Módulo Servicio técnico (opcional por empresa). Se carga aparte, solo cuando
 * alguien entra: las empresas que no lo usan no descargan nada de esto.
 * Los permisos los revisa permisoGuard con los ítems del menú (servicio-tecnico.*).
 */
export const SERVICIO_TECNICO_ROUTES: Routes = [
  { path: '', redirectTo: 'ordenes', pathMatch: 'full' },
  {
    path: 'ordenes',
    loadComponent: () =>
      import('./bandeja/bandeja-servicio.component').then((m) => m.BandejaServicioComponent),
  },
  {
    path: 'ordenes/nueva',
    loadComponent: () =>
      import('./orden/orden-servicio.component').then((m) => m.OrdenServicioComponent),
  },
  {
    path: 'ordenes/:id',
    loadComponent: () =>
      import('./orden/orden-servicio.component').then((m) => m.OrdenServicioComponent),
  },
  {
    path: 'configuracion',
    loadComponent: () =>
      import('./configuracion/config-servicio.component').then((m) => m.ConfigServicioComponent),
  },
];
