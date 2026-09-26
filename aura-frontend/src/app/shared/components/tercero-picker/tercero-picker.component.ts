import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { TerceroTableModel } from '../../../core/models/tercero.model';
import { RolTercero } from '../buscador-tercero-dialog/buscador-tercero-dialog.component';
import { TerceroAutocompleteComponent } from '../tercero-autocomplete/tercero-autocomplete.component';

/**
 * Envoltura de compatibilidad sobre {@link TerceroAutocompleteComponent}:
 * conserva la API de siempre ([terceroId], [terceroNombre], filtro,
 * (seleccionado) con {id, nombre}) para las pantallas que ya lo usan.
 *
 * Para pantallas nuevas usar directamente `<app-tercero-autocomplete>`, que
 * además funciona con formControlName / ngModel.
 */
@Component({
  selector: 'app-tercero-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TerceroAutocompleteComponent],
  template: `
    <app-tercero-autocomplete
      [terceroId]="terceroId"
      [label]="terceroNombre"
      [placeholder]="placeholder"
      [rol]="rol"
      [appendTo]="appendTo"
      (seleccionado)="onSeleccionado($event)"
    />
  `,
})
export class TerceroPickerComponent {
  @Input() terceroId: number | null = null;
  @Input() terceroNombre: string | null = null;
  @Input() placeholder = 'Escriba nombre o documento…';
  @Input() filtro: 'TODOS' | 'CLIENTE' | 'PROVEEDOR' | 'BANCO' = 'TODOS';
  @Input() appendTo: any = null;

  @Output() seleccionado = new EventEmitter<{
    id: number;
    nombre: string;
  } | null>();

  get rol(): RolTercero | null {
    return this.filtro === 'TODOS' ? null : this.filtro;
  }

  onSeleccionado(t: TerceroTableModel | null): void {
    this.seleccionado.emit(t ? { id: t.id, nombre: t.nombreCompleto } : null);
  }
}
