/**
 * Incremento salarial y retroactivo (rediseño de nómina R8).
 *
 * Backend: `NominaIncrementoController` (/api/nomina/incrementos).
 */
import { TipoListaNomina } from './nomina-documento.model';

export type TipoIncremento = 'PORCENTAJE' | 'VALOR_ADICIONAL' | 'NUEVO_VALOR' | 'SMMLV';
export type RedondeoIncremento = 'NINGUNO' | 'PESO' | 'CENTENA' | 'CENTENA_ARRIBA' | 'CENTENA_ABAJO' | 'MIL';
export type EstadoIncremento = 'PENDIENTE' | 'APLICADO' | 'REVERSADO' | 'ANULADO';

export interface IncrementoModel {
  id: number;
  numero: number;
  numeroCompleto: string;
  tipoLista: TipoListaNomina;
  ids: number[];
  tipoIncremento: TipoIncremento;
  valor: number | null;
  redondeo: RedondeoIncremento;
  fechaAplicacion: string;
  descripcion: string | null;
  estado: EstadoIncremento;
  documentoId: number | null;
  documentoNumero: string | null;
  documentoEstado: string | null;
  empleados: number;
  totalAnterior: number;
  totalNuevo: number;
  /** Vinculaciones con nóminas confirmadas desde la fecha de aplicación (piden retroactivo). */
  conRetroactivo: number;
  /** Al calcular: vinculaciones a las que el incremento no les cambia el salario. */
  sinCambio: number;
  aplicadoAt: string | null;
  reversadoAt: string | null;
  createdAt: string | null;
}

export interface IncrementoDetalleModel {
  id: number;
  contratoId: number;
  codigoVinculacion: string | null;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDocumento: string;
  cargo: string | null;
  salarioAnterior: number;
  salarioNuevo: number;
  diferencia: number;
  nominasRetroactivo: number;
}

/** Crear o recalcular (fecha en yyyy-MM-dd). */
export interface IncrementoRequestDto {
  tipoLista: TipoListaNomina;
  ids: number[];
  tipoIncremento: TipoIncremento;
  valor: number | null;
  redondeo: RedondeoIncremento;
  fechaAplicacion: string;
  descripcion: string | null;
}

export const OPCIONES_TIPO_INCREMENTO: { label: string; value: TipoIncremento }[] = [
  { label: 'Porcentaje', value: 'PORCENTAJE' },
  { label: 'Valor adicional', value: 'VALOR_ADICIONAL' },
  { label: 'Nuevo valor', value: 'NUEVO_VALOR' },
  { label: 'Igualar al SMMLV', value: 'SMMLV' },
];

export const OPCIONES_REDONDEO: { label: string; value: RedondeoIncremento }[] = [
  { label: 'Sin redondeo', value: 'NINGUNO' },
  { label: 'Al peso', value: 'PESO' },
  { label: 'A la centena', value: 'CENTENA' },
  { label: 'A la centena hacia arriba', value: 'CENTENA_ARRIBA' },
  { label: 'A la centena hacia abajo', value: 'CENTENA_ABAJO' },
  { label: 'Al mil', value: 'MIL' },
];

export const TEXTO_ESTADO_INCREMENTO: Record<EstadoIncremento, string> = {
  PENDIENTE: 'Pendiente',
  APLICADO: 'Aplicado',
  REVERSADO: 'Reversado',
  ANULADO: 'Anulado',
};

export function severidadEstadoIncremento(e: EstadoIncremento): 'warn' | 'success' | 'secondary' | 'info' {
  if (e === 'PENDIENTE') return 'warn';
  if (e === 'APLICADO') return 'success';
  if (e === 'REVERSADO') return 'info';
  return 'secondary';
}

/** "Porcentaje 9,5 %", "Valor adicional $ 100.000"… para el listado. */
export function textoIncremento(i: Pick<IncrementoModel, 'tipoIncremento' | 'valor'>): string {
  const v = i.valor ?? 0;
  switch (i.tipoIncremento) {
    case 'PORCENTAJE':
      return `${v.toLocaleString('es-CO')} %`;
    case 'VALOR_ADICIONAL':
      return `+ $ ${v.toLocaleString('es-CO')}`;
    case 'NUEVO_VALOR':
      return `Nuevo: $ ${v.toLocaleString('es-CO')}`;
    default:
      return 'Igualar al SMMLV';
  }
}
