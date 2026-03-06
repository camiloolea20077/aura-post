// ─── Empresa ──────────────────────────────────────────────────
export interface EmpresaPlataformaModel {
  id: number;
  razonSocial: string;
  nombreComercial: string | null;
  nit: string;
  dv: string | null;
  logoUrl: string | null;
  activa: boolean;
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

export interface CreateEmpresaDto {
  razonSocial: string;
  nombreComercial?: string | null;
  nit: string;
  dv?: string | null;
  emailAdmin: string;
  passwordAdmin: string;
  nombresAdmin: string;
  apellidosAdmin: string;
  documentoAdmin: string;
  nombreSucursal: string;
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
  activa?: boolean;
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
