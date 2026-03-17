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
  icon: string; // icono del grupo para el header colapsable
  items: SidebarMenuItem[];
  roles?: string[];
  defaultOpen?: boolean; // si arranca abierto
  alwaysOpen?: boolean; // no colapsable, siempre visible
}

export const SIDEBAR_MENU: SidebarMenuGroup[] = [
  {
    label: 'Principal',
    icon: 'pi pi-home',
    defaultOpen: true,
    alwaysOpen: true,
    items: [
      { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
      {
        label: 'Punto de Venta',
        icon: 'pi pi-shopping-cart',
        route: '/pos',
        badge: 'POS',
        highlight: true,
      },
    ],
  },
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
  {
    label: 'Inventario',
    icon: 'pi pi-database',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Inventario',
        icon: 'pi pi-database',
        route: '/inventario/stock',
      },
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
    ],
  },
  {
    label: 'Operaciones',
    icon: 'pi pi-receipt',
    items: [
      {
        label: 'Compras',
        icon: 'pi pi-truck',
        route: '/compras',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Ventas',
        icon: 'pi pi-receipt',
        route: '/ventas',
        roles: ['SUPER_ADMIN', 'ADMIN', 'CAJERO'],
      },
      {
        label: 'Mermas',
        icon: 'pi pi-trash',
        route: '/mermas',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Traslados',
        icon: 'pi pi-arrows-h',
        route: '/traslados',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Cotizaciones',
        icon: 'pi pi-file',
        route: '/cotizaciones',
        roles: ['SUPER_ADMIN', 'ADMIN', 'CAJERO'],
      },
    ],
  },
  {
    label: 'Contabilidad',
    icon: 'pi pi-wallet',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Cierre Contable',
        icon: 'pi pi-book',
        route: '/contabilidad/cierre',
      },
      {
        label: 'Estado de Cuenta',
        icon: 'pi pi-file-edit',
        route: '/contabilidad/estado-cuenta',
      },
      {
        label: 'Cuentas por Cobrar',
        icon: 'pi pi-money-bill',
        route: '/cuentas/cuentas-por-cobrar',
      },
      {
        label: 'Cuentas por Pagar',
        icon: 'pi pi-credit-card',
        route: '/cuentas/cuentas-por-pagar',
      },
    ],
  },
  {
    label: 'Administración',
    icon: 'pi pi-sliders-h',
    items: [
      {
        label: 'Clientes y Proveedores',
        icon: 'pi pi-users',
        route: '/terceros',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Cajas',
        icon: 'pi pi-desktop',
        route: '/caja/cajas',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      { label: 'Turnos', icon: 'pi pi-clock', route: '/caja/turnos' },
      {
        label: 'Sucursales',
        icon: 'pi pi-building',
        route: '/admin/sucursales',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Usuarios',
        icon: 'pi pi-user',
        route: '/admin/usuarios',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
  {
    label: 'Comisiones',
    icon: 'pi pi-percentage',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    items: [
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        route: '/comisiones/configuracion',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Liquidaciones',
        icon: 'pi pi-wallet',
        route: '/comisiones/liquidaciones',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
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
    ],
  },
];
