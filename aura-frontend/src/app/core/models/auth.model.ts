export interface AuthResponse {
  token: string;
  tipoToken: string;
  usuarioId: number;
  username: string;
  nombreCompleto: string;
  rol: string;
  nit: string;
  empresaId: number;
  empleadoId?: number;
  logo_url?: string;
  facturaElectronica?: boolean;
  sucursales: SucursalAuth[];
  /** Sede elegida en la barra superior; sin valor = la default del login. */
  sucursalActualId?: number | null;
  /** Líneas de uso de la empresa (POS, COMERCIAL, CONTABILIDAD, NOMINA). */
  lineas?: string[] | null;
  /** Línea cuyo tablero ve al entrar. */
  inicio?: string | null;
  // ── Firma contable (docs/PLAN_FIRMA_CONTABLE.md) ──────────────
  /** true = el token es de paso (2 min): hay que elegir empresa con {@link empresas}. */
  requiereEmpresa?: boolean | null;
  empresas?: EmpresaOpcion[] | null;
  empresaNombre?: string | null;
  empresaNit?: string | null;
  /** Firma desde la que trabaja en un cliente; null en su propia empresa. */
  firmaNombre?: string | null;
  /** Tiene más de una empresa: se muestra "Cambiar empresa". */
  puedeCambiarEmpresa?: boolean | null;
  /** La empresa de la sesión es una firma contable. */
  esFirmaContable?: boolean | null;
}

/** Empresa que el usuario puede elegir: su firma (propia) o un cliente. */
export interface EmpresaOpcion {
  id: number;
  razonSocial: string;
  nombreComercial: string | null;
  nit: string;
  dv: string | null;
  logoUrl: string | null;
  propia: boolean;
}

export interface UserAuth {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  empresaId: number;
  empresaNombre: string;
  sucursalId: number;
  sucursalNombre: string;
}
export interface SucursalAuth {
  id: number;
  nombre: string;
  esDefault: boolean | null;
}
export interface LoginDto {
  username: string;
  password: string;
}

export interface BaseActivo {
  activo: boolean;
}

export interface Submodulo extends BaseActivo {
  submoduloId: number;
  submoduloCodigo: string;
  submoduloNombre: string;
}

export interface Modulo extends BaseActivo {
  moduloId: number;
  moduloCodigo: string;
  moduloNombre: string;
  submodulos: Submodulo[];
}
