import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '../utils/date.utils';

@Pipe({
  name: 'timeLocale',
  standalone: true,
})
export class TimeLocalePipe implements PipeTransform {
  transform(value: string | Date, format: string = 'HH:mm:ss'): string {
    return formatDate(value, format);
  }
}
