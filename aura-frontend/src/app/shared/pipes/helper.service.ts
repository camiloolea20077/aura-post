import { Injectable } from '@angular/core'
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
} from '@angular/forms'
import { ColsModel } from '../models/cols.model'
import { addOrSubtractDaysDate, formatDate } from '../date.utils'
@Injectable({
  providedIn: 'root',
})
export class HelpersService {

  constructor(
  ) { }

  getFormControlNgClass(
    form: FormGroup,
    controlName: string,
    className: string = '|'
  ): string {
    const control = form.get(controlName) as FormControl
    return this.generateNgClass(
      control.invalid && (control.dirty || control.touched),
      className
    )
  }

  generateNgClass(condition: boolean, className: string): string {
    return condition ? className : ''
  }


  ellipsis(cutoff: number, data: string | null = null): string {
    if (data === null) {
      return ''
    }
    const datos = data ?? ''
    return datos.length > cutoff ? `${datos.substring(0, cutoff)}...` : datos
  }

  getSwitch(status: boolean | number, boolean = true): number | boolean {
    if (boolean) {
      return status === true || status === 1 ? true : false
    } else {
      return status ? 1 : 2
    }
  }

  // Pasar hora a HH:MM
  formatHour(dateString: Date | string): string {
    // Crear un objeto de fecha con la cadena proporcionada
    const date = new Date(dateString)

    // Obtener la hora y los minutos de la fecha
    const hours = date.getHours()
    const minutes = date.getMinutes()

    // Formatear la hora y los minutos para que tengan dos dígitos
    const formattedHours = this.padNumber(hours)
    const formattedMinutes = this.padNumber(minutes)

    // Devolver la hora en formato "HH:MM"
    return `${formattedHours}:${formattedMinutes}`
  }
  padNumber(num: number): string {
    return num < 10 ? '0' + num : num.toString()
  }

  // Formatear fecha
  formatDate(date: Date): string {
    const day: number = date.getDate()
    const month: number = date.getMonth() + 1 // Los meses en JavaScript comienzan desde 0, por lo que sumamos 1
    const year: number = date.getFullYear() % 100 // Obtenemos los últimos dos dígitos del año

    // Asegurémonos de que los valores tengan dos dígitos
    const formattedDay: string = this.padZero(day)
    const formattedMonth: string = this.padZero(month)
    const formattedYear: string = this.padZero(year)

    // Construimos la cadena de fecha en formato dd/mm/yy
    const formattedDate: string = `${formattedDay}/${formattedMonth}/${formattedYear}`

    return formattedDate
  }
  padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`
  }

  // Convertir una fecha en formato dd/mm/yy a yyyy-MM-dd
  convertToISODateString(fecha: string | Date): string {
    if (fecha instanceof Date) {
      // Si dateInput es un objeto Date, convertirlo a una cadena en formato yyyy-MM-dd
      return fecha.toISOString().split('T')[0]
    } else {
      // Si dateInput es una cadena, convertirla del formato dd/MM/yy a yyyy-MM-dd
      const [day, month, year] = fecha.split('/')
      const fullYear = `20${year}` // Asumiendo que el año es 2000+
      return `${fullYear}-${month}-${day}`
    }
  }


  convertPhone(phones: string): string {
    const phone = JSON.parse(phones)
    if (phone.length) {
      const phonePrincipal = phone.find(
        (elem: { type: string }) => elem.type == 'Principal'
      )
      return phonePrincipal ? phonePrincipal?.value : phone[0].value
    } else {
      return 'No registra'
    }
  }

  // Formatear fecha a dd/mm/yyyy
  formatDateDDMMYYYY(date: Date): string {
    // Obtener los componentes de la fecha
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    // Asegurar que el día y el mes tengan dos dígitos
    const formattedDay = this.padNumberDDMMYYYY(day, 2)
    const formattedMonth = this.padNumberDDMMYYYY(month, 2)

    // Formatear la fecha como "dd/mm/yyyy"
    return `${formattedDay}/${formattedMonth}/${year}`
  }

  padNumberDDMMYYYY(num: number, size: number): string {
    let numString = num.toString()
    while (numString.length < size) {
      numString = '0' + numString
    }
    return numString
  }

  formatDateObject(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    return `${day}/${month}/${year}`
  }

  formatFechaUTC(fecha: string | Date | undefined): string {
    // Crear una fecha asegurando que sea UTC para evitar desplazamientos de zona horaria
    const birthdate = new Date(fecha + 'T00:00:00Z')
    // Formatear la fecha como 'es-ES'
    const formattedBirthdate = birthdate.toLocaleDateString('es-ES', {
      timeZone: 'UTC',
    })
    return formattedBirthdate
  }

  async showActionsTable(): Promise<ColsModel | null> {
    return new ColsModel('actions', 'Acciones', 'text-center')
  }
  // Convertir HH:MM:SS a HH:mm
  convertTimeToDate(time: string): Date {
    const [hours, minutes] = time.split(':').map((part) => parseInt(part, 10))
    const date = new Date()
    date.setHours(hours, minutes, 0, 0) // seconds and milliseconds are set to 0
    return date
  }

  // Validador personalizado para la observación
  observationValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value as string
    if (!value) {
      return null
    }
    const words = value.split(' ').filter((word) => word.length >= 8)
    if (words.length >= 2) {
      return null
    } else {
      return { observationInvalid: true }
    }
  }
  /**
   * Calcular edad a partir de la fecha de nacimiento.
   */
  calculateAge(
    birthDate: Date,
    currentDate: Date = new Date(),
    format: 'días' | 'años' | 'completo' = 'completo'
  ): string | number {
    if (!birthDate) {
      return 'Fecha de nacimiento inválida';
    }

    const birth = new Date(birthDate);
    const current = new Date(currentDate);

    let years = current.getFullYear() - birth.getFullYear();
    let months = current.getMonth() - birth.getMonth();
    let days = current.getDate() - birth.getDate();

    // Ajuste para meses y días negativos
    if (days < 0) {
      months--;
      const lastMonth = new Date(current.getFullYear(), current.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    // Calcular total de días
    const totalDays = Math.floor(
      (current.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calcular total de años (decimal)
    const totalYears = totalDays / 365.25; // Considerar años bisiestos en promedio

    // Formatear según el parámetro
    if (format === 'días') {
      return totalDays;
    }

    if (format === 'años') {
      return Math.floor(totalYears); // Solo el número entero de años
    }

    // Formato detallado
    if (years === 0 && months === 0 && days < 30) {
      return `${days} días`;
    } else if (years === 0 && (months > 0 || days >= 30)) {
      return `${months} meses y ${days} días`;
    } else {
      return `${years} años, ${months} meses y ${days} días`;
    }
  }


  /**
   * Formatear una fecha con un fotmato desde params
   * @param dateInput > fecha tipo `String` | `Date`
   * @param format `YYYY` `yyyy` `YY` `yy` `MM` `dd` `HH` `hh` `mm` `ss` `H` `h` `ampm` -> `yyyy-MM-dd`
   * @returns fecha string
   */
  formatDateV2(
    dateInput: Date | string,
    format: string = 'dd/MM/yyyy'
  ): string {
    return formatDate(dateInput, format)
  }

  /**
   * Agregar días a una fecha
   * @param date string | Date > fecha inicial
   * @param days number > cantidad de días a agregar
   * @returns
   */
  addDaysToDate(date: string | Date, days: number): Date {
    return addOrSubtractDaysDate(date, days, 'ADD')
  }

  /**
   * Restar días a una fecha
   * @param date string | Date > fecha inicial
   * @param days number > cantidad de días a quitar
   * @returns
   */
  subtractDaysToDate(date: string | Date, days: number): Date {
    return addOrSubtractDaysDate(date, days, 'SUBTRACT')
  }

  convertToISODateStringDate(dateInput: string | Date): string | null {
    let date: Date
    // Verificar el tipo de entrada
    if (typeof dateInput === 'string') {
      // Si la fecha está en formato dd/mm/yyyy
      const parts = dateInput.split('/')
      if (parts.length === 3) {
        // Convertir a Date: new Date(año, mes, día)
        date = new Date(
          Number(parts[2]),
          Number(parts[1]) - 1,
          Number(parts[0])
        ) // Mes es 0-indexado
      } else {
        // Si el formato no es válido, retornar null
        return null
      }
    } else if (dateInput instanceof Date) {
      // Si ya es un objeto Date
      date = dateInput
    } else {
      return null // Si no es un string ni un Date, retornar null
    }
    // Convertir a formato yyyy-mm-dd
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0') // Meses de 0-11
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}` // Retornar en formato yyyy-mm-dd
  }

  convertToTimeString(input: string | Date): string | null {
    let date: Date
    if (typeof input === 'string') {
      // Si la entrada es un string en formato HH:MM
      const timeParts = input.split(':')
      if (timeParts.length === 2) {
        const hours = Number(timeParts[0])
        const minutes = Number(timeParts[1])
        date = new Date(1970, 0, 1, hours, minutes) // Crear un objeto Date ficticio
      } else {
        return null // Formato no válido
      }
    } else if (input instanceof Date) {
      // Si es un objeto Date, usarlo directamente
      date = input
    } else {
      return null // Entrada no válida
    }
    // Asegurarse de que la fecha sea válida
    if (isNaN(date.getTime())) {
      return null
    }
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}` // Retornar en formato HH:MM
  }
}
