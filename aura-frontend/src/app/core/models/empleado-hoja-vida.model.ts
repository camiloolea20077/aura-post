/**
 * Hoja de vida del empleado: cuentas bancarias, familiares e historial laboral.
 *
 * Backend: `EmpleadoHojaVidaController` → `/api/empleados/{empleadoId}/…`
 */

export type TipoCuentaBancaria = 'AHORROS' | 'CORRIENTE' | 'DEPOSITO_ELECTRONICO';

export interface CuentaBancaria {
  id: number;
  bancoTerceroId: number;
  bancoNombre: string | null;
  tipoCuenta: TipoCuentaBancaria;
  numeroCuenta: string;
  /** La cuenta donde se le paga la nómina (se copia al tercero). */
  principal: boolean;
  activa: boolean;
}

export interface CreateCuentaBancariaDto {
  bancoTerceroId: number;
  tipoCuenta: TipoCuentaBancaria;
  numeroCuenta: string;
  principal: boolean;
  activa: boolean;
}

export const OPCIONES_TIPO_CUENTA: { label: string; value: TipoCuentaBancaria }[] = [
  { label: 'Ahorros', value: 'AHORROS' },
  { label: 'Corriente', value: 'CORRIENTE' },
  { label: 'Depósito electrónico', value: 'DEPOSITO_ELECTRONICO' },
];

export type Parentesco =
  | 'CONYUGE'
  | 'COMPANERO'
  | 'HIJO'
  | 'HIJASTRO'
  | 'PADRE'
  | 'MADRE'
  | 'HERMANO'
  | 'ABUELO'
  | 'NIETO'
  | 'OTRO';

export interface Familiar {
  id: number;
  parentesco: Parentesco;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nombre: string;
  fechaNacimiento: string | null;
  genero: string | null;
  telefono: string | null;
  ocupacion: string | null;
  convive: boolean;
  dependeEconomicamente: boolean;
  beneficiarioCaja: boolean;
  beneficiarioSalud: boolean;
  contactoEmergencia: boolean;
}

export type CreateFamiliarDto = Omit<Familiar, 'id'>;

export const OPCIONES_PARENTESCO: { label: string; value: Parentesco }[] = [
  { label: 'Cónyuge', value: 'CONYUGE' },
  { label: 'Compañero(a) permanente', value: 'COMPANERO' },
  { label: 'Hijo(a)', value: 'HIJO' },
  { label: 'Hijastro(a)', value: 'HIJASTRO' },
  { label: 'Padre', value: 'PADRE' },
  { label: 'Madre', value: 'MADRE' },
  { label: 'Hermano(a)', value: 'HERMANO' },
  { label: 'Abuelo(a)', value: 'ABUELO' },
  { label: 'Nieto(a)', value: 'NIETO' },
  { label: 'Otro', value: 'OTRO' },
];

export interface Experiencia {
  id: number;
  empresa: string;
  cargo: string;
  fechaInicio: string;
  fechaFin: string | null;
  motivoRetiro: string | null;
  jefeInmediato: string | null;
  telefono: string | null;
  funciones: string | null;
}

export type CreateExperienciaDto = Omit<Experiencia, 'id'>;
