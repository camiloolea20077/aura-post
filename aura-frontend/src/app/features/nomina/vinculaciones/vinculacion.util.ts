import { ContratoTableModel } from '../../../core/models/contrato.model';
import { NominaConfigModel } from '../../../core/models/nomina.model';
import { TipoVinculacionModel } from '../../../core/models/nomina-parametros.model';
import { EstadoVinculacion, VinculacionModel, VinculacionTableModel } from '../../../core/models/vinculacion.model';
import { aDate } from '../../../shared/utils/fecha.util';

/**
 * Reglas y textos de la vinculación fuera de los componentes. Las reglas
 * legales las vuelve a aplicar el back; aquí solo se adelantan para avisar.
 */

export const OPCIONES_ESTADO: { label: string; value: EstadoVinculacion | null }[] = [
  { label: 'Todos los estados', value: null },
  { label: 'Activa', value: 'ACTIVO' },
  { label: 'Suspendida', value: 'SUSPENDIDO' },
  { label: 'Retirada', value: 'TERMINADO' },
];

export const OPCIONES_FASE = [
  { label: 'Etapa lectiva', value: 'LECTIVA' },
  { label: 'Etapa práctica', value: 'PRACTICA' },
];

/** Tipos de cotizante más usados en PILA (resolución 2388 de 2016). */
export const OPCIONES_COTIZANTE = [
  { label: '01 — Dependiente', value: '01' },
  { label: '02 — Servicio doméstico', value: '02' },
  { label: '12 — Aprendiz SENA etapa lectiva', value: '12' },
  { label: '19 — Aprendiz SENA etapa productiva', value: '19' },
  { label: '20 — Estudiante (régimen especial)', value: '20' },
  { label: '51 — Trabajador de tiempo parcial', value: '51' },
];

export const OPCIONES_SUBTIPO = [
  { label: 'Ninguno', value: null },
  { label: '01 — Pensionado por vejez activo', value: '01' },
  { label: '02 — No obligado a pensión por edad', value: '02' },
  { label: '03 — Con requisitos de pensión cumplidos', value: '03' },
  { label: '04 — Pensionado por invalidez activo', value: '04' },
];

/**
 * Apoyo de sostenimiento del aprendiz SENA según la etapa (Ley 2466 de 2025):
 * SMMLV × % de la fase (lectiva 75 %, práctica 100 %, parametrizable en la
 * configuración de nómina). Null si falta la fase o la configuración.
 */
export function apoyoAprendiz(config: NominaConfigModel | null, fase: string | null | undefined): number | null {
  if (!config?.smmlv || !fase) return null;
  const pct = fase === 'PRACTICA' ? config.aprendizPctPractica : config.aprendizPctLectiva;
  if (pct == null) return null;
  return Math.round((config.smmlv * pct) / 100);
}

/** Texto de ayuda junto al salario del aprendiz: de dónde sale el valor. */
export function textoApoyoAprendiz(config: NominaConfigModel | null, fase: string | null | undefined): string | null {
  if (!config || !fase) return null;
  const pct = fase === 'PRACTICA' ? config.aprendizPctPractica : config.aprendizPctLectiva;
  const etapa = fase === 'PRACTICA' ? 'etapa práctica' : 'etapa lectiva';
  return `Apoyo de sostenimiento: ${pct} % del salario mínimo (${etapa})`;
}

export function textoEstado(e: EstadoVinculacion): string {
  return OPCIONES_ESTADO.find((o) => o.value === e)?.label ?? e;
}

export function severidadEstado(e: EstadoVinculacion): 'success' | 'warn' | 'secondary' {
  return e === 'ACTIVO' ? 'success' : e === 'SUSPENDIDO' ? 'warn' : 'secondary';
}

/**
 * Último día posible del período de prueba (CST art. 78): dos meses, o la quinta
 * parte del término en contratos fijos de menos de un año.
 */
export function finPruebaMaximo(inicio: Date | null, fin: Date | null): Date | null {
  if (!inicio) return null;
  const dosMeses = new Date(inicio.getFullYear(), inicio.getMonth() + 2, inicio.getDate() - 1);
  if (!fin) return dosMeses;
  const unAno = new Date(inicio.getFullYear() + 1, inicio.getMonth(), inicio.getDate());
  if (fin >= unAno) return dosMeses < fin ? dosMeses : fin;
  const dias = Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1;
  const quinta = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + Math.floor(dias / 5) - 1);
  return quinta < dosMeses ? quinta : dosMeses;
}

/** Valores que propone el tipo de vinculación al elegirlo. */
export function valoresDelTipo(t: TipoVinculacionModel): {
  tipoContrato: string | null;
  tipoRemuneracion: string;
  frecuenciaPago: string;
} {
  return { tipoContrato: t.tipoContrato, tipoRemuneracion: t.tipoRemuneracion, frecuenciaPago: t.frecuenciaPago };
}

/** Días que faltan para que termine el período de prueba (null si ya pasó o no hay). */
export function diasParaFinPrueba(v: VinculacionTableModel): number | null {
  const fin = aDate(v.fechaFinPrueba);
  if (!fin || v.estado === 'TERMINADO') return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((fin.getTime() - hoy.getTime()) / 86_400_000);
  return dias >= 0 ? dias : null;
}

/**
 * La vinculación con la forma que esperan los diálogos de contratos que se
 * reutilizan (historial de salario y terminación).
 */
export function aContratoTabla(v: VinculacionModel | VinculacionTableModel): ContratoTableModel {
  return {
    id: v.id,
    empleadoId: v.empleadoId,
    empleadoNombre: v.empleadoNombre,
    tipoContrato: v.tipoContrato as ContratoTableModel['tipoContrato'],
    cargo: v.cargoNombre,
    fechaInicio: v.fechaInicio,
    fechaFin: v.fechaFin,
    salarioBase: v.salarioBase,
    esPrincipal: v.esPrincipal,
    estado: v.estado as ContratoTableModel['estado'],
    diasParaVencer: null,
  };
}
