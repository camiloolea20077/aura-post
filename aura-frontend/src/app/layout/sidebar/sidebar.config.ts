export interface SidebarMenuItem {
  label: string;
  icon: string;
  route?: string;
  badge?: string;
  highlight?: boolean;
  roles?: string[];
}

export interface SidebarMenuGroup {
  label: string;
  icon: string;
  items: SidebarMenuItem[];
  roles?: string[];
  defaultOpen?: boolean;
  alwaysOpen?: boolean;
}

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
        icon: 'pi pi-home',
        route: '/dashboard',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Punto de Venta',
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
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      { label: 'Productos', icon: 'pi pi-box', route: '/catalogo/productos' },
      {
        label: 'Categorías',
        icon: 'pi pi-th-large',
        route: '/catalogo/categorias',
      },
      { label: 'Marcas', icon: 'pi pi-tag', route: '/catalogo/marcas' },
      {
        label: 'Unidades',
        icon: 'pi pi-chart-bar',
        route: '/catalogo/unidades',
      },
      {
        label: 'Presentaciones',
        icon: 'pi pi-sitemap',
        route: '/catalogo/presentaciones',
      },
      {
        label: 'Composiciones',
        icon: 'pi pi-cog',
        route: '/catalogo/composiciones',
      },
      {
        label: 'Etiquetas',
        icon: 'pi pi-bookmark',
        route: '/catalogo/etiquetas',
      },
    ],
  },

  // ── Precios ─────────────────────────────────────────────────────────────────
  {
    label: 'Precios',
    icon: 'pi pi-tags',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Listas de Precio',
        icon: 'pi pi-list',
        route: '/precios/listas',
      },
      {
        label: 'Precio Productos',
        icon: 'pi pi-tags',
        route: '/precios/productos',
      },
      {
        label: 'Descuentos',
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
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      { label: 'Stock', icon: 'pi pi-database', route: '/inventario/stock' },
      { label: 'Lotes', icon: 'pi pi-calendar', route: '/inventario/lotes' },
      {
        label: 'Seriales',
        icon: 'pi pi-barcode',
        route: '/inventario/seriales',
      },
      { label: 'Kardex', icon: 'pi pi-history', route: '/inventario/kardex' },
      {
        label: 'Reconteos',
        icon: 'pi pi-warehouse',
        route: '/inventario/reconteos',
      },
      { label: 'Mermas', icon: 'pi pi-trash', route: '/mermas' },
      { label: 'Traslados', icon: 'pi pi-arrows-h', route: '/traslados' },
    ],
  },

  // ── Compras ─────────────────────────────────────────────────────────────────
  {
    label: 'Compras',
    icon: 'pi pi-truck',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      { label: 'Compras', icon: 'pi pi-truck', route: '/compras' },
      {
        label: 'Órdenes de Compra',
        icon: 'pi pi-file-edit',
        route: '/compras/ordenes',
      },
    ],
  },

  // ── Ventas ──────────────────────────────────────────────────────────────────
  {
    label: 'Ventas',
    icon: 'pi pi-receipt',
    items: [
      {
        label: 'Ventas',
        icon: 'pi pi-receipt',
        route: '/ventas',
        roles: ['SUPER_ADMIN', 'ADMIN', 'CAJERO'],
      },
      {
        label: 'Ventas de Campo',
        icon: 'pi pi-car',
        route: '/ventas-campo',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Cotizaciones',
        icon: 'pi pi-file',
        route: '/cotizaciones',
        roles: ['SUPER_ADMIN', 'ADMIN', 'CAJERO'],
      },
      {
        label: 'Devoluciones',
        icon: 'pi pi-replay',
        route: '/devoluciones',
        roles: ['SUPER_ADMIN', 'ADMIN', 'CAJERO'],
      },
    ],
  },

  // ── Cuentas ─────────────────────────────────────────────────────────────────
  {
    label: 'Cuentas',
    icon: 'pi pi-money-bill',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Cuentas por Cobrar',
        icon: 'pi pi-arrow-circle-down',
        route: '/cuentas/cuentas-por-cobrar',
      },
      {
        label: 'Cuentas por Pagar',
        icon: 'pi pi-arrow-circle-up',
        route: '/cuentas/cuentas-por-pagar',
      },
    ],
  },

  // ── Cartera ──────────────────────────────────────────────────────────────────
  {
    label: 'Cartera',
    icon: 'pi pi-chart-line',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Cartera',
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
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Cuentas Bancarias',
        icon: 'pi pi-credit-card',
        route: '/tesoreria/cuentas-bancarias',
      },
      {
        label: 'Egresos',
        icon: 'pi pi-arrow-up-right',
        route: '/tesoreria/egresos',
      },
      {
        label: 'Recaudos',
        icon: 'pi pi-arrow-down-left',
        route: '/tesoreria/recaudos',
      },
      {
        label: 'Conciliación',
        icon: 'pi pi-check-square',
        route: '/tesoreria/conciliacion',
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
        icon: 'pi pi-file-check',
        route: '/comprobantes',
        roles: ['SUPER_ADMIN', 'ADMIN', 'CAJERO'],
      },
      {
        label: 'Usuarios',
        icon: 'pi pi-user',
        route: '/admin/usuarios',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Cajas',
        icon: 'pi pi-desktop',
        route: '/caja/cajas',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      { label: 'Turnos', icon: 'pi pi-clock', route: '/caja/turnos' },
    ],
  },

  // ── Contabilidad ────────────────────────────────────────────────────────────
  // Reportes financieros y control de gastos
  {
    label: 'Contabilidad',
    icon: 'pi pi-book',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Plan de Cuentas',
        icon: 'pi pi-list',
        route: '/contabilidad/plan-cuentas',
      },
      {
        label: 'Asientos Contables',
        icon: 'pi pi-book',
        route: '/contabilidad/asientos',
      },
      {
        label: 'Centros de Costo',
        icon: 'pi pi-sitemap',
        route: '/contabilidad/centros-costo',
      },
      {
        label: 'Períodos Contables',
        icon: 'pi pi-lock',
        route: '/contabilidad/periodos',
      },
      {
        label: 'Cierre Contable',
        icon: 'pi pi-calendar-times',
        route: '/contabilidad/cierre',
      },
      {
        label: 'Estado de Cuenta',
        icon: 'pi pi-file-edit',
        route: '/contabilidad/estado-cuenta',
      },
      {
        label: 'Reporte IVA',
        icon: 'pi pi-percentage',
        route: '/contabilidad/reporte-iva',
      },
      { label: 'Gastos', icon: 'pi pi-wallet', route: '/gastos' },
      {
        label: 'Activos Fijos',
        icon: 'pi pi-building',
        route: '/contabilidad/activos-fijos',
      },
      {
        label: 'Tarifas Retención',
        icon: 'pi pi-percentage',
        route: '/contabilidad/tarifas-retencion',
      },
    ],
  },

  // ── Recursos Humanos ────────────────────────────────────────────────────────
  // Nómina de empleados + comisiones de técnicos/vendedores
  {
    label: 'Recursos Humanos',
    icon: 'pi pi-id-card',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      { label: 'Empleados', icon: 'pi pi-users', route: '/nomina/empleados' },
      { label: 'Períodos', icon: 'pi pi-calendar', route: '/nomina/periodos' },
      {
        label: 'Liquidación Nómina',
        icon: 'pi pi-calculator',
        route: '/nomina/liquidacion',
      },
      { label: 'Config. Nómina', icon: 'pi pi-cog', route: '/nomina/config' },
      {
        label: 'Comisiones',
        icon: 'pi pi-percentage',
        route: '/comisiones/configuracion',
      },
      {
        label: 'Liquidar Comisiones',
        icon: 'pi pi-wallet',
        route: '/comisiones/liquidaciones',
      },
    ],
  },

  // ── Reportes ────────────────────────────────────────────────────────────────
  {
    label: 'Reportes',
    icon: 'pi pi-chart-bar',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      { label: 'Ventas', icon: 'pi pi-chart-line', route: '/reportes/ventas' },
      {
        label: 'Inventario',
        icon: 'pi pi-chart-pie',
        route: '/reportes/inventario',
      },
      {
        label: 'Reportes Avanzados',
        icon: 'pi pi-chart-bar',
        route: '/reportes/avanzados',
        roles: ['SUPER_ADMIN', 'ADMIN'],
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
        label: 'Clientes y Proveedores',
        icon: 'pi pi-users',
        route: '/terceros',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Sucursales',
        icon: 'pi pi-building',
        route: '/admin/sucursales',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
];
