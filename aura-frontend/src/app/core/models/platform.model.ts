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
}

export interface UpdateEmpresaDto {
  razonSocial?: string;
  nombreComercial?: string | null;
  dv?: string | null;
  activa?: boolean;
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
