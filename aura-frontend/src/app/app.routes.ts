import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/pages/login/login.component';

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

      // // POS
      // {
      //   path: 'pos',
      //   loadComponent: () =>
      //     import('./features/pos/pos.component').then(m => m.PosComponent),
      // },

      // // Catálogo
      {
        path: 'catalogo/productos',
        loadComponent: () =>
          import('./features/catalogo/productos/index/index-productos.component').then(
            (m) => m.IndexProductosComponent,
          ),
      },
      {
        path: 'catalogo/categorias',
        loadComponent: () =>
          import('./features/catalogo/categorias/index/index-categorias.component').then(
            (m) => m.IndexCategoriasComponent,
          ),
      },
      {
        path: 'catalogo/marcas',
        loadComponent: () =>
          import('./features/catalogo/marcas/index/index-marcas.component').then(
            (m) => m.IndexMarcasComponent,
          ),
      },
      {
        path: 'catalogo/unidades',
        loadComponent: () =>
          import('./features/catalogo/unidades/index/index-unidades.component').then(
            (m) => m.IndexUnidadesComponent,
          ),
      },

      // // Precios
      // {
      //   path: 'precios/listas',
      //   loadComponent: () =>
      //     import('./features/precios/listas-precios/index/index-listas.component').then(m => m.IndexListasComponent),
      // },
      // {
      //   path: 'precios/descuentos',
      //   loadComponent: () =>
      //     import('./features/precios/reglas-descuento/index/index-descuentos.component').then(m => m.IndexDescuentosComponent),
      // },

      // // Inventario
      // {
      //   path: 'inventario/stock',
      //   loadComponent: () =>
      //     import('./features/inventario/stock/index/index-stock.component').then(m => m.IndexStockComponent),
      // },
      // {
      //   path: 'inventario/lotes',
      //   loadComponent: () =>
      //     import('./features/inventario/lotes/index/index-lotes.component').then(m => m.IndexLotesComponent),
      // },
      // {
      //   path: 'inventario/seriales',
      //   loadComponent: () =>
      //     import('./features/inventario/seriales/index/index-seriales.component').then(m => m.IndexSerialesComponent),
      // },
      // {
      //   path: 'inventario/kardex',
      //   loadComponent: () =>
      //     import('./features/inventario/kardex/index/index-kardex.component').then(m => m.IndexKardexComponent),
      // },

      // // Operaciones
      // {
      //   path: 'compras',
      //   loadComponent: () =>
      //     import('./features/compras/index/index-compras.component').then(m => m.IndexComprasComponent),
      // },
      // {
      //   path: 'ventas',
      //   loadComponent: () =>
      //     import('./features/ventas/index/index-ventas.component').then(m => m.IndexVentasComponent),
      // },
      // {
      //   path: 'mermas',
      //   loadComponent: () =>
      //     import('./features/mermas/index/index-mermas.component').then(m => m.IndexMermasComponent),
      // },
      // {
      //   path: 'traslados',
      //   loadComponent: () =>
      //     import('./features/traslados/index/index-traslados.component').then(m => m.IndexTrasladosComponent),
      // },

      // // Terceros
      // {
      //   path: 'terceros',
      //   loadComponent: () =>
      //     import('./features/terceros/index/index-terceros.component').then(m => m.IndexTercerosComponent),
      // },

      // // Caja
      // {
      //   path: 'caja/cajas',
      //   loadComponent: () =>
      //     import('./features/caja/cajas/index/index-cajas.component').then(m => m.IndexCajasComponent),
      // },
      // {
      //   path: 'caja/turnos',
      //   loadComponent: () =>
      //     import('./features/caja/turnos/index/index-turnos.component').then(m => m.IndexTurnosComponent),
      // },

      // // Reportes
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
