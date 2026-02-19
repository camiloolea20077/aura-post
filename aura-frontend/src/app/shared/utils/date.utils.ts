type Operations = 'ADD' | 'SUBTRACT'
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
  format: string
): string => {
  let date: Date
  if (typeof dateInput === 'string') {
    date = new Date(dateInput)
  } else {
    date = dateInput
  }

  const padZero = (num: number, length: number = 2): string => {
    return num.toString().padStart(length, '0')
  }

  const dateParts: { [key: string]: string } = {
    yyyy: date.getFullYear().toString(),
    yy: date.getFullYear().toString().slice(-2),
    MM: padZero(date.getMonth() + 1),
    dd: padZero(date.getDate()),
    HH: padZero(date.getHours()),
    H: date.getHours().toString(),
    hh: padZero(date.getHours() % 12 || 12),
    h: (date.getHours() % 12 || 12).toString(),
    mm: padZero(date.getMinutes()),
    ss: padZero(date.getSeconds()),
    ampm: date.getHours() < 12 ? 'am' : 'pm',
  }

  let formattedDate = format
  formattedDate = formattedDate.replace(/yyyy/g, dateParts['yyyy'])
  formattedDate = formattedDate.replace(/YYYY/g, dateParts['yyyy'])
  formattedDate = formattedDate.replace(/YY/g, dateParts['yy'])
  formattedDate = formattedDate.replace(/yy/g, dateParts['yy'])
  formattedDate = formattedDate.replace(/MM/g, dateParts['MM'])
  formattedDate = formattedDate.replace(/dd/g, dateParts['dd'])
  formattedDate = formattedDate.replace(/HH/g, dateParts['HH'])
  formattedDate = formattedDate.replace(/H/g, dateParts['H'])
  formattedDate = formattedDate.replace(/hh/g, dateParts['hh'])
  formattedDate = formattedDate.replace(/h/g, dateParts['h'])
  formattedDate = formattedDate.replace(/mm/g, dateParts['mm'])
  formattedDate = formattedDate.replace(/ss/g, dateParts['ss'])
  formattedDate = formattedDate.replace(/ampm/g, dateParts['ampm'])

  return formattedDate
}

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
  operation: Operations = 'ADD'
): Date => {
  const dateOrigin =
    date instanceof Date ? date : date !== '' ? new Date(date) : new Date()

  if (isNaN(dateOrigin.getTime())) {
    throw new Error('La fecha proporcionada no es válida.')
  }

  const resultDate = new Date(dateOrigin)
  if (operation === 'ADD') {
    resultDate.setDate(dateOrigin.getDate() + days)
  } else {
    resultDate.setDate(dateOrigin.getDate() - days)
  }

  return resultDate
}
