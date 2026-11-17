import {
  CalendarioMesModel,
  ResultadoFilaMarcajeModel,
} from '../../../core/models/asistencia-frente.model';

/** Columna del calendario: un día del mes. */
export interface DiaColumna {
  fecha: string;
  dia: number;
  /** L, M, X, J, V, S, D */
  letra: string;
  domingo: boolean;
  festivo: boolean;
}

/** Tipo de celda: define color y texto. */
export type TipoCelda = 'asistio' | 'parcial' | 'falta' | 'justificada' | 'sin-registro' | 'error' | 'aviso';

/** Una celda: lo de un trabajador en un día. */
export interface CeldaCalendario {
  tipo: TipoCelda;
  /** Texto corto dentro de la celda: horas trabajadas o una letra. */
  texto: string;
  /** Detalle al pasar el mouse. */
  titulo: string;
  extra: number;
}

/** Una fila: un trabajador en el mes. */
export interface FilaCalendario {
  clave: string;
  nombre: string;
  documento: string;
  diasAsistidos: number;
  faltas: number;
  horas: number;
  horasExtra: number;
  celdas: Record<string, CeldaCalendario>;
}

const LETRAS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const ESTADO_TEXTO: Record<string, string> = {
  ASISTIO: 'Asistió',
  NO_ASISTIO: 'No asistió',
  LLEGO_TARDE: 'Llegó tarde',
  SALIO_TEMPRANO: 'Salió temprano',
  PERMISO: 'Permiso',
  INCAPACIDAD: 'Incapacidad',
  VACACIONES: 'Vacaciones',
  SUSPENDIDO: 'Suspendido',
  SIN_REGISTRO: 'Sin registro',
};
const LETRA_ESTADO: Record<string, string> = {
  NO_ASISTIO: 'F',
  PERMISO: 'P',
  INCAPACIDAD: 'I',
  VACACIONES: 'V',
  SUSPENDIDO: 'S',
  SIN_REGISTRO: '·',
};

function dos(n: number): string {
  return String(n).padStart(2, '0');
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function horasTexto(h: number): string {
  return Number.isInteger(h) ? String(h) : h.toFixed(1);
}

/** Días del mes con su letra y si es domingo o festivo. */
export function diasDelMes(anio: number, mes: number, festivos: string[] = []): DiaColumna[] {
  const fest = new Set(festivos);
  const ultimo = new Date(anio, mes, 0).getDate();
  const out: DiaColumna[] = [];
  for (let d = 1; d <= ultimo; d++) {
    const fecha = `${anio}-${dos(mes)}-${dos(d)}`;
    const dow = new Date(anio, mes - 1, d).getDay();
    out.push({ fecha, dia: d, letra: LETRAS[dow], domingo: dow === 0, festivo: fest.has(fecha) });
  }
  return out;
}

/** Celda según el estado de asistencia y las horas. */
function celda(estado: string, horas: number, extra: number, detalle: string): CeldaCalendario {
  const nombre = ESTADO_TEXTO[estado] ?? estado;
  const titulo = [nombre, horas ? `${horasTexto(horas)} h` : '', extra ? `${horasTexto(extra)} h extra` : '', detalle]
    .filter(Boolean)
    .join(' · ');
  if (estado === 'ASISTIO') return { tipo: 'asistio', texto: horasTexto(horas), titulo, extra };
  if (estado === 'LLEGO_TARDE' || estado === 'SALIO_TEMPRANO')
    return { tipo: 'parcial', texto: horasTexto(horas), titulo, extra };
  if (estado === 'NO_ASISTIO') return { tipo: 'falta', texto: 'F', titulo, extra: 0 };
  if (estado === 'SIN_REGISTRO') return { tipo: 'sin-registro', texto: '·', titulo, extra: 0 };
  return { tipo: 'justificada', texto: LETRA_ESTADO[estado] ?? '?', titulo, extra: 0 };
}

/** Filas del calendario a partir de lo guardado en el frente. */
export function filasDesdeCalendario(cal: CalendarioMesModel): FilaCalendario[] {
  return cal.trabajadores.map((t) => {
    const celdas: Record<string, CeldaCalendario> = {};
    for (const d of t.dias) {
      const horario = d.horaEntrada && d.horaSalida ? `${d.horaEntrada}–${d.horaSalida}` : '';
      celdas[d.fecha] = celda(String(d.estadoAsistencia), num(d.horas), num(d.horasExtra), horario);
    }
    return {
      clave: String(t.empleadoId),
      nombre: t.nombre,
      documento: t.documento,
      diasAsistidos: t.diasAsistidos,
      faltas: t.faltas,
      horas: num(t.horas),
      horasExtra: num(t.horasExtra),
      celdas,
    };
  });
}

/**
 * Filas del calendario a partir de la validación del Excel (antes de importar):
 * lo que quedaría registrado, con los errores y advertencias marcados en su día.
 */
export function filasDesdeImportacion(filas: ResultadoFilaMarcajeModel[]): FilaCalendario[] {
  const porTrabajador = new Map<string, FilaCalendario>();
  for (const f of filas) {
    if (!f.fecha || f.resultado === 'OMITIDA') continue;
    const clave = f.documento ?? `fila-${f.fila}`;
    let fila = porTrabajador.get(clave);
    if (!fila) {
      fila = {
        clave,
        nombre: f.empleado ?? `Documento ${f.documento ?? '—'}`,
        documento: f.documento ?? '',
        diasAsistidos: 0,
        faltas: 0,
        horas: 0,
        horasExtra: 0,
        celdas: {},
      };
      porTrabajador.set(clave, fila);
    }
    const horas = num(f.horasTrabajadas);
    const extra = num(f.horasExtra);
    if (f.resultado === 'ERROR') {
      fila.celdas[f.fecha] = { tipo: 'error', texto: '!', titulo: `Fila ${f.fila}: ${f.mensaje ?? 'error'}`, extra: 0 };
      continue;
    }
    const estado = f.estadoAsistencia ?? 'ASISTIO';
    const c = celda(estado, horas, extra, `Fila ${f.fila}`);
    if (f.resultado === 'ADVERTENCIA') {
      c.titulo += ` · ${f.mensaje ?? ''}`;
      if (c.tipo === 'asistio') c.tipo = 'aviso';
    }
    fila.celdas[f.fecha] = c;
    if (estado === 'ASISTIO' || estado === 'LLEGO_TARDE' || estado === 'SALIO_TEMPRANO') fila.diasAsistidos++;
    if (estado === 'NO_ASISTIO') fila.faltas++;
    fila.horas += horas;
    fila.horasExtra += extra;
  }
  return [...porTrabajador.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}
