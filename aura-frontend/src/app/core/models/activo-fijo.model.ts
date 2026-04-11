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
}

export interface DepreciacionPeriodoModel {
  id: number;
  activoId: number;
  activoDescripcion: string | null;
  periodoId: number;
  valor: number;
  asientoId: number | null;
  calculadoEn: string;
}
