/**
 * Convierte a 'YYYY-MM-DD' para mandar a un `LocalDate` de Java.
 *
 * **No usar `toISOString()`.** Ese método convierte a UTC: en Colombia (UTC-5)
 * una fecha de nacimiento del 1 de enero se enviaría como 31 de diciembre.
 * Aquí se usan los getters locales, que respetan la fecha que el usuario eligió.
 *
 * También evita mandar la hora: Jackson rechaza un ISO completo cuando el campo
 * del backend es `LocalDate`.
 */
export function aFechaLocal(v: Date | string): string;
export function aFechaLocal(v: Date | string | null | undefined): string | null;
export function aFechaLocal(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v.split('T')[0];
  const y = v.getFullYear();
  const m = String(v.getMonth() + 1).padStart(2, '0');
  const d = String(v.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convierte a 'YYYY-MM-DDTHH:mm:ss' para mandar a un `LocalDateTime` de Java.
 *
 * **No usar `toISOString()`.** Ese método pasa a UTC y en Colombia (UTC-5) suma
 * cinco horas: una compra registrada a las 2:09 p.m. llegaba al backend como
 * 19:09 y se guardaba así, porque la base usa `timestamp without time zone` y
 * el valor se escribe tal cual. No es un problema del servidor — pasa igual con
 * el backend corriendo en hora de Colombia, porque el desfase lo mete el
 * navegador antes de enviar.
 *
 * Aquí se usan los getters locales, que respetan la hora que el usuario ve.
 */
export function aFechaHoraLocal(v: Date | string): string;
export function aFechaHoraLocal(
  v: Date | string | null | undefined,
): string | null;
export function aFechaHoraLocal(
  v: Date | string | null | undefined,
): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v;
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}` +
    `T${p(v.getHours())}:${p(v.getMinutes())}:${p(v.getSeconds())}`
  );
}

/** De 'YYYY-MM-DD' a Date, para pintar en un p-calendar. */
export function aDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  // new Date('2026-03-15') lo interpreta como UTC y puede correr el día.
  // Partirlo y usar el constructor local evita ese corrimiento.
  const [y, m, d] = v.split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
