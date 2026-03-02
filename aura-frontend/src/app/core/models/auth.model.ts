export interface AuthResponse {
  token: string;
  tipoToken: string;
  usuarioId: number;
  username: string;
  nombreCompleto: string;
  rol: string;
  facturaElectronica?: boolean;
  sucursales: SucursalAuth[];
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
