/**
 * Cómo se agrupan y describen las pantallas de Contabilidad en el centro.
 *
 * Se cruza por RUTA con los ítems del grupo "Contabilidad" de sidebar.config.ts
 * ya filtrados por permisos (StateStore.menuGroups()). Así el centro muestra
 * exactamente lo mismo que mostraba el sidebar: una pantalla sin permiso no
 * aparece aunque esté aquí, y una pantalla nueva que falte aquí cae en "Otros".
 */
export type GrupoContableId = 'operacion' | 'cierre' | 'tributario' | 'tesoreria';

export interface ModuloContableConfig {
  /** Ruta existente del ítem en sidebar.config.ts. */
  route: string;
  /** Título en el centro; si falta se usa el label del sidebar. */
  titulo?: string;
  descripcion: string;
  grupo: GrupoContableId;
}

export interface GrupoContableConfig {
  id: GrupoContableId | 'otros';
  titulo: string;
  icono: string;
}

export const GRUPOS_CONTABLES: GrupoContableConfig[] = [
  { id: 'operacion', titulo: 'Operación contable', icono: 'pi pi-book' },
  { id: 'cierre', titulo: 'Cierre y resultados', icono: 'pi pi-chart-line' },
  { id: 'tributario', titulo: 'Tributario', icono: 'pi pi-percentage' },
  { id: 'tesoreria', titulo: 'Tesorería y activos', icono: 'pi pi-wallet' },
  { id: 'otros', titulo: 'Otros', icono: 'pi pi-th-large' },
];

export const MODULOS_CONTABLES: ModuloContableConfig[] = [
  // ── Operación contable ──────────────────────────────────────────────
  { route: '/contabilidad/plan-cuentas', grupo: 'operacion', descripcion: 'PUC, auxiliares y cuentas de tesorería' },
  { route: '/contabilidad/asientos', grupo: 'operacion', descripcion: 'Consultar y registrar asientos' },
  { route: '/contabilidad/notas', grupo: 'operacion', descripcion: 'Notas de diario, soportes y plantillas' },
  { route: '/contabilidad/revision', grupo: 'operacion', descripcion: 'Aprobar comprobantes en borrador' },
  { route: '/contabilidad/conceptos-caja', grupo: 'operacion', descripcion: 'Conceptos de ingresos y egresos de caja' },
  { route: '/contabilidad/saldos-iniciales', grupo: 'operacion', descripcion: 'Asiento de apertura' },
  { route: '/contabilidad/centros-costo', grupo: 'operacion', descripcion: 'Centros de costo para los asientos' },
  { route: '/contabilidad/parametrizacion', grupo: 'operacion', descripcion: 'Cuenta de cada concepto, forma de pago e impuesto' },
  { route: '/contabilidad/herramientas', grupo: 'operacion', descripcion: 'Trasladar movimientos entre cuentas y fusionar terceros' },
  { route: '/contabilidad/categorias-contables', grupo: 'operacion', descripcion: 'Cuentas por clase de ítem: mercancía, activos, gastos, diferidos' },
  { route: '/contabilidad/importar', grupo: 'operacion', descripcion: 'Plan de cuentas, terceros, saldos y cartera desde Excel' },

  // ── Cierre y resultados ─────────────────────────────────────────────
  { route: '/contabilidad/periodos', grupo: 'cierre', descripcion: 'Abrir, cerrar y reabrir meses' },
  { route: '/contabilidad/cierre', grupo: 'cierre', descripcion: 'Ventas, costos, gastos y utilidad del período' },
  { route: '/contabilidad/balance-general', grupo: 'cierre', descripcion: 'Activos, pasivos y patrimonio' },
  { route: '/contabilidad/balance-prueba', grupo: 'cierre', descripcion: 'Saldo anterior, movimientos y saldo final, con comparativo' },
  { route: '/contabilidad/libros', grupo: 'cierre', descripcion: 'Libro diario, mayor y auxiliar por tercero' },
  { route: '/contabilidad/estado-cuenta', grupo: 'cierre', descripcion: 'Movimientos de una cuenta o un tercero' },
  { route: '/contabilidad/cierre-anual', grupo: 'cierre', descripcion: 'Provisión de renta, traslado y dividendos' },
  { route: '/contabilidad/eeff', grupo: 'cierre', descripcion: 'Estados financieros NIIF completos' },

  // ── Tributario ──────────────────────────────────────────────────────
  { route: '/contabilidad/declaraciones', grupo: 'tributario', descripcion: 'Borradores de IVA (300) y retención (350)' },
  { route: '/contabilidad/reporte-iva', grupo: 'tributario', descripcion: 'IVA generado y descontable del período' },
  { route: '/contabilidad/tarifas-retencion', grupo: 'tributario', descripcion: 'Conceptos, bases y porcentajes de retención' },
  { route: '/contabilidad/exogena', grupo: 'tributario', descripcion: 'Información exógena para la DIAN' },

  // ── Tesorería y activos ─────────────────────────────────────────────
  { route: '/gastos', grupo: 'tesoreria', descripcion: 'Registro y pago de gastos' },
  { route: '/contabilidad/activos-fijos', grupo: 'tesoreria', descripcion: 'Ficha, depreciación y baja de activos' },
  { route: '/contabilidad/conciliacion', grupo: 'tesoreria', descripcion: 'Extractos bancarios contra el libro' },
];
