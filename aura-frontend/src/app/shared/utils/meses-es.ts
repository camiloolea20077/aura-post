/**
 * Nombres de meses y días en español. Fuente única: la usan la traducción
 * de PrimeNG (calendarios) y el pipe `fechaEs`, para que el calendario y las
 * tablas digan lo mismo.
 */
export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/** Empieza en domingo: así numera los días `Date.getDay()` y PrimeNG. */
export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

export const DIAS_MIN = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/** Primera letra en mayúscula: "septiembre" → "Septiembre". */
export const capitalizar = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
