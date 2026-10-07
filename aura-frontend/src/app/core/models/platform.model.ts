// ─── Empresa ──────────────────────────────────────────────────
export interface EmpresaPlataformaModel {
  id: number;
  razonSocial: string;
  nombreComercial: string | null;
  nit: string;
  dv: string | null;
  logoUrl: string | null;
  telefono: string | null;
  municipio: string | null;
  municipioId: number | null;
  activa: boolean;
  modoContabilizacion?: string | null;
  createdAt: string;
  totalSucursales: number;
  totalUsuarios: number;
  totalVentas: number;
  // Facturación electrónica (Factus)
  facturaElectronica: boolean;
  factusClientId: string | null;
  factusClientSecret: string | null;
  factusUsername: string | null;
  factusPassword: string | null;
  factusNumberingRangeId: number | null;
  factusPrefijo: string | null;
}

export interface EmpresaTableModel {
  id: number;
  razonSocial: string;
  nombreComercial: string | null;
  nit: string;
  activa: boolean;
  createdAt: string;
  totalSucursales: number;
  totalUsuarios: number;
  totalRows: number;
}

export interface CreateEmpresaResponseDto {
  empresa: EmpresaPlataformaModel;
  emailAdmin: string;
  passwordTemporal: string;
  resetLink: string;
}

export interface CreateEmpresaDto {
  razonSocial: string;
  nombreComercial?: string | null;
  nit: string;
  dv?: string | null;
  logoUrl?: string | null;
  telefono?: string | null;
  municipio?: string | null;
  municipioId?: number | null;
  emailAdmin: string;
  passwordAdmin: string;
  nombresAdmin: string;
  apellidosAdmin: string;
  documentoAdmin: string;
  tipoDocumentoAdmin: string;
  tipoPersonaAdmin: string;
  regimenAdmin: string;
  granContribuyenteAdmin: boolean;
  autoRetenedorAdmin: boolean;
  paisAdmin: string;
  codigoPaisAdmin: string;
  nombreSucursal: string;
  modoContabilizacion?: string;
  /** Submódulos que tendrá la empresa (sus grupos y módulos se activan solos). */
  submodulos?: number[];
  /** Líneas de uso (POS, COMERCIAL, CONTABILIDAD, NOMINA); vacío = se trata como POS. */
  lineas?: string[];
  // Facturación electrónica (Factus)
  facturaElectronica?: boolean;
  factusClientId?: string;
  factusClientSecret?: string;
  factusUsername?: string;
  factusPassword?: string;
  factusNumberingRangeId?: number | null;
  factusPrefijo?: string;
}

export interface UpdateEmpresaDto {
  razonSocial?: string;
  nombreComercial?: string | null;
  dv?: string | null;
  logoUrl?: string | null;
  telefono?: string | null;
  municipio?: string | null;
  municipioId?: number | null;
  activa?: boolean;
  modoContabilizacion?: string;
  // Facturación electrónica (Factus)
  facturaElectronica?: boolean;
  factusClientId?: string;
  factusClientSecret?: string;
  factusUsername?: string;
  factusPassword?: string;
  factusNumberingRangeId?: number | null;
  factusPrefijo?: string;
}

// ─── Dashboard ────────────────────────────────────────────────
export interface DashboardPlataformaModel {
  totalEmpresas: number;
  empresasActivas: number;
  empresasInactivas: number;
  nuevasEsteMes: number;
  ultimasEmpresas: EmpresaTableModel[];
}

// ─── Pageable ─────────────────────────────────────────────────
export interface EmpresaPageableDto {
  page: number;
  rows: number;
  search?: string | null;
  order_by?: string | null;
  order?: string | null;
}

// ─── Error Logs ───────────────────────────────────────────────
export type ErrorCategoria = 'info' | 'warn' | 'danger';

export interface ErrorLogModel {
  id: number;
  empresaId: number | null;
  empresaNombre: string | null;
  metodo: string;
  endpoint: string;
  statusCode: number;
  categoria: ErrorCategoria;
  mensaje: string;
  detalle: string | null;
  usuarioId: number | null;
  usuarioNombre: string | null;
  ipOrigen: string | null;
  grupoHash: string;
  createdAt: string;
}

export interface ErrorLogGrupoModel {
  grupoHash: string;
  metodo: string;
  endpoint: string;
  statusCode: number;
  categoria: ErrorCategoria;
  totalOcurrencias: number;
  ultimaOcurrencia: string;
  empresasAfectadas: number;
}

export interface ErrorLogPageableDto {
  page: number;
  rows: number;
  categoria?: ErrorCategoria | null;
  empresaId?: number | null;
  statusCode?: number | null;
  endpoint?: string | null;
  desde?: string | null;
  hasta?: string | null;
}

export interface ErrorLogGrupoPageableDto {
  page: number;
  rows: number;
  categoria?: ErrorCategoria | null;
  desde?: string | null;
  hasta?: string | null;
}

// ─── Líneas de uso (docs/PLAN_PERFIL_EMPRESA.md del back) ─────────────────────

export type CodigoLineaUso = 'POS' | 'COMERCIAL' | 'CONTABILIDAD' | 'NOMINA';

export interface LineaUsoModel {
  codigo: CodigoLineaUso;
  nombre: string;
  descripcion: string;
  /** Submódulos que trae marcados en el árbol (incluye la base común). */
  submodulos: number[];
  /** Submódulos sin los cuales la línea no tiene sentido. */
  minimos: number[];
}

export interface EstadoPasoArranque {
  paso: string;
  nombre: string;
  resultado: 'OK' | 'ERROR' | 'PENDIENTE';
  ejecutado: string | null;
  detalle: string | null;
}

export interface ConfiguracionEmpresaModel {
  empresaId: number;
  version: number;
  lineas: CodigoLineaUso[];
  /** false = nunca declaró líneas y se trata como POS. */
  declarada: boolean;
  inicio: CodigoLineaUso | null;
  inicioResuelto: CodigoLineaUso;
  arranque: EstadoPasoArranque[];
  arranquePendiente: boolean;
}

export interface ActualizarConfiguracionDto {
  lineas: string[];
  inicio: string | null;
  /** Suma los submódulos de la plantilla a los que ya tiene (no apaga nada). */
  completarModulos: boolean;
}
