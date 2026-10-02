// ─── Fase 4: contabilidad para el contador ─────────────────────────────────

/** Concepto contable → cuenta (configuracion-cuentas). */
export interface CuentaConfigModel {
  concepto: string;
  descripcionConcepto: string;
  cuentaId: number | null;
  codigoCuenta: string | null;
  nombreCuenta: string | null;
  porDefecto: boolean;
  codigoDefault?: string;
  /** Clases del PUC que acepta ("14", "15"…). */
  prefijosPermitidos?: string[];
}

export interface ConfigLogModel {
  id: number;
  concepto: string;
  descripcionConcepto: string;
  cuentaAnterior: string | null;
  cuentaNueva: string | null;
  usuarioId: number | null;
  fecha: string;
}

export interface FormaPagoContableModel {
  id?: number;
  codigo: string;
  nombre: string;
  cuentaContableId: number | null;
  cuentaContable?: string | null;
  requiereCuentaBancaria?: boolean;
  activo?: boolean;
  /** % que paga el cliente al usar esta forma (Sistecrédito…); 0 = sin recargo. */
  recargoPorcentaje?: number | null;
}

export interface ImpuestoModel {
  id?: number;
  nombre: string;
  tipo: string;
  porcentaje: number;
  cuentaGeneradoId: number | null;
  cuentaGenerado?: string | null;
  cuentaDescontableId: number | null;
  cuentaDescontable?: string | null;
  vigenteDesde?: string | null;
  vigenteHasta?: string | null;
  activo?: boolean;
}

// ─── Vista previa del asiento ─────────────────────────────────────────────
export interface VistaPreviaAsientoModel {
  lineas: {
    cuentaId: number;
    cuentaCodigo: string | null;
    cuentaNombre: string | null;
    descripcion: string | null;
    debito: number;
    credito: number;
    terceroId: number | null;
  }[];
  totalDebito: number;
  totalCredito: number;
  cuadra: boolean;
}

export interface VistaPreviaCompraRequest {
  tipoDocumento?: string | null;
  proveedorId?: number | null;
  cuentaContableId?: number | null;
  fletes?: number | null;
  retefuentePct?: number | null;
  reteivaPct?: number | null;
  reteicaPct?: number | null;
  formaPago?: string | null;
  lineas: { productoId: number; neto: number; iva: number }[];
  pagos?: { metodoPago: string; cuentaBancariaId?: number | null; cuentaContableId?: number | null; monto: number }[];
}

// ─── Saldos iniciales ─────────────────────────────────────────────────────
export type FuenteSaldoInicial = 'INVENTARIO' | 'ACTIVOS' | 'DIFERIDOS' | 'CARTERA' | 'PROVEEDORES' | 'BANCOS';

export interface SugerenciaSaldoInicialModel {
  fuente: FuenteSaldoInicial;
  cuentaId: number;
  cuentaCodigo: string | null;
  cuentaNombre: string | null;
  terceroId: number | null;
  terceroNombre: string | null;
  descripcion: string | null;
  debito: number;
  credito: number;
}

// ─── Balance de prueba ────────────────────────────────────────────────────
export interface BalancePruebaFila {
  cuentaId: number;
  codigo: string;
  nombre: string;
  nivel: number;
  naturaleza: string;
  auxiliar: boolean;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
  saldoFinal: number;
  saldoComparado: number | null;
  variacion: number | null;
  variacionPct: number | null;
}

export interface BalancePruebaModel {
  desde: string;
  hasta: string;
  comparadoDesde: string | null;
  comparadoHasta: string | null;
  filas: BalancePruebaFila[];
  totalDebitos: number;
  totalCreditos: number;
  cuadra: boolean;
}

// ─── Traslado de cuentas y fusión de terceros ─────────────────────────────
export interface MovimientoTrasladoModel {
  id: number;
  asiento_id: number;
  fecha: string;
  numero_comprobante: string | null;
  tipo_origen: string | null;
  origen_id: number | null;
  descripcion: string | null;
  debito: number;
  credito: number;
  tercero_id: number | null;
  tercero_nombre: string | null;
  estado_periodo: string | null;
}

export interface ResumenTrasladoModel {
  lineas: number;
  debitos: number;
  creditos: number;
  periodosCerrados: string[];
  /** Los movimientos que se moverían (hasta 2000). */
  movimientos: MovimientoTrasladoModel[];
}
