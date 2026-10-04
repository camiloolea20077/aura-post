/** Permisos por perfil (docs/PLAN_PERMISOS.md en el backend). */

export type AccionPermiso = 'VER' | 'CREAR' | 'EDITAR' | 'ANULAR';

export const ACCIONES: AccionPermiso[] = ['VER', 'CREAR', 'EDITAR', 'ANULAR'];

/** Lo que ve y puede hacer el usuario logueado: "modulo.submodulo" → acciones. */
export interface PermisosUsuario {
  usuarioId: number | null;
  rol: string | null;
  perfilId: number | null;
  perfilNombre: string | null;
  accesoTotal: boolean;
  permisos: Record<string, AccionPermiso[]>;
  /** Acciones especiales que tiene: "modulo.submodulo:CODIGO" (V192). */
  especiales: string[];
  /** Descuento máximo sin autorización; null = sin límite. */
  descuentoMaxPct: number | null;
  /** Rebaja máxima del precio sin autorización; null = sin límite. */
  rebajaPrecioMaxPct: number | null;
  todasLasSedes: boolean;
  sucursales: number[];
}

/** Acción especial del catálogo (V192): su clave es "clave:codigo". */
export interface AccionEspecial {
  id: number;
  submoduloId: number;
  clave: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  /** Acción base de la que hereda sin valor explícito; null = solo si se da. */
  heredaDe: AccionPermiso | null;
}

/** Valor explícito de una acción especial; permitido null = heredar. */
export interface EspecialValor {
  accionId: number;
  permitido: boolean | null;
}

export interface PerfilFila {
  id: number;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  accesoTotal: boolean;
  esSistema: boolean;
  activo: boolean;
  usuarios: number;
  descuentoMaxPct: number | null;
  rebajaPrecioMaxPct: number | null;
  todasSedes: boolean;
}

/** Submódulo de la empresa, en orden de menú. */
export interface NodoArbol {
  submoduloId: number;
  moduloCodigo: string;
  moduloNombre: string;
  codigo: string;
  clave: string;
  nombre: string;
  padreId: number | null;
  esGrupo: boolean;
}

export interface Permiso {
  submoduloId: number;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  anular: boolean;
}

/** Excepción de un usuario: null = lo que diga el perfil. */
export interface PermisoExcepcion {
  submoduloId: number;
  ver: boolean | null;
  crear: boolean | null;
  editar: boolean | null;
  anular: boolean | null;
}

export interface PerfilDetalle {
  perfil: PerfilFila;
  permisos: Permiso[];
  /** Lo explícito del perfil; lo que no aparece hereda. */
  especiales: EspecialValor[];
}

export interface GuardarPerfil {
  nombre: string;
  descripcion: string | null;
  accesoTotal: boolean;
  activo: boolean;
  permisos: Permiso[];
  especiales: EspecialValor[];
  descuentoMaxPct: number | null;
  rebajaPrecioMaxPct: number | null;
  todasSedes: boolean;
}

export interface PermisosDeUsuario {
  usuarioId: number;
  username: string | null;
  rol: string | null;
  perfilId: number | null;
  perfilNombre: string | null;
  perfilAccesoTotal: boolean;
  delPerfil: Permiso[];
  excepciones: PermisoExcepcion[];
  especialesEfectivos: string[];
  especialesDelPerfil: string[];
  excepcionesEspeciales: EspecialValor[];
  perfilDescuentoMaxPct: number | null;
  perfilRebajaPrecioMaxPct: number | null;
  perfilTodasSedes: boolean;
  descuentoMaxPct: number | null;
  rebajaPrecioMaxPct: number | null;
}

export interface GuardarExcepciones {
  excepciones: PermisoExcepcion[];
  especiales: EspecialValor[];
  descuentoMaxPct: number | null;
  rebajaPrecioMaxPct: number | null;
}

export interface CambioLog {
  id: number;
  fecha: string;
  usuario: string | null;
  tipo: 'PERFIL' | 'USUARIO';
  perfil: string | null;
  usuarioAfectado: string | null;
  detalle: string | null;
}

export interface BloqueoLog {
  id: number;
  fecha: string;
  usuario: string | null;
  rol: string | null;
  perfil: string | null;
  modo: 'OBSERVAR' | 'BLOQUEAR';
  metodo: string;
  ruta: string;
  /** null = la ruta no tiene submódulo asignado en el back. */
  clave: string | null;
  /** VER…ANULAR, ESPECIAL (acción especial) o SEDE (sede que no es suya). */
  accion: AccionPermiso | 'ESPECIAL' | 'SEDE' | null;
  veces: number;
  ultimaVez: string;
}

export type ModoControl = 'APAGADO' | 'OBSERVAR' | 'BLOQUEAR';

// ── Bitácora y autorizaciones (V192) ───────────────────────────

export interface BitacoraFiltro {
  desde: string | null;
  hasta: string | null;
  usuarioId: number | null;
  clave: string | null;
  accion: string | null;
  entidad: string | null;
  entidadId: string | null;
  texto: string | null;
  page: number;
  rows: number;
}

export interface BitacoraEvento {
  id: number;
  fecha: string;
  usuarioId: number | null;
  usuario: string | null;
  autorizadoPor: string | null;
  clave: string | null;
  accion: string;
  entidad: string | null;
  entidadId: string | null;
  descripcion: string | null;
  antes: string | null;
  despues: string | null;
  metodo: string | null;
  ruta: string | null;
  ip: string | null;
  origen: 'AUTO' | 'SERVICIO';
}

export interface BitacoraPagina {
  items: BitacoraEvento[];
  total: number;
}

/** Cuánto pasa la venta el límite del usuario (lo mismo que revisa el back). */
export interface ExcesoVenta {
  descuentoPct: number;
  rebajaPct: number;
  descuentoMaxPct: number | null;
  rebajaPrecioMaxPct: number | null;
  detalle: string[];
  requiereAutorizacion: boolean;
}

/** El cajero usa el código de 6 dígitos que le dictó el supervisor (nunca una clave). */
export interface UsarCodigo {
  codigo: string;
  descuentoPct: number;
  rebajaPct: number;
  motivo: string | null;
}

/** El cajero pide aprobación remota al supervisor. */
export interface SolicitarAutorizacion {
  descuentoPct: number;
  rebajaPct: number;
  detalle: string[];
  motivo: string | null;
}

export interface CodigoGenerado {
  codigo: string;
  expiraEn: string;
  descuentoMaxPct: number | null;
  rebajaPrecioMaxPct: number | null;
}

export interface EstadoSolicitud {
  id: number;
  estado: 'SOLICITADA' | 'VIGENTE' | 'RECHAZADA' | 'VENCIDA' | 'USADA';
  autorizador: string | null;
  expiraEn: string;
}

export interface SolicitudPendiente {
  id: number;
  solicitante: string | null;
  descuentoPct: number | null;
  rebajaPct: number | null;
  detalle: string | null;
  motivo: string | null;
  fecha: string;
  expiraEn: string;
}

export interface AutorizacionDada {
  autorizacionId: number;
  autorizador: string;
  expiraEn: string;
}
