import { FormControl, ValidatorFn, Validators } from '@angular/forms';

import {
  AtributoCatalogoModel,
  ValorAtributo,
} from '../../../../core/models/nomina-parametros.model';

/**
 * Reglas de los campos propios de un catálogo de nómina, fuera del componente:
 * el formulario y la tabla solo las consumen. El back valida lo mismo.
 */

/** Opciones Sí/No para atributos booleanos (select, nunca switch). */
export const OPCIONES_SI_NO = [
  { label: 'Sí', value: true },
  { label: 'No', value: false },
];

/** Validadores del atributo según su tipo, rango y obligatoriedad. */
export function validadoresAtributo(a: AtributoCatalogoModel): ValidatorFn[] {
  const v: ValidatorFn[] = [];
  if (a.obligatorio) v.push(Validators.required);
  if (a.minimo != null) v.push(Validators.min(a.minimo));
  if (a.maximo != null) v.push(Validators.max(a.maximo));
  return v;
}

/** Valor con el que arranca el campo al crear un elemento. */
export function valorInicialAtributo(a: AtributoCatalogoModel): ValorAtributo {
  if (a.tipo === 'BOOLEANO') return false;
  return null;
}

/** Control del formulario para un atributo, con el valor que traiga el elemento. */
export function controlAtributo(
  a: AtributoCatalogoModel,
  valor: ValorAtributo | undefined,
): FormControl {
  return new FormControl(
    valor ?? valorInicialAtributo(a),
    validadoresAtributo(a),
  );
}

/** Cómo se muestra el atributo en la tabla. */
export function textoAtributo(
  a: AtributoCatalogoModel,
  valor: ValorAtributo | undefined,
): string {
  if (valor == null || valor === '') return '—';
  switch (a.tipo) {
    case 'BOOLEANO':
      return valor ? 'Sí' : 'No';
    case 'DECIMAL':
      return Number(valor).toLocaleString('es-CO', {
        maximumFractionDigits: 4,
      });
    default:
      return String(valor);
  }
}

/** Decimales que admite el input numérico del atributo. */
export function decimalesAtributo(a: AtributoCatalogoModel): number {
  return a.tipo === 'DECIMAL' ? 4 : 0;
}
