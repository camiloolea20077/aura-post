import { CellValue, Workbook } from 'exceljs';

import { FilaMarcajeDto } from '../../../core/models/asistencia-frente.model';

/** Trabajador que va en la plantilla. */
export interface TrabajadorPlantilla {
  documento: string;
  empleadoNombre: string;
  cargo: string | null;
}

/** Columnas de la plantilla, en orden. `alias` permite leer archivos con encabezados parecidos. */
const COLUMNAS: { key: keyof FilaMarcajeDto | 'nombre' | 'dia'; header: string; width: number; alias: string[] }[] = [
  { key: 'documento', header: 'Documento', width: 16, alias: ['cedula', 'cédula', 'identificacion', 'identificación'] },
  { key: 'nombre', header: 'Trabajador', width: 32, alias: ['nombre', 'empleado'] },
  { key: 'fecha', header: 'Fecha', width: 13, alias: ['dia fecha'] },
  { key: 'dia', header: 'Día', width: 11, alias: [] },
  { key: 'horaEntrada', header: 'Entrada', width: 10, alias: ['hora entrada', 'ingreso'] },
  { key: 'horaSalida', header: 'Salida', width: 10, alias: ['hora salida'] },
  { key: 'minutosDescanso', header: 'Descanso (min)', width: 15, alias: ['descanso', 'minutos descanso', 'almuerzo'] },
  { key: 'estado', header: 'Estado', width: 16, alias: ['novedad', 'asistencia'] },
  { key: 'observacion', header: 'Observación', width: 34, alias: ['observaciones', 'nota'] },
];

const ESTADOS = ['Asistió', 'No asistió', 'Llegó tarde', 'Salió temprano', 'Permiso', 'Incapacidad', 'Vacaciones', 'Suspendido'];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const AZUL = 'FF2563EB';

/**
 * Plantilla del mes: una fila por trabajador y por día, con el documento, el
 * nombre, la fecha y el día ya puestos. El usuario solo llena entrada, salida,
 * descanso y estado. Los domingos se resaltan.
 */
export async function construirPlantillaMarcaje(
  trabajadores: TrabajadorPlantilla[],
  anio: number,
  mes: number,
  nombreFrente: string,
): Promise<Blob> {
  const wb = new Workbook();
  const ws = wb.addWorksheet('Marcaje', { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.columns = COLUMNAS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUL } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  ws.getColumn('documento').numFmt = '@';
  ws.getColumn('fecha').numFmt = 'dd/mm/yyyy';
  ws.getColumn('horaEntrada').numFmt = '@';
  ws.getColumn('horaSalida').numFmt = '@';

  const ultimoDia = new Date(anio, mes, 0).getDate();
  for (const t of trabajadores) {
    for (let d = 1; d <= ultimoDia; d++) {
      // Mediodía UTC: la fecha no se corre de día por la zona horaria al guardar.
      const fecha = new Date(Date.UTC(anio, mes - 1, d, 12));
      const row = ws.addRow({
        documento: t.documento,
        nombre: t.empleadoNombre,
        fecha,
        dia: DIAS[fecha.getUTCDay()],
      });
      if (fecha.getUTCDay() === 0) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        });
      }
    }
  }
  const total = ws.rowCount;
  for (let r = 2; r <= total; r++) {
    ws.getCell(r, 8).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${ESTADOS.join(',')}"`],
    };
  }

  const ins = wb.addWorksheet('Instrucciones');
  ins.columns = [{ width: 18 }, { width: 90 }];
  ins.addRow([`Marcaje de ${nombreFrente}`]).font = { bold: true, size: 13 };
  ins.addRow([]);
  [
    ['Entrada / Salida', 'Hora en formato 24 horas: 07:00, 20:00. Si el turno pasa la medianoche, la salida es del día siguiente (p. ej. 22:00 a 06:00).'],
    ['Descanso (min)', 'Minutos de descanso del día (almuerzo, pausas). Vacío: se usa el descanso del turno del frente.'],
    ['Estado', 'Vacío con horas = Asistió. Opciones: ' + ESTADOS.join(', ') + '.'],
    ['Filas vacías', 'Los días sin entrada, salida ni estado no se registran: puede dejarlos en blanco.'],
    ['No cambie', 'Documento, Fecha ni los encabezados. Puede borrar filas o agregar trabajadores asignados al frente.'],
    ['Horas extra', 'El sistema calcula solo las horas ordinarias, extra, nocturnas y dominicales/festivas con la jornada vigente.'],
  ].forEach((r) => (ins.addRow(r).getCell(1).font = { bold: true }));

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Lee la plantilla (primera hoja) y devuelve una fila por renglón con datos.
 * Acepta horas escritas como texto ("7:00") o como hora de Excel, y fechas como
 * fecha de Excel o texto dd/mm/aaaa o aaaa-mm-dd.
 *
 * @throws Error si falta una columna obligatoria
 */
export async function leerPlantillaMarcaje(archivo: File): Promise<FilaMarcajeDto[]> {
  const wb = new Workbook();
  await wb.xlsx.load(await archivo.arrayBuffer());
  const ws = wb.getWorksheet('Marcaje') ?? wb.worksheets[0];
  if (!ws) throw new Error('El archivo no tiene hojas.');

  const columna = new Map<string, number>();
  ws.getRow(1).eachCell((cell, i) => {
    const h = normalizar(texto(cell.value));
    const col = COLUMNAS.find((c) => normalizar(c.header) === h || c.alias.some((a) => normalizar(a) === h));
    if (col) columna.set(col.key, i);
  });
  const faltan = ['documento', 'fecha', 'horaEntrada', 'horaSalida']
    .filter((k) => !columna.has(k))
    .map((k) => COLUMNAS.find((c) => c.key === k)!.header);
  if (faltan.length) throw new Error(`Faltan las columnas: ${faltan.join(', ')}. Use la plantilla del mes.`);

  const filas: FilaMarcajeDto[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const valor = (k: string): CellValue => (columna.has(k) ? row.getCell(columna.get(k)!).value : null);
    const descanso = numero(valor('minutosDescanso'));
    const f: FilaMarcajeDto = {
      fila: n,
      documento: vacioANull(texto(valor('documento'))),
      fecha: fecha(valor('fecha')),
      horaEntrada: hora(valor('horaEntrada')),
      horaSalida: hora(valor('horaSalida')),
      minutosDescanso: descanso,
      estado: vacioANull(texto(valor('estado'))),
      observacion: vacioANull(texto(valor('observacion'))),
    };
    if (f.documento || f.horaEntrada || f.horaSalida || f.estado) filas.push(f);
  });
  return filas;
}

// ── Conversión de celdas ─────────────────────────────────────────────────

function texto(v: CellValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if (v instanceof Date) return v.toISOString();
    if ('richText' in v) return v.richText.map((r) => r.text).join('');
    if ('result' in v) return texto(v.result as CellValue);
    if ('text' in v) return String(v.text);
    return '';
  }
  return String(v).trim();
}

function vacioANull(s: string): string | null {
  const t = s.trim();
  return t ? t : null;
}

function numero(v: CellValue): number | null {
  const t = texto(v).replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function dos(n: number): string {
  return String(n).padStart(2, '0');
}

/** Fecha yyyy-MM-dd. Las fechas de Excel llegan en UTC. */
function fecha(v: CellValue): string | null {
  if (v instanceof Date) return `${v.getUTCFullYear()}-${dos(v.getUTCMonth() + 1)}-${dos(v.getUTCDate())}`;
  if (typeof v === 'object' && v && 'result' in v) return fecha(v.result as CellValue);
  if (typeof v === 'number') {
    // Número de serie de Excel (días desde 1899-12-30).
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    return `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}`;
  }
  const t = texto(v);
  let m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${dos(+m[2])}-${dos(+m[1])}`;
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${dos(+m[2])}-${dos(+m[3])}`;
  return null;
}

/** Hora HH:mm. Una hora de Excel llega como Date del 30/12/1899 en UTC o como fracción del día. */
function hora(v: CellValue): string | null {
  if (v instanceof Date) return `${dos(v.getUTCHours())}:${dos(v.getUTCMinutes())}`;
  if (typeof v === 'object' && v && 'result' in v) return hora(v.result as CellValue);
  if (typeof v === 'number' && v >= 0 && v < 1) {
    const min = Math.round(v * 24 * 60);
    return `${dos(Math.floor(min / 60) % 24)}:${dos(min % 60)}`;
  }
  const t = texto(v).toLowerCase().replace(/\s+/g, '');
  if (!t) return null;
  // 7, 7:00, 07:00, 7:00am, 8pm, 20h
  const m = t.match(/^(\d{1,2})(?::|h|\.)?(\d{2})?(am|pm|a\.m\.|p\.m\.)?h?$/);
  if (!m) return t; // el back responde que no es una hora válida, con el texto tal cual
  let h = +m[1];
  const mi = m[2] ? +m[2] : 0;
  const sufijo = m[3]?.replace(/\./g, '');
  if (sufijo === 'pm' && h < 12) h += 12;
  if (sufijo === 'am' && h === 12) h = 0;
  return `${dos(h)}:${dos(mi)}`;
}

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
