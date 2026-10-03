export type CategoriaActivo = 'MAQUINARIA' | 'VEHICULO' | 'INMUEBLE' | 'EQUIPO' | 'MUEBLES' | 'INTANGIBLE';
export type MetodoDepreciacion = 'LINEA_RECTA' | 'UNIDADES_PRODUCCION' | 'SALDO_DECRECIENTE';
export type EstadoActivo = 'ACTIVO' | 'DEPRECIADO' | 'VENDIDO' | 'DADO_DE_BAJA';

export const CATEGORIA_ACTIVO_OPTIONS = [
  { label: 'Maquinaria y Equipo', value: 'MAQUINARIA' },
  { label: 'Vehículos', value: 'VEHICULO' },
  { label: 'Inmuebles', value: 'INMUEBLE' },
  { label: 'Equipo de Cómputo', value: 'EQUIPO' },
  { label: 'Muebles y Enseres', value: 'MUEBLES' },
  { label: 'Intangibles', value: 'INTANGIBLE' },
];

export const METODO_DEPRECIACION_OPTIONS = [
  { label: 'Línea Recta', value: 'LINEA_RECTA' },
  { label: 'Unidades de Producción', value: 'UNIDADES_PRODUCCION' },
  { label: 'Saldo Decreciente', value: 'SALDO_DECRECIENTE' },
];

export const ESTADO_ACTIVO_BADGE: Record<EstadoActivo, string> = {
  ACTIVO: 'success',
  DEPRECIADO: 'warning',
  VENDIDO: 'info',
  DADO_DE_BAJA: 'danger',
};

export interface ActivoFijoModel {
  id: number;
  empresaId: number;
  codigo: string;
  descripcion: string;
  categoria: CategoriaActivo;
  fechaAdquisicion: string;
  valorCompra: number;
  vidaUtilMeses: number;
  metodoDepreciacion: MetodoDepreciacion;
  depreciacionAcumulada: number;
  valorResidual: number;
  valorEnLibros: number;
  ubicacion: string | null;
  responsable: string | null;
  estado: EstadoActivo;
  cuentaActivoId: number | null;
  cuentaDepreciacionId: number | null;
  cuentaGastoDepId: number | null;
  centroCostoId: number | null;
  periodoContableId: number | null;
  terceroId: number | null;
  observaciones: string | null;
  createdAt: string;
  // Ficha completa
  placa?: string | null;
  serial?: string | null;
  marca?: string | null;
  modelo?: string | null;
  responsableTerceroId?: number | null;
  activoPadreId?: number | null;
  aseguradora?: string | null;
  polizaNumero?: string | null;
  polizaVence?: string | null;
  /** La depreciación empieza el mes de esta fecha; vacío = la de adquisición. */
  fechaInicioDepreciacion?: string | null;
  /** Solo unidades de producción: vida total en unidades (horas, km…). */
  unidadesEstimadas?: number | null;
  responsableTerceroNombre?: string | null;
  activoPadreCodigo?: string | null;
  valorAdiciones?: number;
  /** Compra + adiciones. */
  costoTotal?: number;
  mesesDepreciados?: number;
  fechaRetiro?: string | null;
  motivoRetiro?: string | null;
  valorVenta?: number | null;
  compradorTerceroId?: number | null;
  asientoRetiroId?: number | null;
  compraId?: number | null;
  productoId?: number | null;
}

export interface ActivoFijoTableModel {
  id: number;
  codigo: string;
  descripcion: string;
  categoria: string;
  fechaAdquisicion: string;
  valorCompra: number;
  depreciacionAcumulada: number;
  valorEnLibros: number;
  metodoDepreciacion: string;
  vidaUtilMeses: number;
  estado: EstadoActivo;
  placa?: string | null;
  responsable?: string | null;
  centroCostoNombre?: string | null;
  valorAdiciones?: number;
  compraId?: number | null;
}

export interface CreateActivoFijoDto {
  codigo: string;
  descripcion: string;
  categoria: CategoriaActivo;
  fechaAdquisicion: string;
  valorCompra: number;
  vidaUtilMeses: number;
  metodoDepreciacion: MetodoDepreciacion;
  valorResidual: number;
  ubicacion: string | null;
  responsable: string | null;
  cuentaActivoId: number | null;
  cuentaDepreciacionId: number | null;
  cuentaGastoDepId: number | null;
  centroCostoId: number | null;
  periodoContableId: number | null;
  terceroId: number | null;
  observaciones: string | null;
  // Ficha completa
  placa?: string | null;
  serial?: string | null;
  marca?: string | null;
  modelo?: string | null;
  responsableTerceroId?: number | null;
  activoPadreId?: number | null;
  aseguradora?: string | null;
  polizaNumero?: string | null;
  polizaVence?: string | null;
  /** La depreciación empieza el mes de esta fecha; vacío = la de adquisición. */
  fechaInicioDepreciacion?: string | null;
  /** Solo unidades de producción: vida total en unidades (horas, km…). */
  unidadesEstimadas?: number | null;
}

export interface DepreciacionPeriodoModel {
  id: number;
  activoId: number;
  activoDescripcion: string | null;
  periodoId: number;
  valor: number;
  asientoId: number | null;
  calculadoEn: string;
  metodo?: string | null;
  unidades?: number | null;
  /** 2026-09 */
  periodo?: string | null;
  activoCodigo?: string | null;
}

export interface ProyeccionDepreciacionModel {
  periodo: string;
  cuota: number;
  acumulada: number;
  valorEnLibros: number;
}

export interface AdicionActivoModel {
  id?: number;
  activoId?: number;
  fecha: string;
  descripcion: string;
  valor: number;
  mesesAdicionales: number;
  cuentaContrapartidaId: number | null;
  cuentaContrapartida?: string | null;
  terceroId?: number | null;
  asientoId?: number | null;
}

export interface MantenimientoActivoModel {
  id?: number;
  activoId?: number;
  fecha: string;
  tipo: 'PREVENTIVO' | 'CORRECTIVO';
  descripcion: string;
  costo: number;
  terceroId?: number | null;
  terceroNombre?: string | null;
  proximo?: string | null;
}

/** Baja o venta. En la venta, valorVenta es sin IVA. */
export interface RetiroActivoDto {
  fecha: string;
  motivo: string;
  valorVenta?: number | null;
  ivaPorcentaje?: number | null;
  cuentaCobroId?: number | null;
  compradorTerceroId?: number | null;
}

export interface ReporteActivosModel {
  filas: {
    id: number;
    codigo: string;
    descripcion: string;
    categoria: string;
    placa: string | null;
    estado: EstadoActivo;
    centroCosto: string;
    responsable: string;
    fechaAdquisicion: string;
    vidaUtilMeses: number;
    costo: number;
    depreciacionAcumulada: number;
    valorEnLibros: number;
    depreciacionMes: number;
  }[];
  grupos: { nombre: string; cantidad: number; costo: number; depreciacion: number; enLibros: number }[];
  totalCosto: number;
  totalDepreciacion: number;
  totalEnLibros: number;
}
