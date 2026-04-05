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
      {
        path: 'contabilidad/reporte-iva',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/reporte-iva/reporte-iva.component').then(
            (m) => m.ReporteIvaComponent,
          ),
      },
      {
        path: 'gastos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/gastos/index/index-gastos.component').then(
            (m) => m.IndexGastosComponent,
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
      {
        path: 'inventario/reconteos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/inventario/reconteos/index/index-reconteos.component').then(
            (m) => m.IndexReconeosComponent,
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
        path: 'compras/ordenes',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/compras/ordenes/index-ordenes.component').then(
            (m) => m.IndexOrdenesComponent,
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

      // Vendedores
      {
        path: 'vendedores',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN', 'VENDEDOR'])],
        loadChildren: () =>
          import('./features/vendedores/vendedores.routes').then(
            (m) => m.VENDEDORES_ROUTES,
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
        path: 'devoluciones',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN', 'CAJERO'])],
        loadComponent: () =>
          import('./features/devoluciones/index/index-devoluciones.component').then(
            (m) => m.IndexDevolucionesComponent,
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

      // Configuración
      {
        path: 'configuracion/tipos-empleado',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/configuracion/tipos-empleado/index/index-tipos-empleado.component').then(
            (m) => m.IndexTiposEmpleadoComponent,
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

      // Nómina
      {
        path: 'nomina/config',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/config/nomina-config.component').then(
            (m) => m.NominaConfigComponent,
          ),
      },
      {
        path: 'nomina/empleados',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/empleados/index/index-empleados.component').then(
            (m) => m.IndexEmpleadosComponent,
          ),
      },
      {
        path: 'nomina/periodos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/periodos/index/index-periodos.component').then(
            (m) => m.IndexPeriodosComponent,
          ),
      },
      {
        path: 'nomina/liquidacion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/liquidacion/index/index-liquidacion.component').then(
            (m) => m.IndexLiquidacionComponent,
          ),
      },

      // Ventas de campo
      {
        path: 'ventas-campo',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/ventas-campo/index/index-ventas-campo.component').then(
            (m) => m.IndexVentasCampoComponent,
          ),
      },

      // Cartera
      {
        path: 'cartera',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/cartera/index/index-cartera.component').then(
            (m) => m.IndexCarteraComponent,
          ),
      },

      // Tesorería
      {
        path: 'tesoreria/cuentas-bancarias',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/tesoreria/cuentas-bancarias/index-cuentas-bancarias.component').then(
            (m) => m.IndexCuentasBancariasComponent,
          ),
      },
      {
        path: 'tesoreria/egresos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/tesoreria/egresos/index-egresos.component').then(
            (m) => m.IndexEgresosComponent,
          ),
      },
      {
        path: 'tesoreria/recaudos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/tesoreria/recaudos/index-recaudos.component').then(
            (m) => m.IndexRecaudosComponent,
          ),
      },
      {
        path: 'tesoreria/conciliacion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/tesoreria/conciliacion/index-conciliacion.component').then(
            (m) => m.IndexConciliacionComponent,
          ),
      },

      // Contabilidad — Plan de Cuentas y Asientos
      {
        path: 'contabilidad/plan-cuentas',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/plan-cuentas/plan-cuentas.component').then(
            (m) => m.PlanCuentasComponent,
          ),
      },
      {
        path: 'contabilidad/asientos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/asientos/asientos.component').then(
            (m) => m.AsientosComponent,
          ),
      },

      // Comprobantes de caja
      {
        path: 'comprobantes',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN', 'CAJERO'])],
        loadComponent: () =>
          import('./features/comprobantes/index/index-comprobantes.component').then(
            (m) => m.IndexComprobantesComponent,
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
      {
        path: 'reportes/avanzados',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/reportes-avanzados/reportes-avanzados.component').then(
            (m) => m.ReportesAvanzadosComponent,
          ),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' },
];
