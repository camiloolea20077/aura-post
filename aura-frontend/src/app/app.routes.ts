import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { rolGuard } from './core/guards/role.guard';
import { platformGuard } from './core/guards/platform.guard';
import { clienteGuard } from './core/guards/cliente.guard';

export const routes: Routes = [
  // Auth
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: 'platform',
    canActivate: [platformGuard],
    loadChildren: () =>
      import('./features/super_admin/platform.routes').then(
        (m) => m.PLATFORM_ROUTES,
      ),
  },

  // App protegida
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard, clienteGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard
      {
        path: 'dashboard',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },

      // POS
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
      {
        path: 'catalogo/etiquetas',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/catalogo/etiquetas/index/etiquetas.component').then(
            (m) => m.EtiquetasComponent,
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

      // Cuentas por cobrar / pagar
      {
        path: 'cuentas/cuentas-por-cobrar',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/cuentas/index-cuentas-por-cobrar/index-cuentas-por-cobrar.component').then(
            (m) => m.IndexCuentasPorCobrarComponent,
          ),
      },
      {
        path: 'cuentas/cuentas-por-pagar',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/cuentas/index-cuentas-por-pagar/index-cuentas-por-pagar.component').then(
            (m) => m.IndexCuentasPorPagarComponent,
          ),
      },

      // Contabilidad
      {
        path: 'contabilidad/cierre',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/cierre/cierre-contable.component').then(
            (m) => m.CierreContableComponent,
          ),
      },
      {
        path: 'contabilidad/estado-cuenta',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/estado-cuenta/estado-cuenta.component').then(
            (m) => m.EstadoCuentaComponent,
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
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN', 'CAJERO'])],
        loadComponent: () =>
          import('./features/ventas/index/index-ventas.component').then(
            (m) => m.IndexVentasComponent,
          ),
      },
      {
        path: 'cotizaciones',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN', 'CAJERO'])],
        loadComponent: () =>
          import('./features/cotizaciones/index/index-cotizaciones.component').then(
            (m) => m.IndexCotizacionesComponent,
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

      // Terceros (solo gestión, sin estado de cuenta)
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
        loadComponent: () =>
          import('./features/caja/turnos/index/index-turnos.component').then(
            (m) => m.IndexTurnosComponent,
          ),
      },
      {
        path: 'admin/sucursales',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/sucursales/index/index-sucursales.component').then(
            (m) => m.IndexSucursalesComponent,
          ),
      },
      {
        path: 'admin/usuarios',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/usuarios/index/index-usuarios.component').then(
            (m) => m.IndexUsuariosComponent,
          ),
      },

      // Comisiones
      {
        path: 'comisiones/configuracion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/comisiones/config/index/index-comision-config.component').then(
            (m) => m.IndexComisionConfigComponent,
          ),
      },
      {
        path: 'comisiones/liquidaciones',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/comisiones/liquidaciones/index/index-liquidaciones.component').then(
            (m) => m.IndexLiquidacionesComponent,
          ),
      },

      // Reportes
      {
        path: 'reportes/ventas',
        loadComponent: () =>
          import('./features/reporte-ventas/reporte-ventas.component').then(
            (m) => m.ReporteVentasComponent,
          ),
      },
      {
        path: 'reportes/inventario',
        loadComponent: () =>
          import('./features/reporte-inventario/reporte-inventario.component').then(
            (m) => m.ReporteInventarioComponent,
          ),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' },
];
