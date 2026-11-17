import {
  EquipoServicio,
  EstadoOrdenServicio,
  GuardarOrdenServicio,
  TipoEquipo,
  TipoItemServicio,
} from '../../core/models/servicio-tecnico.model';

type Severidad = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast';

/** Etiqueta, color e ícono de cada estado. */
export const ESTADOS_SERVICIO: Record<EstadoOrdenServicio, { label: string; severity: Severidad; icon: string }> = {
  RECIBIDO: { label: 'Recibido', severity: 'secondary', icon: 'pi pi-inbox' },
  EN_DIAGNOSTICO: { label: 'En diagnóstico', severity: 'info', icon: 'pi pi-search' },
  ESPERANDO_APROBACION: { label: 'Esperando aprobación', severity: 'warn', icon: 'pi pi-user' },
  ESPERANDO_REPUESTO: { label: 'Esperando repuesto', severity: 'warn', icon: 'pi pi-box' },
  EN_REPARACION: { label: 'En reparación', severity: 'info', icon: 'pi pi-wrench' },
  LISTO: { label: 'Listo para entregar', severity: 'success', icon: 'pi pi-check-circle' },
  NO_REPARADO: { label: 'No reparado', severity: 'danger', icon: 'pi pi-times-circle' },
  ENTREGADO: { label: 'Entregado', severity: 'contrast', icon: 'pi pi-sign-out' },
  CANCELADO: { label: 'Cancelado', severity: 'danger', icon: 'pi pi-ban' },
};

/** Tono del LED de cada estado: ingreso, en el banco, esperando, listo, alerta o cerrado. */
export type TonoEstado = 'ingreso' | 'banco' | 'espera' | 'listo' | 'alerta' | 'cerrado';

export function tonoEstado(e: EstadoOrdenServicio): TonoEstado {
  switch (e) {
    case 'EN_DIAGNOSTICO':
    case 'EN_REPARACION':
      return 'banco';
    case 'ESPERANDO_APROBACION':
    case 'ESPERANDO_REPUESTO':
      return 'espera';
    case 'LISTO':
      return 'listo';
    case 'NO_REPARADO':
      return 'alerta';
    case 'ENTREGADO':
    case 'CANCELADO':
      return 'cerrado';
    default:
      return 'ingreso';
  }
}

/** El recorrido que ve todo el mundo (taller y cliente). Las esperas son pausas dentro de él. */
export const RECORRIDO: { estado: EstadoOrdenServicio; label: string }[] = [
  { estado: 'RECIBIDO', label: 'Recibido' },
  { estado: 'EN_DIAGNOSTICO', label: 'Diagnóstico' },
  { estado: 'EN_REPARACION', label: 'Reparación' },
  { estado: 'LISTO', label: 'Listo' },
  { estado: 'ENTREGADO', label: 'Entregado' },
];

/** En qué paso del recorrido va la orden (las esperas y "no reparado" caen en su paso). */
export function pasoDelRecorrido(e: EstadoOrdenServicio): number {
  switch (e) {
    case 'ESPERANDO_APROBACION':
      return 1;
    case 'ESPERANDO_REPUESTO':
      return 2;
    case 'NO_REPARADO':
      return 3;
    case 'CANCELADO':
      return -1;
    default:
      return Math.max(0, RECORRIDO.findIndex((p) => p.estado === e));
  }
}

/** Días que el equipo lleva (o llevó) en el taller. */
export function diasEnTaller(recibido: string | null | undefined, entregado?: string | null): number {
  if (!recibido) return 0;
  const fin = entregado ? new Date(entregado) : new Date();
  return Math.max(0, Math.floor((fin.getTime() - new Date(recibido).getTime()) / 86_400_000));
}

export function textoDias(d: number): string {
  return d === 0 ? 'Hoy' : d === 1 ? '1 día' : `${d} días`;
}

export const ORDEN_ESTADOS: EstadoOrdenServicio[] = [
  'RECIBIDO',
  'EN_DIAGNOSTICO',
  'ESPERANDO_APROBACION',
  'ESPERANDO_REPUESTO',
  'EN_REPARACION',
  'LISTO',
  'NO_REPARADO',
  'ENTREGADO',
  'CANCELADO',
];

export const TIPOS_EQUIPO: { label: string; value: TipoEquipo; icon: string }[] = [
  { label: 'Celular', value: 'CELULAR', icon: 'pi pi-mobile' },
  { label: 'Tablet', value: 'TABLET', icon: 'pi pi-tablet' },
  { label: 'Portátil', value: 'PORTATIL', icon: 'pi pi-desktop' },
  { label: 'Reloj', value: 'RELOJ', icon: 'pi pi-clock' },
  { label: 'Consola', value: 'CONSOLA', icon: 'pi pi-play' },
  { label: 'Otro', value: 'OTRO', icon: 'pi pi-box' },
];

export const TIPOS_ITEM: { label: string; value: TipoItemServicio }[] = [
  { label: 'Repuesto', value: 'REPUESTO' },
  { label: 'Mano de obra', value: 'MANO_OBRA' },
  { label: 'Otro', value: 'OTRO' },
];

export const ACCESORIOS = ['CARGADOR', 'CABLE', 'FUNDA', 'SIM', 'MEMORIA', 'LÁPIZ', 'CAJA'];
export const ESTADO_FISICO = [
  'PANTALLA ROTA',
  'TAPA ROTA',
  'RAYONES',
  'GOLPES',
  'HUMEDAD',
  'BOTONES DAÑADOS',
  'CÁMARA DAÑADA',
];

export function iconoEquipo(tipo: TipoEquipo | null | undefined): string {
  return TIPOS_EQUIPO.find((t) => t.value === tipo)?.icon ?? 'pi pi-mobile';
}

export function etiquetaEquipo(tipo: TipoEquipo | null | undefined): string {
  return TIPOS_EQUIPO.find((t) => t.value === tipo)?.label ?? 'Equipo';
}

/** Formulario vacío de recepción. */
export function ordenVacia(garantiaDias: number | null = null): GuardarOrdenServicio {
  return {
    clienteId: null,
    contactoTelefono: null,
    contactoEmail: null,
    tecnicoId: null,
    prioridad: 'NORMAL',
    fechaEstimada: null,
    diagnostico: null,
    trabajoRealizado: null,
    observaciones: null,
    garantiaDias,
    equipo: equipoVacio(),
  };
}

export function equipoVacio(): EquipoServicio {
  return {
    tipo: 'CELULAR',
    marca: '',
    modelo: '',
    imei: null,
    imei2: null,
    serial: null,
    color: null,
    accesorios: [],
    estadoFisico: [],
    enciende: true,
    problemasReportados: '',
  };
}

/**
 * Valida un IMEI igual que el backend (15 dígitos + Luhn). Devuelve el mensaje de
 * error o null si está bien o vacío.
 */
export function errorImei(valor: string | null | undefined): string | null {
  if (!valor || !valor.trim()) return null;
  const d = valor.replace(/[\s\-/.]/g, '');
  if (!/^\d{15}$/.test(d)) return 'Debe tener 15 dígitos (marque *#06# en el equipo)';
  let suma = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    suma += n;
  }
  return suma % 10 === 0 ? null : 'No es válido: revise los dígitos';
}

/** Lado mayor de la foto después de comprimir. */
const LADO_MAX = 1600;

/**
 * Comprime una foto del celular a JPG de máximo 1600 px (una foto de 4 MB queda
 * en ~300 KB). Si el navegador no puede, devuelve el archivo tal cual.
 */
export async function comprimirFoto(file: File): Promise<{ blob: Blob; nombre: string }> {
  const base = file.name.replace(/\.[^.]+$/, '') || 'foto';
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
    if (blob) return { blob, nombre: `${base}.jpg` };
  } catch {
    // Formato que el navegador no abre (HEIC en algunos equipos): va tal cual.
  }
  return { blob: file, nombre: file.name };
}
