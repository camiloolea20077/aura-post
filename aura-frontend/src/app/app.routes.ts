import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { rolGuard } from './core/guards/role.guard';
import { permisoGuard } from './core/guards/permiso.guard';
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
    // Permisos por perfil: oculta en el front las pantallas que el perfil no ve.
    canActivateChild: [permisoGuard],
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

      // POS
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos.component').then((m) => m.PosComponent),
      },

      // Catálogo
      {
        path: 'catalogo/productos',
        loadComponent: () =>
          import('./features/catalogo/productos/index/index-productos.component').then(
            (m) => m.IndexProductosComponent,
          ),
      },
      {
        path: 'catalogo/productos/nuevo',
        loadComponent: () =>
          import('./features/catalogo/productos/form/form-productos.component').then(
            (m) => m.FormProductosComponent,
          ),
      },
      {
        path: 'catalogo/productos/editar/:id',
        loadComponent: () =>
          import('./features/catalogo/productos/form/form-productos.component').then(
            (m) => m.FormProductosComponent,
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
      {
        path: 'catalogo/presentaciones',
        loadComponent: () =>
          import('./features/catalogo/presentaciones/index/index-presentaciones.component').then(
            (m) => m.IndexPresentacionesComponent,
          ),
      },
      {
        path: 'catalogo/composiciones',
        loadComponent: () =>
          import('./features/catalogo/composiciones/index/index-composicion.component').then(
            (m) => m.IndexComposicionComponent,
          ),
      },
      {
        path: 'catalogo/etiquetas',
        loadComponent: () =>
          import('./features/catalogo/etiquetas/index/etiquetas.component').then(
            (m) => m.EtiquetasComponent,
          ),
      },

      // Precios
      {
        path: 'precios/listas',
        loadComponent: () =>
          import('./features/precios/listas-precios/index/index-lista-precios.component').then(
            (m) => m.IndexListaPreciosComponent,
          ),
      },
      {
        path: 'precios/productos',
        loadComponent: () =>
          import('./features/precios/precios-producto/index/index-producto-precio.component').then(
            (m) => m.IndexProductoPrecioComponent,
          ),
      },
      {
        path: 'precios/descuentos',
        loadComponent: () =>
          import('./features/precios/reglas-descuento/index/index-descuentos.component').then(
            (m) => m.IndexDescuentosComponent,
          ),
      },

      // Cuentas por cobrar / pagar
      {
        path: 'cuentas/cuentas-por-cobrar',
        loadComponent: () =>
          import('./features/cuentas/index-cuentas-por-cobrar/index-cuentas-por-cobrar.component').then(
            (m) => m.IndexCuentasPorCobrarComponent,
          ),
      },
      {
        path: 'cuentas/cuentas-por-pagar',
        loadComponent: () =>
          import('./features/cuentas/index-cuentas-por-pagar/index-cuentas-por-pagar.component').then(
            (m) => m.IndexCuentasPorPagarComponent,
          ),
      },

      // Contabilidad
      {
        // Centro de Contabilidad: el sidebar abre aquí en vez de desplegar
        // las ~22 pantallas; cada una conserva su ruta de siempre.
        path: 'contabilidad',
        loadComponent: () =>
          import('./features/contabilidad/centro/centro-contabilidad.component').then(
            (m) => m.CentroContabilidadComponent,
          ),
      },
      {
        // Centro de Recursos Humanos: igual que Contabilidad, el sidebar abre
        // aquí y cada pantalla conserva su ruta de siempre.
        path: 'recursos-humanos',
        loadComponent: () =>
          import('./features/nomina/centro/centro-rrhh.component').then(
            (m) => m.CentroRrhhComponent,
          ),
      },
      {
        path: 'contabilidad/cierre',
        loadComponent: () =>
          import('./features/contabilidad/cierre/cierre-contable.component').then(
            (m) => m.CierreContableComponent,
          ),
      },
      {
        path: 'contabilidad/estado-cuenta',
        loadComponent: () =>
          import('./features/contabilidad/estado-cuenta/estado-cuenta.component').then(
            (m) => m.EstadoCuentaComponent,
          ),
      },
      {
        path: 'contabilidad/reporte-iva',
        loadComponent: () =>
          import('./features/contabilidad/reporte-iva/reporte-iva.component').then(
            (m) => m.ReporteIvaComponent,
          ),
      },
      {
        path: 'gastos',
        loadComponent: () =>
          import('./features/gastos/index/index-gastos.component').then(
            (m) => m.IndexGastosComponent,
          ),
      },
      {
        path: 'gastos/nuevo',
        loadComponent: () =>
          import('./features/gastos/form/form-gasto.component').then(
            (m) => m.FormGastoComponent,
          ),
      },
      {
        path: 'gastos/editar/:id',
        loadComponent: () =>
          import('./features/gastos/form/form-gasto.component').then(
            (m) => m.FormGastoComponent,
          ),
      },
      {
        path: 'obligaciones',
        loadComponent: () =>
          import('./features/obligaciones/index/index-obligaciones.component').then(
            (m) => m.IndexObligacionesComponent,
          ),
      },
      {
        path: 'obligaciones/nuevo',
        loadComponent: () =>
          import('./features/obligaciones/form/form-obligacion.component').then(
            (m) => m.FormObligacionComponent,
          ),
      },
      {
        path: 'obligaciones/:id',
        loadComponent: () =>
          import('./features/obligaciones/detalle/detalle-obligacion.component').then(
            (m) => m.DetalleObligacionComponent,
          ),
      },

      // Inventario
      {
        path: 'inventario/stock',
        loadComponent: () =>
          import('./features/inventario/inventario/index/index-inventario.component').then(
            (m) => m.IndexInventarioComponent,
          ),
      },
      {
        // Manual de usuario: lo ve cualquier rol, no depende del menú.
        path: 'ayuda',
        loadComponent: () =>
          import('./features/ayuda/ayuda.component').then((m) => m.AyudaComponent),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/perfil/perfil.component').then(
            (m) => m.PerfilComponent,
          ),
      },
      {
        path: 'inventario/bodegas',
        loadComponent: () =>
          import(
            './features/inventario/bodegas/index/index-bodegas.component'
          ).then((m) => m.IndexBodegasComponent),
      },
      {
        path: 'inventario/lotes',
        loadComponent: () =>
          import('./features/inventario/lotes/index/index-lotes.component').then(
            (m) => m.IndexLotesComponent,
          ),
      },
      {
        path: 'inventario/seriales',
        loadComponent: () =>
          import('./features/inventario/seriales/index/index-seriales.component').then(
            (m) => m.IndexSerialesComponent,
          ),
      },
      {
        path: 'inventario/kardex',
        loadComponent: () =>
          import('./features/inventario/kardex/index/index-kardex.component').then(
            (m) => m.IndexKardexComponent,
          ),
      },
      {
        path: 'inventario/reconteos',
        loadComponent: () =>
          import('./features/inventario/reconteos/index/index-reconteos.component').then(
            (m) => m.IndexReconeosComponent,
          ),
      },

      // Operaciones
      {
        path: 'compras',
        loadComponent: () =>
          import('./features/compras/index/index-compras.component').then(
            (m) => m.IndexComprasComponent,
          ),
      },
      {
        path: 'compras/sugerido',
        loadComponent: () =>
          import('./features/compras/sugerido/sugerido-compra.component').then(
            (m) => m.SugeridoCompraComponent,
          ),
      },
      {
        path: 'compras/documentos-soporte',
        loadComponent: () =>
          import('./features/compras/documentos-soporte/index-documentos-soporte.component').then(
            (m) => m.IndexDocumentosSoporteComponent,
          ),
      },
      {
        path: 'compras/ordenes',
        loadComponent: () =>
          import('./features/compras/ordenes/index-ordenes.component').then(
            (m) => m.IndexOrdenesComponent,
          ),
      },
      {
        path: 'compras/nueva',
        loadComponent: () =>
          import('./features/compras/form/form-compra.component').then(
            (m) => m.FormCompraComponent,
          ),
      },
      {
        path: 'compras/:id/editar',
        loadComponent: () =>
          import('./features/compras/form/form-compra.component').then(
            (m) => m.FormCompraComponent,
          ),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./features/ventas/index/index-ventas.component').then(
            (m) => m.IndexVentasComponent,
          ),
      },
      {
        // Notas crédito/débito electrónicas (Factus v1).
        path: 'ventas/notas',
        loadComponent: () =>
          import('./features/ventas/nota-electronica/index-notas.component').then(
            (m) => m.IndexNotasComponent,
          ),
      },
      {
        path: 'ventas/notas/credito',
        data: { tipo: 'CREDITO' },
        loadComponent: () =>
          import('./features/ventas/nota-electronica/form-nota-credito.component').then(
            (m) => m.FormNotaCreditoComponent,
          ),
      },
      {
        path: 'ventas/notas/debito',
        data: { tipo: 'DEBITO' },
        loadComponent: () =>
          import('./features/ventas/nota-electronica/form-nota-credito.component').then(
            (m) => m.FormNotaCreditoComponent,
          ),
      },

      // Vendedores
      {
        path: 'vendedores',
        loadChildren: () =>
          import('./features/vendedores/vendedores.routes').then(
            (m) => m.VENDEDORES_ROUTES,
          ),
      },
      // Ventas › Facturas (Facturación ERP fuera del POS)
      {
        path: 'ventas/facturas',
        loadComponent: () =>
          import('./features/facturas-venta/index/index-facturas-venta.component').then(
            (m) => m.IndexFacturasVentaComponent,
          ),
      },
      {
        path: 'ventas/facturas/condiciones-pago',
        loadComponent: () =>
          import('./features/facturas-venta/condiciones/condiciones-pago.component').then(
            (m) => m.CondicionesPagoComponent,
          ),
      },
      {
        path: 'ventas/facturas/nueva',
        loadComponent: () =>
          import('./features/facturas-venta/form/form-factura-venta.component').then(
            (m) => m.FormFacturaVentaComponent,
          ),
      },
      {
        path: 'ventas/facturas/:id/editar',
        loadComponent: () =>
          import('./features/facturas-venta/form/form-factura-venta.component').then(
            (m) => m.FormFacturaVentaComponent,
          ),
      },
      {
        // La emitida se ve en el mismo formulario, en solo lectura.
        path: 'ventas/facturas/:id',
        loadComponent: () =>
          import('./features/facturas-venta/form/form-factura-venta.component').then(
            (m) => m.FormFacturaVentaComponent,
          ),
      },
      {
        path: 'cotizaciones',
        loadComponent: () =>
          import('./features/cotizaciones/index/index-cotizaciones.component').then(
            (m) => m.IndexCotizacionesComponent,
          ),
      },
      {
        path: 'cotizaciones/nueva',
        loadComponent: () =>
          import('./features/cotizaciones/form/form-cotizacion.component').then(
            (m) => m.FormCotizacionComponent,
          ),
      },
      {
        path: 'cotizaciones/editar/:id',
        loadComponent: () =>
          import('./features/cotizaciones/form/form-cotizacion.component').then(
            (m) => m.FormCotizacionComponent,
          ),
      },
      {
        path: 'devoluciones',
        loadComponent: () =>
          import('./features/devoluciones/index/index-devoluciones.component').then(
            (m) => m.IndexDevolucionesComponent,
          ),
      },
      {
        path: 'proyectos',
        loadComponent: () =>
          import('./features/proyectos/proyectos.component').then(
            (m) => m.ProyectosComponent,
          ),
      },
      {
        path: 'proyectos/:proyectoId/frentes',
        loadComponent: () =>
          import('./features/proyectos/frentes/frentes.component').then(
            (m) => m.FrentesComponent,
          ),
      },
      {
        path: 'asistencia-frente/digitacion',
        loadComponent: () =>
          import('./features/asistencia-frente/digitacion.component').then(
            (m) => m.DigitacionComponent,
          ),
      },
      {
        path: 'asistencia-frente/revision',
        loadComponent: () =>
          import('./features/asistencia-frente/revision.component').then(
            (m) => m.RevisionFrenteComponent,
          ),
      },
      {
        path: 'asistencia-frente/preliquidacion',
        loadComponent: () =>
          import('./features/asistencia-frente/preliquidacion.component').then(
            (m) => m.PreliquidacionFrenteComponent,
          ),
      },
      {
        path: 'laboral/configuracion',
        loadComponent: () =>
          import('./features/laboral/config-laboral.component').then(
            (m) => m.ConfigLaboralComponent,
          ),
      },
      {
        path: 'laboral/calendario',
        loadComponent: () =>
          import('./features/laboral/calendario-laboral.component').then(
            (m) => m.CalendarioLaboralComponent,
          ),
      },
      {
        path: 'mermas',
        loadComponent: () =>
          import('./features/mermas/index/index-mermas.component').then(
            (m) => m.IndexMermasComponent,
          ),
      },
      {
        path: 'obsequios',
        loadComponent: () =>
          import('./features/obsequios/index/index-obsequios.component').then(
            (m) => m.IndexObsequiosComponent,
          ),
      },
      {
        path: 'consumo-interno',
        loadComponent: () =>
          import(
            './features/consumo-interno/index/index-consumos-internos.component'
          ).then((m) => m.IndexConsumosInternosComponent),
      },
      {
        path: 'traslados',
        loadComponent: () =>
          import('./features/traslados/index/index-traslados.component').then(
            (m) => m.IndexTrasladosComponent,
          ),
      },
      {
        // Formulario plano (antes era un diálogo).
        path: 'traslados/nuevo',
        loadComponent: () =>
          import('./features/traslados/form/form-traslado.component').then(
            (m) => m.FormTrasladoComponent,
          ),
      },

      // Terceros (solo gestión, sin estado de cuenta)
      {
        path: 'terceros',
        loadComponent: () =>
          import('./features/terceros/index/index-terceros.component').then(
            (m) => m.IndexTercerosComponent,
          ),
      },
      {
        path: 'terceros/nuevo',
        loadComponent: () =>
          import('./features/terceros/form-plano/form-tercero-plano.component').then(
            (m) => m.FormTerceroPlanoComponent,
          ),
      },
      {
        path: 'terceros/editar/:id',
        loadComponent: () =>
          import('./features/terceros/form-plano/form-tercero-plano.component').then(
            (m) => m.FormTerceroPlanoComponent,
          ),
      },

      // Caja
      {
        path: 'caja/cajas',
        loadComponent: () =>
          import('./features/caja/cajas/index/index-cajas.component').then(
            (m) => m.IndexCajasComponent,
          ),
      },
      // Que entro a las cajas sin ser del turno: supervision, no bandeja de
      // pendientes. El origen ya es obligatorio al registrar.
      {
        path: 'caja/supervision',
        loadComponent: () =>
          import(
            './features/caja/supervision/supervision-retroactiva.component'
          ).then((m) => m.SupervisionRetroactivaComponent),
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
        loadComponent: () =>
          import('./features/sucursales/index/index-sucursales.component').then(
            (m) => m.IndexSucursalesComponent,
          ),
      },
      {
        path: 'admin/usuarios',
        loadComponent: () =>
          import('./features/usuarios/index/index-usuarios.component').then(
            (m) => m.IndexUsuariosComponent,
          ),
      },
      // Usuario en una página con pestañas (datos, sedes, permisos, descuentos).
      {
        path: 'admin/usuarios/nuevo',
        loadComponent: () =>
          import('./features/usuarios/pagina/usuario-pagina.component').then(
            (m) => m.UsuarioPaginaComponent,
          ),
      },
      {
        path: 'admin/usuarios/:id',
        loadComponent: () =>
          import('./features/usuarios/pagina/usuario-pagina.component').then(
            (m) => m.UsuarioPaginaComponent,
          ),
      },
      // La pantalla aparte de permisos pasó a la pestaña Permisos de la página.
      {
        path: 'admin/usuarios/:id/permisos',
        redirectTo: 'admin/usuarios/:id',
      },
      {
        path: 'admin/perfiles',
        loadComponent: () =>
          import('./features/perfiles/index/index-perfiles.component').then(
            (m) => m.IndexPerfilesComponent,
          ),
      },
      {
        path: 'admin/perfiles/:id',
        loadComponent: () =>
          import('./features/perfiles/form/form-perfil.component').then(
            (m) => m.FormPerfilComponent,
          ),
      },
      {
        // Sin ítem de menú: se llega por el escudo de la barra superior o la campana.
        path: 'autorizaciones',
        loadComponent: () =>
          import('./features/autorizaciones/autorizaciones.component').then(
            (m) => m.AutorizacionesComponent,
          ),
      },
      {
        path: 'admin/bitacora',
        loadComponent: () =>
          import('./features/bitacora/bitacora.component').then(
            (m) => m.BitacoraComponent,
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
        loadComponent: () =>
          import('./features/comisiones/config/index/index-comision-config.component').then(
            (m) => m.IndexComisionConfigComponent,
          ),
      },
      {
        path: 'comisiones/liquidaciones',
        loadComponent: () =>
          import('./features/comisiones/liquidaciones/index/index-liquidaciones.component').then(
            (m) => m.IndexLiquidacionesComponent,
          ),
      },

      // Nómina
      {
        path: 'nomina/config',
        loadComponent: () =>
          import('./features/nomina/config/nomina-config.component').then(
            (m) => m.NominaConfigComponent,
          ),
      },
      {
        path: 'nomina/empleados',
        loadComponent: () =>
          import('./features/nomina/empleados/index/index-empleados.component').then(
            (m) => m.IndexEmpleadosComponent,
          ),
      },
      {
        // F7 — carga de saldos iniciales (migración desde otro sistema).
        path: 'nomina/saldos-iniciales',
        loadComponent: () =>
          import('./features/nomina/saldos-iniciales/saldos-iniciales.component').then(
            (m) => m.SaldosInicialesComponent,
          ),
      },
      {
        // Alta de empleado (flujo nuevo): crea la identidad como tercero y de
        // ahí cae en la ficha para agregar el contrato.
        path: 'nomina/empleados/nuevo',
        loadComponent: () =>
          import('./features/nomina/empleados/nuevo/empleado-nuevo.component').then(
            (m) => m.EmpleadoNuevoComponent,
          ),
      },
      {
        // Ficha del empleado (maestro-detalle): identidad + tabs de contratos,
        // afiliaciones, retenciones y embargos.
        path: 'nomina/empleados/:id/ficha',
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
        loadComponent: () =>
          import('./features/nomina/contratos/index/index-contratos.component').then(
            (m) => m.IndexContratosComponent,
          ),
      },
      {
        // Catálogo de conceptos de nómina (Fase 3). Tarifas parametrizables
        // por vigencia, sin recompilar el motor.
        path: 'nomina/conceptos',
        loadComponent: () =>
          import('./features/nomina/conceptos/index/index-conceptos.component').then(
            (m) => m.IndexConceptosComponent,
          ),
      },
      {
        path: 'nomina/periodos',
        loadComponent: () =>
          import('./features/nomina/periodos/index/index-periodos.component').then(
            (m) => m.IndexPeriodosComponent,
          ),
      },
      {
        // PILA (Fase 6). Genera la planilla estructurada; el archivo plano por
        // operador es un export aparte.
        path: 'nomina/pila',
        loadComponent: () =>
          import('./features/nomina/pila/pila.component').then(
            (m) => m.PilaComponent,
          ),
      },
      {
        path: 'nomina/liquidacion',
        loadComponent: () =>
          import('./features/nomina/liquidacion/index/index-liquidacion.component').then(
            (m) => m.IndexLiquidacionComponent,
          ),
      },
      {
        // Listado de nóminas electrónicas emitidas (XML, anular, eliminar pruebas).
        path: 'nomina/electronica',
        loadComponent: () =>
          import('./features/nomina/electronica/index-nomina-electronica.component').then(
            (m) => m.IndexNominaElectronicaComponent,
          ),
      },

      // Asistencia
      {
        path: 'asistencia/turnos',
        loadComponent: () =>
          import('./features/asistencia/turnos/turnos.component').then(
            (m) => m.TurnosComponent,
          ),
      },
      {
        path: 'asistencia/marcaje',
        loadComponent: () =>
          import('./features/asistencia/marcaje/marcaje.component').then(
            (m) => m.MarcajeComponent,
          ),
      },
      {
        path: 'asistencia/revision',
        loadComponent: () =>
          import('./features/asistencia/revision/revision.component').then(
            (m) => m.RevisionAsistenciaComponent,
          ),
      },
      {
        path: 'asistencia/novedades',
        loadComponent: () =>
          import('./features/asistencia/novedades/novedades-asistencia.component').then(
            (m) => m.NovedadesAsistenciaComponent,
          ),
      },
      {
        path: 'asistencia/autorizaciones',
        loadComponent: () =>
          import('./features/asistencia/autorizaciones/autorizaciones.component').then(
            (m) => m.AutorizacionesComponent,
          ),
      },
      {
        path: 'nomina/preliquidacion',
        loadComponent: () =>
          import('./features/asistencia/cierre/preliquidacion.component').then(
            (m) => m.PreliquidacionComponent,
          ),
      },
      {
        path: 'nomina/prestaciones',
        loadComponent: () =>
          import('./features/nomina/prestaciones/prestaciones.component').then(
            (m) => m.PrestacionesComponent,
          ),
      },

      // Ventas de campo
      {
        path: 'ventas-campo',
        loadComponent: () =>
          import('./features/ventas-campo/index/index-ventas-campo.component').then(
            (m) => m.IndexVentasCampoComponent,
          ),
      },

      // Cartera
      {
        path: 'cartera',
        loadComponent: () =>
          import('./features/cartera/index/index-cartera.component').then(
            (m) => m.IndexCarteraComponent,
          ),
      },
      {
        path: 'cartera/reglas',
        loadComponent: () =>
          import('./features/cartera/reglas/reglas-credito.component').then(
            (m) => m.ReglasCreditoComponent,
          ),
      },
      {
        path: 'cartera/cliente/:id',
        loadComponent: () =>
          import('./features/cartera/ficha-cliente/ficha-cliente.component').then(
            (m) => m.FichaClienteComponent,
          ),
      },

      // Tesorería
      {
        path: 'tesoreria/cuentas-bancarias',
        loadComponent: () =>
          import('./features/tesoreria/cuentas-bancarias/index-cuentas-bancarias.component').then(
            (m) => m.IndexCuentasBancariasComponent,
          ),
      },
      {
        path: 'tesoreria/cuentas-bancarias/nueva',
        loadComponent: () =>
          import('./features/tesoreria/cuentas-bancarias/form/form-cuenta-bancaria.component').then(
            (m) => m.FormCuentaBancariaComponent,
          ),
      },
      {
        path: 'tesoreria/cuentas-bancarias/:id',
        loadComponent: () =>
          import('./features/tesoreria/cuentas-bancarias/form/form-cuenta-bancaria.component').then(
            (m) => m.FormCuentaBancariaComponent,
          ),
      },
      {
        path: 'tesoreria/egresos',
        loadComponent: () =>
          import('./features/tesoreria/egresos/index-egresos.component').then(
            (m) => m.IndexEgresosComponent,
          ),
      },
      {
        path: 'tesoreria/recaudos',
        loadComponent: () =>
          import('./features/tesoreria/recaudos/index-recaudos.component').then(
            (m) => m.IndexRecaudosComponent,
          ),
      },
      {
        path: 'tesoreria/conciliacion',
        loadComponent: () =>
          import('./features/tesoreria/conciliacion/index-conciliacion.component').then(
            (m) => m.IndexConciliacionComponent,
          ),
      },
      // Traslados de FONDOS (plata). No confundir con /traslados, que mueve
      // inventario entre sucursales.
      {
        path: 'tesoreria/traslados-fondos',
        loadComponent: () =>
          import('./features/traslados-fondos/index/index-traslados-fondos.component').then(
            (m) => m.IndexTrasladosFondosComponent,
          ),
      },

      // Contabilidad — Plan de Cuentas y Asientos
      {
        path: 'contabilidad/plan-cuentas',
        loadComponent: () =>
          import('./features/contabilidad/plan-cuentas/plan-cuentas.component').then(
            (m) => m.PlanCuentasComponent,
          ),
      },
      {
        path: 'contabilidad/asientos',
        loadComponent: () =>
          import('./features/contabilidad/asientos/asientos.component').then(
            (m) => m.AsientosComponent,
          ),
      },
      // Notas contables (comprobante de diario CD): el contador las elabora,
      // las deja en borrador y las contabiliza después.
      {
        path: 'contabilidad/notas',
        loadComponent: () =>
          import('./features/contabilidad/notas-contables/index/index-notas-contables.component').then(
            (m) => m.IndexNotasContablesComponent,
          ),
      },
      // Antes de ':id': si no, 'plantillas' se tomaría como id de una nota.
      {
        path: 'contabilidad/notas/plantillas',
        loadComponent: () =>
          import('./features/contabilidad/notas-contables/plantillas/index-plantillas-nota.component').then(
            (m) => m.IndexPlantillasNotaComponent,
          ),
      },
      {
        path: 'contabilidad/notas/nueva',
        loadComponent: () =>
          import('./features/contabilidad/notas-contables/form/form-nota-contable.component').then(
            (m) => m.FormNotaContableComponent,
          ),
      },
      {
        path: 'contabilidad/notas/:id',
        loadComponent: () =>
          import('./features/contabilidad/notas-contables/form/form-nota-contable.component').then(
            (m) => m.FormNotaContableComponent,
          ),
      },
      {
        path: 'contabilidad/revision',
        loadComponent: () =>
          import('./features/contabilidad/revision-asientos/revision-asientos.component').then(
            (m) => m.RevisionAsientosComponent,
          ),
      },
      {
        path: 'contabilidad/importar',
        loadComponent: () =>
          import('./features/contabilidad/importar/importar-datos.component').then(
            (m) => m.ImportarDatosComponent,
          ),
      },
      {
        path: 'contabilidad/declaraciones',
        loadComponent: () =>
          import('./features/contabilidad/declaraciones/declaraciones.component').then(
            (m) => m.DeclaracionesComponent,
          ),
      },
      {
        path: 'contabilidad/libros',
        loadComponent: () =>
          import('./features/contabilidad/libros/libros-contables.component').then(
            (m) => m.LibrosContablesComponent,
          ),
      },
      {
        path: 'contabilidad/balance-general',
        loadComponent: () =>
          import('./features/contabilidad/balance-general/balance-general.component').then(
            (m) => m.BalanceGeneralComponent,
          ),
      },
      {
        path: 'contabilidad/conceptos-caja',
        loadComponent: () =>
          import('./features/contabilidad/conceptos-caja/conceptos-caja.component').then(
            (m) => m.ConceptosCajaComponent,
          ),
      },
      {
        path: 'contabilidad/saldos-iniciales',
        loadComponent: () =>
          import('./features/contabilidad/saldos-iniciales/saldos-iniciales.component').then(
            (m) => m.SaldosInicialesComponent,
          ),
      },
      {
        path: 'contabilidad/centros-costo',
        loadComponent: () =>
          import('./features/contabilidad/centros-costo/centros-costo.component').then(
            (m) => m.CentrosCostoComponent,
          ),
      },
      {
        path: 'contabilidad/periodos',
        loadComponent: () =>
          import('./features/contabilidad/periodos-contables/periodos-contables.component').then(
            (m) => m.PeriodosContablesComponent,
          ),
      },
      {
        path: 'contabilidad/activos-fijos/informe',
        loadComponent: () =>
          import('./features/contabilidad/activos-fijos/informe/informe-activos.component').then(
            (m) => m.InformeActivosComponent,
          ),
      },
      {
        path: 'contabilidad/activos-fijos/:id',
        loadComponent: () =>
          import('./features/contabilidad/activos-fijos/ficha/ficha-activo.component').then(
            (m) => m.FichaActivoComponent,
          ),
      },
      {
        path: 'contabilidad/activos-fijos',
        loadComponent: () =>
          import('./features/contabilidad/activos-fijos/activos-fijos.component').then(
            (m) => m.ActivosFijosComponent,
          ),
      },
      {
        path: 'contabilidad/parametrizacion',
        loadComponent: () =>
          import('./features/contabilidad/parametrizacion/parametrizacion-contable.component').then(
            (m) => m.ParametrizacionContableComponent,
          ),
      },
      {
        path: 'contabilidad/balance-prueba',
        loadComponent: () =>
          import('./features/contabilidad/balance-prueba/balance-prueba.component').then(
            (m) => m.BalancePruebaComponent,
          ),
      },
      {
        path: 'contabilidad/herramientas',
        loadComponent: () =>
          import('./features/contabilidad/herramientas/herramientas-contador.component').then(
            (m) => m.HerramientasContadorComponent,
          ),
      },
      {
        path: 'contabilidad/categorias-contables',
        loadComponent: () =>
          import('./features/contabilidad/categorias-contables/categorias-contables.component').then(
            (m) => m.CategoriasContablesComponent,
          ),
      },
      {
        path: 'contabilidad/tarifas-retencion',
        loadComponent: () =>
          import('./features/contabilidad/tarifas-retencion/tarifas-retencion.component').then(
            (m) => m.TarifasRetencionComponent,
          ),
      },
      // E8: wizard de cierre de ejercicio + distribución de utilidades
      {
        path: 'contabilidad/cierre-anual',
        loadComponent: () =>
          import('./features/contabilidad/cierre-anual/cierre-anual.component').then(
            (m) => m.CierreAnualComponent,
          ),
      },
      // E9: conciliación bancaria (extracto vs libro)
      {
        path: 'contabilidad/conciliacion',
        loadComponent: () =>
          import('./features/contabilidad/conciliacion/conciliacion-bancaria.component').then(
            (m) => m.ConciliacionBancariaComponent,
          ),
      },
      // E10: estados financieros NIIF (patrimonio + flujo de efectivo)
      {
        path: 'contabilidad/eeff',
        loadComponent: () =>
          import('./features/contabilidad/eeff/eeff.component').then(
            (m) => m.EeffComponent,
          ),
      },
      // E11: información exógena DIAN
      {
        path: 'contabilidad/exogena',
        loadComponent: () =>
          import('./features/contabilidad/exogena/exogena.component').then(
            (m) => m.ExogenaComponent,
          ),
      },

      // Comprobantes de caja
      {
        path: 'comprobantes',
        loadComponent: () =>
          import('./features/comprobantes/index/index-comprobantes.component').then(
            (m) => m.IndexComprobantesComponent,
          ),
      },
      // Comprobante contable (formulario plano)
      {
        path: 'comprobantes/contable/nuevo',
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
        path: 'reportes/gerencial',
        loadComponent: () =>
          import('./features/reportes/gerencial/reporte-gerencial.component').then(
            (m) => m.ReporteGerencialComponent,
          ),
      },
      {
        path: 'reportes/cartera',
        loadComponent: () =>
          import('./features/reportes/cartera/reporte-cartera.component').then(
            (m) => m.ReporteCarteraComponent,
          ),
      },
      {
        path: 'reportes/carritos-abandonados',
        loadComponent: () =>
          import('./features/reportes/carritos-abandonados/reporte-carritos-abandonados.component').then(
            (m) => m.ReporteCarritosAbandonadosComponent,
          ),
      },
      {
        path: 'reportes/gastos',
        loadComponent: () =>
          import('./features/reportes/gastos/reporte-gastos.component').then(
            (m) => m.ReporteGastosComponent,
          ),
      },
      {
        path: 'reportes/kardex',
        loadComponent: () =>
          import('./features/reportes/kardex/reporte-kardex.component').then(
            (m) => m.ReporteKardexComponent,
          ),
      },
      {
        path: 'reportes/facturacion-electronica',
        loadComponent: () =>
          import('./features/reportes/facturacion-electronica/reporte-facturacion-electronica.component').then(
            (m) => m.ReporteFacturacionElectronicaComponent,
          ),
      },
      {
        path: 'reportes/avanzados',
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
