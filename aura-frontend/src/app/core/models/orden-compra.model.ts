export type EstadoOrdenCompra =
  | 'BORRADOR'
  | 'ENVIADA'
  | 'CONFIRMADA'
  | 'RECIBIDA_PARCIAL'
  | 'CERRADA'
  | 'ANULADA';

export interface OrdenCompraDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  cantidadRecibida: number;
  cantidadPendiente: number;
  costoUnitario: number;
  subtotalLinea: number;
}

export interface OrdenCompraModel {
  id: number;
  numeroOrden: string;
  estado: EstadoOrdenCompra;
  proveedorId: number;
  proveedorNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  fecha: string;
  fechaEntregaEsperada: string | null;
  observaciones: string | null;
  total: number;
  compraId: number | null;
  detalles: OrdenCompraDetalleModel[];
}

export interface OrdenCompraTableModel {
  id: number;
  numeroOrden: string;
  estado: EstadoOrdenCompra;
  proveedorNombre: string;
  sucursalNombre: string;
  fecha: string;
  fechaEntregaEsperada: string | null;
  total: number;
  compraId: number | null;
}

// ── DTOs de creación ──────────────────────────────────────────────

export interface CreateOrdenCompraDetalleDto {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
}

export interface CreateOrdenCompraDto {
  proveedorId: number;
  sucursalId: number;
  fecha?: string | null;
  fechaEntregaEsperada?: string | null;
  observaciones?: string | null;
  detalles: CreateOrdenCompraDetalleDto[];
}

// ── DTO de recepción ──────────────────────────────────────────────

export interface RecepcionLineaDto {
  detalleId: number;
  cantidadRecibida: number;
}

export interface RecepcionOrdenDto {
  numeroFactura?: string | null;
  observaciones?: string | null;
  lineas: RecepcionLineaDto[];
}

// ── UI helpers ────────────────────────────────────────────────────

export const ESTADO_OC_CONFIG: Record<
  EstadoOrdenCompra,
  {
    label: string;
    severity: 'info' | 'warn' | 'success' | 'danger' | 'secondary' | 'contrast';
    icon: string;
  }
> = {
  BORRADOR: { label: 'Borrador', severity: 'secondary', icon: 'pi pi-pencil' },
  ENVIADA: { label: 'Enviada', severity: 'info', icon: 'pi pi-send' },
  CONFIRMADA: { label: 'Confirmada', severity: 'warn', icon: 'pi pi-check' },
  RECIBIDA_PARCIAL: {
    label: 'Recib. Parcial',
    severity: 'warn',
    icon: 'pi pi-clock',
  },
  CERRADA: { label: 'Cerrada', severity: 'success', icon: 'pi pi-lock' },
  ANULADA: { label: 'Anulada', severity: 'danger', icon: 'pi pi-ban' },
};

/** Product line row used in the create/edit form */
export interface LineaFormOC {
  productoId: number | null;
  productoNombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}
