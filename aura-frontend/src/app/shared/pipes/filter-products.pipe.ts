import { Pipe, PipeTransform } from '@angular/core';
import { ProductoPOS } from '../../core/models/venta.model';
import { filterTable } from '../utils/filter-post.model';

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
    const startIndex = (page - 1) * length;
    const endIndex = startIndex + length;
    if (!search || typeof search != 'string')
      return data.slice(startIndex, endIndex);
    return filterTable(data, search, 0, length * 2);
  }
}
