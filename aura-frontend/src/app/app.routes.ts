import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { rolGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Auth
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
  },

  // App protegida
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },

      // POS — libre para todos
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos.component').then((m) => m.PosComponent),
      },

      // Catálogo
      {
        path: 'catalogo/productos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/catalogo/productos/index/index-productos.component').then(
            (m) => m.IndexProductosComponent,
          ),
      },
      {
        path: 'catalogo/categorias',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/catalogo/categorias/index/index-categorias.component').then(
            (m) => m.IndexCategoriasComponent,
          ),
      },
      {
        path: 'catalogo/marcas',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/catalogo/marcas/index/index-marcas.component').then(
            (m) => m.IndexMarcasComponent,
          ),
      },
      {
        path: 'catalogo/unidades',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/catalogo/unidades/index/index-unidades.component').then(
            (m) => m.IndexUnidadesComponent,
          ),
      },
      {
        path: 'catalogo/presentaciones',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/catalogo/presentaciones/index/index-presentaciones.component').then(
            (m) => m.IndexPresentacionesComponent,
          ),
      },
      {
        path: 'catalogo/composiciones',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/catalogo/composiciones/index/index-composicion.component').then(
            (m) => m.IndexComposicionComponent,
          ),
      },

      // Precios
      {
        path: 'precios/listas',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/precios/listas-precios/index/index-lista-precios.component').then(
            (m) => m.IndexListaPreciosComponent,
          ),
      },
      {
        path: 'precios/productos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/precios/precios-producto/index/index-producto-precio.component').then(
            (m) => m.IndexProductoPrecioComponent,
          ),
      },
      {
        path: 'precios/descuentos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/precios/reglas-descuento/index/index-descuentos.component').then(
            (m) => m.IndexDescuentosComponent,
          ),
      },

      // Inventario
      {
        path: 'inventario/stock',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/inventario/inventario/index/index-inventario.component').then(
            (m) => m.IndexInventarioComponent,
          ),
      },
      {
        path: 'inventario/lotes',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/inventario/lotes/index/index-lotes.component').then(
            (m) => m.IndexLotesComponent,
          ),
      },
      {
        path: 'inventario/seriales',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/inventario/seriales/index/index-seriales.component').then(
            (m) => m.IndexSerialesComponent,
          ),
      },
      {
        path: 'inventario/kardex',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/inventario/kardex/index/index-kardex.component').then(
            (m) => m.IndexKardexComponent,
          ),
      },

      // Operaciones
      {
        path: 'compras',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/compras/index/index-compras.component').then(
            (m) => m.IndexComprasComponent,
          ),
      },
      {
        path: 'ventas',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/ventas/index/index-ventas.component').then(
            (m) => m.IndexVentasComponent,
          ),
      },
      {
        path: 'mermas',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/mermas/index/index-mermas.component').then(
            (m) => m.IndexMermasComponent,
          ),
      },
      {
        path: 'traslados',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/traslados/index/index-traslados.component').then(
            (m) => m.IndexTrasladosComponent,
          ),
      },

      // Terceros
      {
        path: 'terceros',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/terceros/index/index-terceros.component').then(
            (m) => m.IndexTercerosComponent,
          ),
      },

      // Caja
      {
        path: 'caja/cajas',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/caja/cajas/index/index-cajas.component').then(
            (m) => m.IndexCajasComponent,
          ),
      },
      {
        path: 'caja/turnos',
        // libre — CAJERO necesita acceder para abrir/cerrar turno
        loadComponent: () =>
          import('./features/caja/turnos/index/index-turnos.component').then(
            (m) => m.IndexTurnosComponent,
          ),
      },

      // Reportes
      // {
      //   path: 'reportes/ventas',
      //   loadComponent: () =>
      //     import('./features/reportes/ventas/reporte-ventas.component').then(m => m.ReporteVentasComponent),
      // },
      // {
      //   path: 'reportes/inventario',
      //   loadComponent: () =>
      //     import('./features/reportes/inventario/reporte-inventario.component').then(m => m.ReporteInventarioComponent),
      // },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' },
];
