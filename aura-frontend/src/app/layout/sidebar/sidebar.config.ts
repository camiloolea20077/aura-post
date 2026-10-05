import { SidebarMenuGroup } from '../../shared/interfaces';

export const SIDEBAR_MENU: SidebarMenuGroup[] = [
  // ── Principal ───────────────────────────────────────────────────────────────
  {
    label: 'Principal',
    icon: 'pi pi-home',
    defaultOpen: true,
    alwaysOpen: true,
    items: [
      {
        label: 'Dashboard',
        codigo: 'principal.dashboard',
        icon: 'pi pi-home',
        route: '/dashboard',
      },
      {
        label: 'Punto de Venta',
        codigo: 'principal.punto-de-venta',
        icon: 'pi pi-shopping-cart',
        route: '/pos',
        badge: 'POS',
        highlight: true,
      },
    ],
  },

  // ── Catálogo ────────────────────────────────────────────────────────────────
  {
    label: 'Catálogo',
    icon: 'pi pi-box',
    items: [
      {
        label: 'Productos',
        codigo: 'catalogo.productos',
        icon: 'pi pi-box',
        route: '/catalogo/productos',
      },
      {
        label: 'Categorías',
        codigo: 'catalogo.categorias',
        icon: 'pi pi-th-large',
        route: '/catalogo/categorias',
      },
      {
        label: 'Marcas',
        codigo: 'catalogo.marcas',
        icon: 'pi pi-tag',
        route: '/catalogo/marcas',
      },
      {
        label: 'Unidades',
        codigo: 'catalogo.unidades',
        icon: 'pi pi-chart-bar',
        route: '/catalogo/unidades',
      },
      {
        label: 'Presentaciones',
        codigo: 'catalogo.presentaciones',
        icon: 'pi pi-sitemap',
        route: '/catalogo/presentaciones',
      },
      {
        label: 'Composiciones',
        codigo: 'catalogo.composiciones',
        icon: 'pi pi-cog',
        route: '/catalogo/composiciones',
      },
      {
        label: 'Etiquetas',
        codigo: 'catalogo.etiquetas',
        icon: 'pi pi-bookmark',
        route: '/catalogo/etiquetas',
      },
    ],
  },

  // ── Precios ─────────────────────────────────────────────────────────────────
  {
    label: 'Precios',
    icon: 'pi pi-tags',
    items: [
      {
        label: 'Listas de Precio',
        codigo: 'precios.listas-de-precio',
        icon: 'pi pi-list',
        route: '/precios/listas',
      },
      {
        label: 'Precio Productos',
        codigo: 'precios.precio-productos',
        icon: 'pi pi-tags',
        route: '/precios/productos',
      },
      {
        label: 'Descuentos',
        codigo: 'precios.descuentos',
        icon: 'pi pi-percentage',
        route: '/precios/descuentos',
      },
    ],
  },

  // ── Inventario ──────────────────────────────────────────────────────────────
  // Incluye movimientos físicos: reconteos, mermas y traslados
  {
    label: 'Inventario',
    icon: 'pi pi-database',
    items: [
      {
        label: 'Stock',
        codigo: 'inventario.stock',
        icon: 'pi pi-database',
        route: '/inventario/stock',
      },
      {
        label: 'Bodegas',
        codigo: 'inventario.bodegas',
        icon: 'pi pi-building',
        route: '/inventario/bodegas',
      },
      {
        label: 'Lotes',
        codigo: 'inventario.lotes',
        icon: 'pi pi-calendar',
        route: '/inventario/lotes',
      },
      {
        label: 'Seriales',
        codigo: 'inventario.seriales',
        icon: 'pi pi-barcode',
        route: '/inventario/seriales',
      },
      {
        label: 'Kardex',
        codigo: 'inventario.kardex',
        icon: 'pi pi-history',
        route: '/inventario/kardex',
      },
      {
        label: 'Reconteos',
        codigo: 'inventario.reconteos',
        icon: 'pi pi-warehouse',
        route: '/inventario/reconteos',
      },
      {
        label: 'Mermas',
        codigo: 'inventario.mermas',
        icon: 'pi pi-trash',
        route: '/mermas',
      },
      {
        label: 'Obsequios',
        codigo: 'inventario.obsequios',
        icon: 'pi pi-gift',
        route: '/obsequios',
      },
      {
        label: 'Consumo interno',
        codigo: 'inventario.consumo-interno',
        icon: 'pi pi-building',
        route: '/consumo-interno',
      },
      {
        label: 'Traslados',
        codigo: 'inventario.traslados',
        icon: 'pi pi-arrows-h',
        route: '/traslados',
      },
    ],
  },

  // ── Compras ─────────────────────────────────────────────────────────────────
  {
    label: 'Compras',
    icon: 'pi pi-truck',
    items: [
      {
        label: 'Compras',
        codigo: 'compras.compras',
        icon: 'pi pi-truck',
        route: '/compras',
      },
      {
        label: 'Órdenes de Compra',
        codigo: 'compras.ordenes-de-compra',
        icon: 'pi pi-file-edit',
        route: '/compras/ordenes',
      },
      {
        // normalize('Sugerido de Compra') = 'sugerido-de-compra'
        // (docs/sql/menu_submodulos_f2_f4.sql en el backend).
        label: 'Sugerido de Compra',
        codigo: 'compras.sugerido-de-compra',
        icon: 'pi pi-shopping-cart',
        route: '/compras/sugerido',
      },
      {
        // normalize('Documentos Soporte') = 'documentos-soporte'
        // (docs/sql/menu_submodulo_documentos_soporte.sql en el backend).
        label: 'Documentos Soporte',
        codigo: 'compras.documentos-soporte',
        icon: 'pi pi-verified',
        route: '/compras/documentos-soporte',
      },
    ],
  },

  // ── Ventas ──────────────────────────────────────────────────────────────────
  {
    label: 'Ventas',
    icon: 'pi pi-receipt',
    items: [
      {
        label: 'Facturas',
        codigo: 'ventas.facturas',
        icon: 'pi pi-file',
        route: '/ventas/facturas',
      },
      {
        label: 'Ventas',
        codigo: 'ventas.ventas',
        icon: 'pi pi-receipt',
        route: '/ventas',
      },
      {
        label: 'Ventas de Campo',
        codigo: 'ventas.ventas-de-campo',
        icon: 'pi pi-car',
        route: '/ventas-campo',
      },
      {
        label: 'Notas Crédito/Débito',
        codigo: 'ventas.notas-credito/debito',
        icon: 'pi pi-file-edit',
        route: '/ventas/notas',
      },
      {
        label: 'Cotizaciones',
        codigo: 'ventas.cotizaciones',
        icon: 'pi pi-file',
        route: '/cotizaciones',
      },
      {
        label: 'Devoluciones',
        codigo: 'ventas.devoluciones',
        icon: 'pi pi-replay',
        route: '/devoluciones',
      },
    ],
  },

  // ── Cuentas ─────────────────────────────────────────────────────────────────
  {
    label: 'Cuentas',
    icon: 'pi pi-money-bill',
    items: [
      {
        label: 'Cuentas por Cobrar',
        codigo: 'cuentas.cuentas-por-cobrar',
        icon: 'pi pi-arrow-circle-down',
        route: '/cuentas/cuentas-por-cobrar',
      },
      {
        label: 'Cuentas por Pagar',
        codigo: 'cuentas.cuentas-por-pagar',
        icon: 'pi pi-arrow-circle-up',
        route: '/cuentas/cuentas-por-pagar',
      },
    ],
  },

  // ── Vendedores ────────────────────────────────────────────────────────────────
  {
    label: 'Vendedores',
    icon: 'pi pi-user-plus',
    items: [
      {
        label: 'Vendedores',
        codigo: 'vendedores.vendedores',
        icon: 'pi pi-users',
        route: '/vendedores/vendedores',
      },
      {
        label: 'Locales',
        codigo: 'vendedores.locales',
        icon: 'pi pi-map-marker',
        route: '/vendedores/locales',
      },
      {
        label: 'Rutas',
        codigo: 'vendedores.rutas',
        icon: 'pi pi-map',
        route: '/vendedores/rutas',
      },
      {
        label: 'Visitas',
        codigo: 'vendedores.visitas',
        icon: 'pi pi-calendar',
        route: '/vendedores/visitas',
      },
      {
        label: 'Mi Perfil',
        codigo: 'vendedores.mi-perfil',
        icon: 'pi pi-user',
        route: '/vendedores/personal',
        tipos: ['VENDEDOR'],
      },
      {
        label: 'Escanear QR',
        codigo: 'vendedores.escanear-qr',
        icon: 'pi pi-qrcode',
        route: '/vendedores/escanear',
        tipos: ['VENDEDOR'],
      },
    ],
  },

  // ── Cartera ──────────────────────────────────────────────────────────────────
  {
    label: 'Cartera',
    icon: 'pi pi-chart-line',
    items: [
      {
        label: 'Cartera',
        codigo: 'cartera.cartera',
        icon: 'pi pi-chart-line',
        route: '/cartera',
        highlight: true,
      },
    ],
  },

  // ── Tesorería ────────────────────────────────────────────────────────────────
  {
    label: 'Tesorería',
    icon: 'pi pi-wallet',
    items: [
      {
        label: 'Cuentas Bancarias',
        codigo: 'tesoreria.cuentas-bancarias',
        icon: 'pi pi-credit-card',
        route: '/tesoreria/cuentas-bancarias',
      },
      {
        label: 'Egresos',
        codigo: 'tesoreria.egresos',
        icon: 'pi pi-arrow-up-right',
        route: '/tesoreria/egresos',
      },
      {
        label: 'Recaudos',
        codigo: 'tesoreria.recaudos',
        icon: 'pi pi-arrow-down-left',
        route: '/tesoreria/recaudos',
      },
      {
        label: 'Conciliación',
        codigo: 'tesoreria.conciliacion',
        icon: 'pi pi-check-square',
        route: '/tesoreria/conciliacion',
      },
      // Mueve plata entre cuentas propias: caja menor, consignaciones. No
      // confundir con "Traslados" de inventario, que está en otro módulo.
      {
        label: 'Traslados de Fondos',
        codigo: 'tesoreria.traslados-de-fondos',
        icon: 'pi pi-sync',
        route: '/tesoreria/traslados-fondos',
      },
      {
        label: 'Obligaciones',
        // Submódulo propio desde V192 (antes no lo tenía y quedaba oculta).
        codigo: 'tesoreria.obligaciones',
        icon: 'pi pi-money-bill',
        route: '/obligaciones',
      },
    ],
  },

  // ── Caja ─────────────────────────────────────────────────────────────────────
  {
    label: 'Caja',
    icon: 'pi pi-file-check',
    items: [
      {
        label: 'Comprobantes',
        codigo: 'caja.comprobantes',
        icon: 'pi pi-file-check',
        route: '/comprobantes',
      },
      {
        label: 'Usuarios',
        codigo: 'caja.usuarios',
        icon: 'pi pi-user',
        route: '/admin/usuarios',
      },
      {
        label: 'Perfiles y Permisos',
        codigo: 'caja.perfiles',
        icon: 'pi pi-lock',
        route: '/admin/perfiles',
      },
      // Quién anuló, editó, autorizó o cambió qué (V192).
      {
        label: 'Bitácora',
        codigo: 'caja.bitacora',
        icon: 'pi pi-history',
        route: '/admin/bitacora',
      },
      // Que entro a las cajas sin ser del turno. No es una bandeja de
      // pendientes: es donde el administrador revisa el rastro.
      {
        label: 'Supervision de Caja',
        codigo: 'caja.supervision-de-caja',
        icon: 'pi pi-shield',
        route: '/caja/supervision',
      },
      {
        label: 'Cajas',
        codigo: 'caja.cajas',
        icon: 'pi pi-desktop',
        route: '/caja/cajas',
      },
      {
        label: 'Turnos',
        codigo: 'caja.turnos',
        icon: 'pi pi-clock',
        route: '/caja/turnos',
      },
    ],
  },

  // ── Contabilidad ────────────────────────────────────────────────────────────
  // En el sidebar es un solo enlace al Centro de Contabilidad (/contabilidad).
  // Los ítems NO se borran: siguen pasando por filtrarMenuPorPermisos (su label
  // es el código del submódulo) y el centro los muestra agrupados. Para agregar
  // una pantalla: ítem aquí + descripción/grupo en centro-contabilidad.config.ts.
  {
    label: 'Contabilidad',
    icon: 'pi pi-book',
    hubRoute: '/contabilidad',
    items: [
      {
        label: 'Plan de Cuentas',
        codigo: 'contabilidad.plan-de-cuentas',
        icon: 'pi pi-list',
        route: '/contabilidad/plan-cuentas',
      },
      {
        label: 'Asientos Contables',
        codigo: 'contabilidad.asientos-contables',
        icon: 'pi pi-book',
        route: '/contabilidad/asientos',
      },
      {
        // El label define el submódulo: normalize('Notas Contables') = 'notas-contables'
        // (docs/sql/menu_submodulo_notas_contables.sql en el backend).
        label: 'Notas Contables',
        codigo: 'contabilidad.notas-contables',
        icon: 'pi pi-file-edit',
        route: '/contabilidad/notas',
      },
      {
        label: 'Revisión de Comprobantes',
        codigo: 'contabilidad.revision-de-comprobantes',
        icon: 'pi pi-check-square',
        route: '/contabilidad/revision',
      },
      {
        label: 'Conceptos de Caja',
        codigo: 'contabilidad.conceptos-de-caja',
        icon: 'pi pi-tags',
        route: '/contabilidad/conceptos-caja',
      },
      {
        label: 'Saldos Iniciales',
        codigo: 'contabilidad.saldos-iniciales',
        icon: 'pi pi-database',
        route: '/contabilidad/saldos-iniciales',
      },
      {
        label: 'Centros de Costo',
        codigo: 'contabilidad.centros-de-costo',
        icon: 'pi pi-sitemap',
        route: '/contabilidad/centros-costo',
      },
      {
        label: 'Períodos Contables',
        codigo: 'contabilidad.periodos-contables',
        icon: 'pi pi-lock',
        route: '/contabilidad/periodos',
      },
      {
        label: 'Resultados del Período',
        codigo: 'contabilidad.resultados-del-periodo',
        icon: 'pi pi-chart-line',
        route: '/contabilidad/cierre',
      },
      {
        label: 'Balance General',
        codigo: 'contabilidad.balance-general',
        icon: 'pi pi-chart-bar',
        route: '/contabilidad/balance-general',
      },
      {
        // normalize('Libros Contables') = 'libros-contables'
        // (docs/sql/menu_submodulo_libros_contables.sql en el backend).
        label: 'Libros Contables',
        codigo: 'contabilidad.libros-contables',
        icon: 'pi pi-book',
        route: '/contabilidad/libros',
      },
      {
        // normalize('Declaraciones') = 'declaraciones'
        // (docs/sql/menu_submodulo_declaraciones.sql en el backend).
        label: 'Declaraciones',
        codigo: 'contabilidad.declaraciones',
        icon: 'pi pi-file-edit',
        route: '/contabilidad/declaraciones',
      },
      {
        // normalize('Importar Datos') = 'importar-datos'
        // (docs/sql/menu_submodulo_importar_datos.sql en el backend).
        label: 'Importar Datos',
        codigo: 'contabilidad.importar-datos',
        icon: 'pi pi-upload',
        route: '/contabilidad/importar',
      },
      {
        label: 'Estado de Cuenta',
        codigo: 'contabilidad.estado-de-cuenta',
        icon: 'pi pi-file-edit',
        route: '/contabilidad/estado-cuenta',
      },
      {
        label: 'Reporte IVA',
        codigo: 'contabilidad.reporte-iva',
        icon: 'pi pi-percentage',
        route: '/contabilidad/reporte-iva',
      },
      {
        label: 'Gastos',
        codigo: 'contabilidad.gastos',
        icon: 'pi pi-wallet',
        route: '/gastos',
      },
      {
        label: 'Activos Fijos',
        codigo: 'contabilidad.activos-fijos',
        icon: 'pi pi-building',
        route: '/contabilidad/activos-fijos',
      },
      {
        label: 'Categorías Contables',
        codigo: 'contabilidad.categorias-contables',
        icon: 'pi pi-sitemap',
        route: '/contabilidad/categorias-contables',
      },
      {
        // Fase 4: submódulos en docs/sql/menu_submodulos_f2_f4.sql (backend).
        label: 'Parametrización Contable',
        codigo: 'contabilidad.parametrizacion-contable',
        icon: 'pi pi-sliders-h',
        route: '/contabilidad/parametrizacion',
      },
      {
        label: 'Balance de Prueba',
        codigo: 'contabilidad.balance-de-prueba',
        icon: 'pi pi-list-check',
        route: '/contabilidad/balance-prueba',
      },
      {
        label: 'Herramientas del Contador',
        codigo: 'contabilidad.herramientas-del-contador',
        icon: 'pi pi-wrench',
        route: '/contabilidad/herramientas',
      },
      {
        label: 'Tarifas Retención',
        codigo: 'contabilidad.tarifas-retencion',
        icon: 'pi pi-percentage',
        route: '/contabilidad/tarifas-retencion',
      },
      {
        label: 'Conciliación Bancaria',
        codigo: 'contabilidad.conciliacion-bancaria',
        icon: 'pi pi-sync',
        route: '/contabilidad/conciliacion',
      },
      {
        label: 'Cierre Anual',
        codigo: 'contabilidad.cierre-anual',
        icon: 'pi pi-calendar',
        route: '/contabilidad/cierre-anual',
      },
      {
        label: 'Estados Financieros',
        codigo: 'contabilidad.estados-financieros',
        icon: 'pi pi-chart-pie',
        route: '/contabilidad/eeff',
      },
      {
        label: 'Exógena DIAN',
        codigo: 'contabilidad.exogena-dian',
        icon: 'pi pi-file-excel',
        route: '/contabilidad/exogena',
      },
    ],
  },

  // ── Recursos Humanos ────────────────────────────────────────────────────────
  // Como Contabilidad: en el sidebar es un solo enlace al Centro de Recursos
  // Humanos (/recursos-humanos). Los ítems siguen pasando por
  // filtrarMenuPorPermisos y el centro los agrupa (Gestión / Asistencia /
  // Parámetros) con centro-rrhh.config.ts. Pantalla nueva: ítem aquí +
  // descripción y grupo allá.
  {
    label: 'Recursos Humanos',
    icon: 'pi pi-id-card',
    hubRoute: '/recursos-humanos',
    items: [
      // Gestión
      {
        label: 'Empleados',
        codigo: 'recursos-humanos.empleados',
        icon: 'pi pi-users',
        route: '/nomina/empleados',
      },
      {
        label: 'Saldos iniciales',
        codigo: 'recursos-humanos.saldos-iniciales',
        icon: 'pi pi-database',
        route: '/nomina/saldos-iniciales',
      },
      {
        label: 'Proyectos y Frentes',
        codigo: 'recursos-humanos.proyectos-y-frentes',
        icon: 'pi pi-building',
        route: '/proyectos',
      },
      {
        label: 'Conceptos',
        codigo: 'recursos-humanos.conceptos',
        icon: 'pi pi-sliders-h',
        route: '/nomina/conceptos',
      },
      {
        label: 'Períodos',
        codigo: 'recursos-humanos.periodos',
        icon: 'pi pi-calendar',
        route: '/nomina/periodos',
      },
      {
        label: 'Liquidación Nómina',
        codigo: 'recursos-humanos.liquidacion-nomina',
        icon: 'pi pi-calculator',
        route: '/nomina/liquidacion',
      },
      {
        label: 'Preliquidación / Auditoría',
        codigo: 'recursos-humanos.preliquidacion-auditoria',
        icon: 'pi pi-verified',
        route: '/nomina/preliquidacion',
      },
      {
        label: 'Nómina Electrónica',
        codigo: 'recursos-humanos.nomina-electronica',
        icon: 'pi pi-file-o',
        route: '/nomina/electronica',
      },
      {
        label: 'PILA',
        codigo: 'recursos-humanos.pila',
        icon: 'pi pi-shield',
        route: '/nomina/pila',
      },
      {
        label: 'Prestaciones',
        codigo: 'recursos-humanos.prestaciones',
        icon: 'pi pi-gift',
        route: '/nomina/prestaciones',
      },
      {
        label: 'Comisiones',
        codigo: 'recursos-humanos.comisiones',
        icon: 'pi pi-percentage',
        route: '/comisiones/configuracion',
      },
      {
        label: 'Liquidar Comisiones',
        codigo: 'recursos-humanos.liquidar-comisiones',
        icon: 'pi pi-wallet',
        route: '/comisiones/liquidaciones',
      },
      // Asistencia
      {
        label: 'Digitación Asistencia',
        codigo: 'recursos-humanos.digitacion-asistencia',
        icon: 'pi pi-pencil',
        route: '/asistencia-frente/digitacion',
      },
      {
        label: 'Revisión Asistencia (Frente)',
        codigo: 'recursos-humanos.revision-asistencia-frente',
        icon: 'pi pi-check-square',
        route: '/asistencia-frente/revision',
      },
      {
        label: 'Preliquidación (Frente)',
        codigo: 'recursos-humanos.preliquidacion-frente',
        icon: 'pi pi-calculator',
        route: '/asistencia-frente/preliquidacion',
      },
      {
        label: 'Turnos Empleado',
        codigo: 'recursos-humanos.turnos-empleado',
        icon: 'pi pi-clock',
        route: '/asistencia/turnos',
      },
      {
        label: 'Marcaje',
        codigo: 'recursos-humanos.marcaje',
        icon: 'pi pi-stopwatch',
        route: '/asistencia/marcaje',
      },
      {
        label: 'Revisión asistencia',
        codigo: 'recursos-humanos.revision-asistencia',
        icon: 'pi pi-check-square',
        route: '/asistencia/revision',
      },
      {
        label: 'Novedades asistencia',
        codigo: 'recursos-humanos.novedades-asistencia',
        icon: 'pi pi-bolt',
        route: '/asistencia/novedades',
      },
      {
        label: 'Autorizaciones',
        codigo: 'recursos-humanos.autorizaciones',
        icon: 'pi pi-shield',
        route: '/asistencia/autorizaciones',
      },
      // Parámetros
      {
        label: 'Configuración laboral',
        codigo: 'recursos-humanos.configuracion-laboral',
        icon: 'pi pi-sliders-h',
        route: '/laboral/configuracion',
      },
      {
        label: 'Calendario laboral',
        codigo: 'recursos-humanos.calendario-laboral',
        icon: 'pi pi-calendar',
        route: '/laboral/calendario',
      },
      {
        label: 'Config. Nómina',
        codigo: 'recursos-humanos.config-nomina',
        icon: 'pi pi-cog',
        route: '/nomina/config',
      },
    ],
  },

  // ── Reportes ────────────────────────────────────────────────────────────────
  {
    label: 'Reportes',
    icon: 'pi pi-chart-bar',
    items: [
      {
        label: 'Reporte gerencial',
        codigo: 'reportes.reporte-gerencial',
        icon: 'pi pi-shield',
        route: '/reportes/gerencial',
      },
      {
        label: 'Ventas',
        codigo: 'reportes.ventas',
        icon: 'pi pi-chart-line',
        route: '/reportes/ventas',
      },
      {
        label: 'Inventario',
        codigo: 'reportes.inventario',
        icon: 'pi pi-chart-pie',
        route: '/reportes/inventario',
      },
      {
        label: 'Estado de cuenta Reporte',
        codigo: 'reportes.estado-de-cuenta-reporte',
        icon: 'pi pi-users',
        route: '/reportes/cartera',
      },
      {
        label: 'Gastos Reporte',
        codigo: 'reportes.gastos-reporte',
        icon: 'pi pi-wallet',
        route: '/reportes/gastos',
      },
      {
        label: 'Movimiento de inventario',
        codigo: 'reportes.movimiento-de-inventario',
        icon: 'pi pi-box',
        route: '/reportes/kardex',
      },
      {
        label: 'Facturación Electrónica',
        codigo: 'reportes.facturacion-electronica',
        icon: 'pi pi-file-export',
        route: '/reportes/facturacion-electronica',
      },
      {
        // normalize('Carritos Abandonados') = 'carritos-abandonados'
        // (docs/sql/menu_submodulo_carritos_abandonados.sql en el backend).
        label: 'Carritos Abandonados',
        codigo: 'reportes.carritos-abandonados',
        icon: 'pi pi-shopping-cart',
        route: '/reportes/carritos-abandonados',
      },
      {
        label: 'Reportes Avanzados',
        codigo: 'reportes.reportes-avanzados',
        icon: 'pi pi-chart-bar',
        route: '/reportes/avanzados',
      },
    ],
  },

  // ── Configuración ───────────────────────────────────────────────────────────
  // Maestros del sistema: contactos, cajas y estructura organizacional
  {
    label: 'Terceros y Sucursales',
    icon: 'pi pi-sliders-h',
    items: [
      {
        label: 'Terceros',
        codigo: 'terceros-y-sucursales.terceros',
        icon: 'pi pi-users',
        route: '/terceros',
      },
      {
        label: 'Sucursales',
        codigo: 'terceros-y-sucursales.sucursales',
        icon: 'pi pi-building',
        route: '/admin/sucursales',
      },
    ],
  },
];
