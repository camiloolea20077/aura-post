import { Pipe, PipeTransform } from '@angular/core';
import { ProductoPOS } from '../../core/models/venta.model';

export const SEARCH_RESULT_LIMIT = 100;

@Pipe({
  name: 'filterProducts',
  standalone: true,
})
export class FilterProductsPipe implements PipeTransform {
  transform(
    data: ProductoPOS[],
    search: string,
    page = 1,
    length = 10,
  ): ProductoPOS[] {
    if (search && typeof search === 'string' && search.trim().length > 0)
      return data.slice(0, SEARCH_RESULT_LIMIT);
    const startIndex = (page - 1) * length;
    const endIndex = startIndex + length;
    return data.slice(startIndex, endIndex);
  }
}
