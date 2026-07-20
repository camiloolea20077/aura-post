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
      {
        path: 'gastos/nuevo',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/gastos/form/form-gasto.component').then(
            (m) => m.FormGastoComponent,
          ),
      },
      {
        path: 'gastos/editar/:id',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/gastos/form/form-gasto.component').then(
            (m) => m.FormGastoComponent,
          ),
      },
      {
        path: 'obligaciones',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/obligaciones/index/index-obligaciones.component').then(
            (m) => m.IndexObligacionesComponent,
          ),
      },
      {
        path: 'obligaciones/nuevo',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/obligaciones/form/form-obligacion.component').then(
            (m) => m.FormObligacionComponent,
          ),
      },
      {
        path: 'obligaciones/:id',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/obligaciones/detalle/detalle-obligacion.component').then(
            (m) => m.DetalleObligacionComponent,
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
        path: 'compras/nueva',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/compras/form/form-compra.component').then(
            (m) => m.FormCompraComponent,
          ),
      },
      {
        path: 'compras/:id/editar',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/compras/form/form-compra.component').then(
            (m) => m.FormCompraComponent,
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
        path: 'cotizaciones/editar/:id',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN', 'CAJERO'])],
        loadComponent: () =>
          import('./features/cotizaciones/form/form-cotizacion.component').then(
            (m) => m.FormCotizacionComponent,
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
        path: 'proyectos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/proyectos/proyectos.component').then(
            (m) => m.ProyectosComponent,
          ),
      },
      {
        path: 'proyectos/:proyectoId/frentes',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/proyectos/frentes/frentes.component').then(
            (m) => m.FrentesComponent,
          ),
      },
      {
        path: 'asistencia-frente/digitacion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia-frente/digitacion.component').then(
            (m) => m.DigitacionComponent,
          ),
      },
      {
        path: 'asistencia-frente/revision',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia-frente/revision.component').then(
            (m) => m.RevisionFrenteComponent,
          ),
      },
      {
        path: 'asistencia-frente/preliquidacion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia-frente/preliquidacion.component').then(
            (m) => m.PreliquidacionFrenteComponent,
          ),
      },
      {
        path: 'laboral/configuracion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/laboral/config-laboral.component').then(
            (m) => m.ConfigLaboralComponent,
          ),
      },
      {
        path: 'laboral/calendario',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/laboral/calendario-laboral.component').then(
            (m) => m.CalendarioLaboralComponent,
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
      {
        path: 'terceros/nuevo',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/terceros/form-plano/form-tercero-plano.component').then(
            (m) => m.FormTerceroPlanoComponent,
          ),
      },
      {
        path: 'terceros/editar/:id',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/terceros/form-plano/form-tercero-plano.component').then(
            (m) => m.FormTerceroPlanoComponent,
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
        // Alta de empleado (flujo nuevo): crea la identidad como tercero y de
        // ahí cae en la ficha para agregar el contrato.
        path: 'nomina/empleados/nuevo',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/empleados/nuevo/empleado-nuevo.component').then(
            (m) => m.EmpleadoNuevoComponent,
          ),
      },
      {
        // Ficha del empleado (maestro-detalle): identidad + tabs de contratos,
        // afiliaciones, retenciones y embargos.
        path: 'nomina/empleados/:id/ficha',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/empleados/detalle/empleado-detalle.component').then(
            (m) => m.EmpleadoDetalleComponent,
          ),
      },
      {
        // Contratos de un empleado (Fase 2). Se entra desde el listado de
        // empleados: un empleado puede tener varios contratos, por eso la
        // ruta cuelga de él.
        path: 'nomina/empleados/:empleadoId/contratos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/contratos/index/index-contratos.component').then(
            (m) => m.IndexContratosComponent,
          ),
      },
      {
        // Catálogo de conceptos de nómina (Fase 3). Tarifas parametrizables
        // por vigencia, sin recompilar el motor.
        path: 'nomina/conceptos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/conceptos/index/index-conceptos.component').then(
            (m) => m.IndexConceptosComponent,
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
        // PILA (Fase 6). Genera la planilla estructurada; el archivo plano por
        // operador es un export aparte.
        path: 'nomina/pila',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/pila/pila.component').then(
            (m) => m.PilaComponent,
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

      // Asistencia
      {
        path: 'asistencia/turnos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia/turnos/turnos.component').then(
            (m) => m.TurnosComponent,
          ),
      },
      {
        path: 'asistencia/marcaje',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia/marcaje/marcaje.component').then(
            (m) => m.MarcajeComponent,
          ),
      },
      {
        path: 'asistencia/revision',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia/revision/revision.component').then(
            (m) => m.RevisionAsistenciaComponent,
          ),
      },
      {
        path: 'asistencia/novedades',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia/novedades/novedades-asistencia.component').then(
            (m) => m.NovedadesAsistenciaComponent,
          ),
      },
      {
        path: 'asistencia/autorizaciones',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia/autorizaciones/autorizaciones.component').then(
            (m) => m.AutorizacionesComponent,
          ),
      },
      {
        path: 'nomina/preliquidacion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/asistencia/cierre/preliquidacion.component').then(
            (m) => m.PreliquidacionComponent,
          ),
      },
      {
        path: 'nomina/prestaciones',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/nomina/prestaciones/prestaciones.component').then(
            (m) => m.PrestacionesComponent,
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
      {
        path: 'contabilidad/revision',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/revision-asientos/revision-asientos.component').then(
            (m) => m.RevisionAsientosComponent,
          ),
      },
      {
        path: 'contabilidad/balance-general',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/balance-general/balance-general.component').then(
            (m) => m.BalanceGeneralComponent,
          ),
      },
      {
        path: 'contabilidad/conceptos-caja',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/conceptos-caja/conceptos-caja.component').then(
            (m) => m.ConceptosCajaComponent,
          ),
      },
      {
        path: 'contabilidad/saldos-iniciales',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/saldos-iniciales/saldos-iniciales.component').then(
            (m) => m.SaldosInicialesComponent,
          ),
      },
      {
        path: 'contabilidad/centros-costo',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/centros-costo/centros-costo.component').then(
            (m) => m.CentrosCostoComponent,
          ),
      },
      {
        path: 'contabilidad/periodos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/periodos-contables/periodos-contables.component').then(
            (m) => m.PeriodosContablesComponent,
          ),
      },
      {
        path: 'contabilidad/activos-fijos',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/activos-fijos/activos-fijos.component').then(
            (m) => m.ActivosFijosComponent,
          ),
      },
      {
        path: 'contabilidad/tarifas-retencion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/tarifas-retencion/tarifas-retencion.component').then(
            (m) => m.TarifasRetencionComponent,
          ),
      },
      // E8: wizard de cierre de ejercicio + distribución de utilidades
      {
        path: 'contabilidad/cierre-anual',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/cierre-anual/cierre-anual.component').then(
            (m) => m.CierreAnualComponent,
          ),
      },
      // E9: conciliación bancaria (extracto vs libro)
      {
        path: 'contabilidad/conciliacion',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/conciliacion/conciliacion-bancaria.component').then(
            (m) => m.ConciliacionBancariaComponent,
          ),
      },
      // E10: estados financieros NIIF (patrimonio + flujo de efectivo)
      {
        path: 'contabilidad/eeff',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/eeff/eeff.component').then(
            (m) => m.EeffComponent,
          ),
      },
      // E11: información exógena DIAN
      {
        path: 'contabilidad/exogena',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/contabilidad/exogena/exogena.component').then(
            (m) => m.ExogenaComponent,
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
      // Comprobante contable (formulario plano)
      {
        path: 'comprobantes/contable/nuevo',
        canActivate: [rolGuard(['SUPER_ADMIN', 'ADMIN'])],
        loadComponent: () =>
          import('./features/comprobantes/contable/form/form-comprobante-contable.component').then(
            (m) => m.FormComprobanteContableComponent,
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
