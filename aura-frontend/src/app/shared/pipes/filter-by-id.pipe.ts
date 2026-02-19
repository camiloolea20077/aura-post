import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterById',
  standalone: true,
})
export class FilterByIdPipe implements PipeTransform {
  transform(
    options: { label: string; value: number }[],
    id: number | null | undefined,
  ): string {
    if (!options || id == null) return '';
    return options.find((o) => o.value === id)?.label ?? '';
  }
}
