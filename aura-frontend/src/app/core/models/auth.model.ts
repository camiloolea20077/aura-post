export interface AuthResponse {
  token: string;
  user: UserAuth;
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

export interface LoginDto {
  username: string;
  password: string;
}