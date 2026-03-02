import { TipoProducto } from './producto.model';

// ─── Estado de venta ──────────────────────────────────────────
export type EstadoVenta = 'COMPLETADA' | 'ANULADA';
export type MetodoPago =
  | 'EFECTIVO'
  | 'TARJETA'
  | 'TRANSFERENCIA'
  | 'NEQUI'
  | 'DAVIPLATA'
  | 'CREDITO';

// ─── Detalle ──────────────────────────────────────────────────
export interface VentaDetalleModel {
  id: number;
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  cantidad: number;
  precioUnitario: number;
  descuentoValor: number;
  impuestoValor: number;
  subtotalLinea: number;
  montoDescuento: number;
}

// ─── Pago ─────────────────────────────────────────────────────
export interface VentaPagoModel {
  id: number;
  metodoPago: MetodoPago;
  monto: number;
  referencia: string | null;
}

// ─── Venta completa ───────────────────────────────────────────
export interface VentaModel {
  id: number;
  // ── Campos que faltaban (necesarios para la tirilla) ──
  empresaId: number;
  sucursalId: number;
  sucursalNombre: string;
  usuarioId: number;
  prefijo: string | null;
  consecutivo: number | null;
  tipoDocumento: string;
  observaciones: string | null;

  turnoCajaId: number;
  cajaNombre: string;
  clienteId: number | null;
  clienteNombre: string | null;
  numeroVenta: string | null;
  fechaEmision: string;
  subtotal: number;
  descuentoTotal: number;
  impuestosTotal: number;
  totalPagar: number;
  estadoVenta: EstadoVenta;
  cufe: string | null;
  estadoDian: string | null;
  detalles: VentaDetalleModel[];
  pagos: VentaPagoModel[];
}

// ─── Tabla ───────────────────────────────────────────────────
export interface VentaTableModel {
  id: number;
  numeroVenta: string | null;
  clienteNombre: string | null;
  cajaNombre: string;
  fechaEmision: string;
  totalPagar: number;
  estadoVenta: EstadoVenta;
  estadoDian?: string;
  cufe?: string;
  factusUrl?: string;
  factusNumero?: string;
}

// ─── DTOs ─────────────────────────────────────────────────────
export interface CreateVentaDetalleDto {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuentoValor: number;
  impuestoValor: number;
  seriales?: number[];
}

export interface CreateVentaPagoDto {
  metodoPago: MetodoPago;
  monto: number;
  referencia?: string | null;
}

export interface CreateVentaDto {
  turnoCajaId: number;
  clienteId: number | null;
  detalles: CreateVentaDetalleDto[];
  pagos: CreateVentaPagoDto[];
  pagoParcial?: boolean;
  saldoPendiente?: number;
}

export interface VentaPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── UI — carrito ─────────────────────────────────────────────
export interface CartItem {
  _id: string; // UUID local
  productoId: number;
  productoNombre: string;
  productoSku: string | null;
  precio: number;
  cantidad: number;
  descuento: number; // valor absoluto
  impuesto: number;
  subtotal: number;
  showDescuento?: boolean;
  esPesable: boolean;
  descuentoAutomatico: string | null;
  unidadMedida: string | null;
  impuestoValor: number;
}

// ─── UI — pago en el modal ────────────────────────────────────
export interface PagoUI {
  metodoPago: MetodoPago;
  monto: number | null;
  referencia: string | null;
}

// ─── UI — producto en el grid POS ────────────────────────────
export interface ProductoPOS {
  id: number;
  imagenUrl: string | null;
  ivaPorcentaje: number;
  nombre: string;
  sku: string | null;
  precio: number;
  unidadMedidaNombre: string | null;
  stock: number;
  categoriaId: number | null;
  categoriaNombre: string | null;
  tipoProducto: TipoProducto;
  precioFinal: number; // ← nuevo
  descuentoNombre: string | null; // ← nuevo
  descuentoValor: number | null; // ← nuevo
  manejaInventario: boolean;
  stockActual: number;
  codigoBarras: string | null;
  presentacionId: number | null;
  presentacionNombre: string | null;
  presentacionCodigoBarras: string | null;
  presentacionPrecio: number | null;
  presentacionFactorConversion: number | null;
}

// ─── Opciones UI ─────────────────────────────────────────────
export const METODOS_PAGO: {
  label: string;
  value: MetodoPago;
  icon: string;
  color: string;
}[] = [
  {
    label: 'Efectivo',
    value: 'EFECTIVO',
    icon: 'pi pi-money-bill',
    color: '#10B981',
  },
  {
    label: 'Tarjeta',
    value: 'TARJETA',
    icon: 'pi pi-credit-card',
    color: '#3B82F6',
  },
  {
    label: 'Transferencia',
    value: 'TRANSFERENCIA',
    icon: 'pi pi-arrow-right-arrow-left',
    color: '#6366F1',
  },
  { label: 'Nequi', value: 'NEQUI', icon: 'pi pi-mobile', color: '#8B5CF6' },
  {
    label: 'Daviplata',
    value: 'DAVIPLATA',
    icon: 'pi pi-wallet',
    color: '#EF4444',
  },
  {
    label: 'Crédito',
    value: 'CREDITO',
    icon: 'pi pi-file-invoice',
    color: '#F59E0B',
  },
];
export interface VentaReporteItem {
  id: number;
  numeroVenta: string;
  fechaEmision: string; // ISO string
  cajaNombre: string;
  totalPagar: number;
  estadoVenta: 'COMPLETADA' | 'ANULADA';
  // detalles resumidos (viene del backend)
  detallesResumen: string; // Ej: "Tubo x2, Válvula x1"
}

export interface VentaReporteResponse {
  content: VentaReporteItem[];
  totalElements: number;
  totalPages: number;
  totalCompletadas: number;
  totalIngresos: number;
  ticketPromedio: number;
  porDia: { dia: string; total: number }[]; // últimos 7 días
}
