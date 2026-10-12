import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Rango salarial del cargo: mínimo ≤ referencia ≤ máximo (con los que vengan).
 * El back aplica la misma regla; aquí solo se avisa antes de enviar.
 *
 * Error: `{ rangoSalarial: 'mensaje' }` sobre el grupo.
 */
export const rangoSalarialValidator: ValidatorFn = (
  g: AbstractControl,
): ValidationErrors | null => {
  const min: number | null = g.get('salarioMinimo')?.value ?? null;
  const ref: number | null = g.get('salarioReferencia')?.value ?? null;
  const max: number | null = g.get('salarioMaximo')?.value ?? null;

  if (min != null && max != null && min > max)
    return {
      rangoSalarial: 'El salario mínimo no puede ser mayor que el máximo.',
    };
  if (ref != null && min != null && ref < min)
    return {
      rangoSalarial: 'El salario de referencia es menor que el mínimo.',
    };
  if (ref != null && max != null && ref > max)
    return {
      rangoSalarial: 'El salario de referencia es mayor que el máximo.',
    };
  return null;
};
