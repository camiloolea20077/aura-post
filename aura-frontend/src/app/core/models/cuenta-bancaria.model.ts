export type TipoCuenta = 'BANCO' | 'CAJA' | 'NEQUI' | 'DAVIPLATA' | 'OTROS';

export interface CuentaBancariaModel {
  id: number;
  nombre: string;
  tipo: TipoCuenta;
  banco: string | null;
  numeroCuenta: string | null;
  titular: string | null;
  terceroId: number | null;
  terceroNombre: string | null;
  cuentaContableId: number | null;
  cuentaContableNombre: string | null;
  saldoInicial: number;
  saldoActual: number;
  activa: boolean;
  permiteSobregiro: boolean;
  cupoSobregiro: number | null;
}

export interface CreateCuentaBancariaDto {
  nombre: string;
  tipo: TipoCuenta;
  banco?: string | null;
  numeroCuenta?: string | null;
  titular?: string | null;
  terceroId?: number | null;
  cuentaContableId?: number | null;
  saldoInicial: number;
  // Sobregiro: permite saldo negativo hasta el cupo.
  permiteSobregiro?: boolean;
  cupoSobregiro?: number | null;
}

export const TIPOS_CUENTA: { label: string; value: TipoCuenta; icon: string; color: string }[] = [
  { label: 'Banco',      value: 'BANCO',      icon: 'pi pi-building', color: '#3b82f6' },
  { label: 'Caja',       value: 'CAJA',       icon: 'pi pi-inbox',    color: '#10b981' },
  { label: 'Nequi',      value: 'NEQUI',      icon: 'pi pi-mobile',   color: '#8b5cf6' },
  { label: 'Daviplata',  value: 'DAVIPLATA',  icon: 'pi pi-mobile',   color: '#f59e0b' },
  { label: 'Otros',      value: 'OTROS',      icon: 'pi pi-wallet',   color: '#64748b' },
];
