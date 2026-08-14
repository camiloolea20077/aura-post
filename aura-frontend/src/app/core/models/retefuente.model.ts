/**
 * Deducciones de retención en la fuente (Fase 4.5 / backend `RetefuenteController`).
 *
 * Depuran la base de retención. Los topes legales los aplica el motor en UVT;
 * aquí solo se captura qué declaró el empleado.
 */

export type TipoDeduccion =
  | 'DEPENDIENTES'
  | 'INTERESES_VIVIENDA'
  | 'MEDICINA_PREPAGADA'
  | 'AFC'
  | 'AFP_VOLUNTARIO';

export const TIPOS_DEDUCCION: { value: TipoDeduccion; label: string; hint: string }[] = [
  { value: 'DEPENDIENTES', label: 'Dependientes', hint: '10% del ingreso, tope 32 UVT — lo calcula el motor' },
  { value: 'INTERESES_VIVIENDA', label: 'Intereses de vivienda', hint: 'Tope 100 UVT/mes' },
  { value: 'MEDICINA_PREPAGADA', label: 'Medicina prepagada', hint: 'Tope 16 UVT/mes' },
  { value: 'AFC', label: 'Cuenta AFC (renta exenta)', hint: '' },
  { value: 'AFP_VOLUNTARIO', label: 'Aporte voluntario a pensión (renta exenta)', hint: '' },
];

export interface DeduccionModel {
  id: number;
  tipo: TipoDeduccion;
  valor: number;
  vigenteDesde: string;
  vigenteHasta: string | null;
  soporte: string | null;
  /** DEPENDIENTES no lleva valor: lo calcula el motor. */
  valorLoCalculaElMotor: boolean;
}

export interface CreateDeduccionDto {
  contratoId: number;
  tipo: TipoDeduccion;
  valor?: number | null;
  vigenteDesde: string;
  vigenteHasta?: string | null;
  soporte?: string | null;
}
