type Operations = 'ADD' | 'SUBTRACT';

export const LOCALE = 'es-CO';

const parseDate = (date: Date | string): Date => {
  const parsed = date instanceof Date ? new Date(date) : new Date(date);

  if (isNaN(parsed.getTime())) {
    throw new Error('La fecha proporcionada no es válida.');
  }

  return parsed;
};

export const getLocaleDateString = (date: Date | string): string => {
  return parseDate(date).toLocaleDateString(LOCALE);
};

export const getLocaleTimeString = (date: Date | string): string => {
  return parseDate(date).toLocaleTimeString(LOCALE);
};

export const getLocaleDateTimeString = (date: Date | string): string => {
  return parseDate(date).toLocaleString(LOCALE);
};

// new Date('5/3/2026 23:52:22')
/**
 * Formatear una fecha con un fotmato desde params
 * @param dateInput > fecha tipo `String` | `Date`
 * @param format `YYYY` `yyyy` `YY` `yy` `MM` `dd` `HH` `hh` `mm` `ss` `H` `h` `ampm` -> `yyyy-MM-dd`
 * @returns fecha string
 * @example
 * formatDate('2022-01-01', 'yyyy-MM-dd') // 2022-01-01
 * formatDate(new Date(), 'yyyy-MM-dd') // 2022-01-01
 * formatDate('2022-01-01', 'yyyy/MM/dd') // 2022/01/01
 * formatDate('2022-01-01', 'YYYY/MM/dd HH:mm:ss') // 2022/01/01 00:00:00
 * formatDate('2022-01-01', 'yyyy/MM/dd HH:mm:ss ampm') // 2022/01/01 00:00:00 am
 * formatDate('2022-01-01', 'yy/MM/dd HH:mm:ss ampm') // 22/01/01 00:00:00 pm
 * formatDate('2022-01-01', 'YY/MM/dd HH:mm:ss ampm') // 22/01/01 00:00:00 pm
 * formatDate('2022-01-01', 'yyyy-MM-dd HH:mm:ss ampm') // 2022-01-01 00:00:00 pm
 */
export const formatDate = (
  dateInput: Date | string,
  format: string,
): string => {
  const date = parseDate(dateInput);

  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');

  const tokens: Record<string, string> = {
    yyyy: date.getFullYear().toString(),
    YYYY: date.getFullYear().toString(),

    yy: date.getFullYear().toString().slice(-2),
    YY: date.getFullYear().toString().slice(-2),

    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),

    HH: pad(date.getHours()),
    H: date.getHours().toString(),

    hh: pad(date.getHours() % 12 || 12),
    h: (date.getHours() % 12 || 12).toString(),

    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),

    ampm: date.getHours() < 12 ? 'am' : 'pm',
  };

  return format.replace(
    /yyyy|YYYY|yy|YY|MM|dd|HH|H|hh|h|mm|ss|ampm/g,
    (match) => tokens[match],
  );
};

/**
 * AGREGA O RESTA DIAS A UNA FECHA
 *
 * @param date string | Date > si es un string vacio, toma la fecha actual
 * @param days number > numeros de dias a agregar o restar
 * @param operation string > 'ADD' | 'SUBTRACT'
 * @returns new Date() > fecha con la operacion realizada (ADD | SUBTRACT)
 * @example
 * addOrSubtractDaysDate('2020-01-01', 10, 'ADD') // 2020-01-11
 * addOrSubtractDaysDate('2020-01-01', 10, 'SUBTRACT') // 2020-01-01
 * addOrSubtractDaysDate(new Date('2020-01-01'), 10, 'ADD') // 2020-01-11
 * addOrSubtractDaysDate('', 10, 'ADD') // 2023-05-11 (fecha actual + 10 dias)
 * addOrSubtractDaysDate(new Date(), 10, 'ADD') // 2023-05-11 (fecha actual + 10 dias)
 * addOrSubtractDaysDate('invalid date', 10, 'ADD') // Error: La fecha proporcionada no es válida.
 */
export const addOrSubtractDaysDate = (
  date: string | Date,
  days: number,
  operation: Operations = 'ADD',
): Date => {
  const base = parseDate(date);

  const result = new Date(base);

  result.setDate(
    operation === 'ADD' ? base.getDate() + days : base.getDate() - days,
  );

  return result;
};
