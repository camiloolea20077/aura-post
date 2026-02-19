export interface SidebarMenuItem {
  label: string;
  icon: string;
  route?: string;
  badge?: string;
  highlight?: boolean;
}

export interface SidebarMenuGroup {
  label: string;
  items: SidebarMenuItem[];
}

export const SIDEBAR_MENU: SidebarMenuGroup[] = [
  {
    label: 'Principal',
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
    ],
  },
  {
    label: 'Precios',
    items: [
      {
        label: 'Listas de Precio',
        icon: 'pi pi-list',
        route: '/precios/listas',
      },
      {
        label: 'Producto Precios',
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
    items: [
      { label: 'Stock', icon: 'pi pi-database', route: '/inventario/stock' },
      { label: 'Lotes', icon: 'pi pi-calendar', route: '/inventario/lotes' },
      {
        label: 'Seriales',
        icon: 'pi pi-barcode',
        route: '/inventario/seriales',
      },
      { label: 'Kardex', icon: 'pi pi-history', route: '/inventario/kardex' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Compras', icon: 'pi pi-truck', route: '/compras' },
      { label: 'Ventas', icon: 'pi pi-receipt', route: '/ventas' },
      { label: 'Mermas', icon: 'pi pi-trash', route: '/mermas' },
      { label: 'Traslados', icon: 'pi pi-arrows-h', route: '/traslados' },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        label: 'Clientes y Proveedores',
        icon: 'pi pi-users',
        route: '/terceros',
      },
      { label: 'Cajas', icon: 'pi pi-desktop', route: '/caja/cajas' },
      { label: 'Turnos', icon: 'pi pi-clock', route: '/caja/turnos' },
    ],
  },
  {
    label: 'Reportes',
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
