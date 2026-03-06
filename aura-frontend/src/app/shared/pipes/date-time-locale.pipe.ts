import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../utils/date.utils';

@Pipe({
  name: 'dateTimeLocale',
  standalone: true,
})
export class DateTimeLocalePipe implements PipeTransform {
  transform(
    value: string | Date,
    format: string = 'dd/MM/yyyy HH:mm:ss',
  ): string {
    return formatDate(value, format);
  }
}
