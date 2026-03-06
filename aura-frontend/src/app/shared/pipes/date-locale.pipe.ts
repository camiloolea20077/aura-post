import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../utils/date.utils';

@Pipe({
  name: 'dateLocale',
  standalone: true,
})
export class DateLocalePipe implements PipeTransform {
  transform(value: string | Date, format: string = 'dd/MM/yyyy'): string {
    return formatDate(value, format);
  }
}
