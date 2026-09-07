import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import {
  MovimientoInventarioModel,
} from '../../../../core/models/kardex.model';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;
@Component({
  selector: 'app-detalle-kardex',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    TagModule,
    SkeletonModule,
  ],
  templateUrl: './detalle-kardex.component.html',
  styleUrls: ['./detalle-kardex.component.scss'],
})
export class DetalleKardexComponent {
  @Input() visible = false;
  @Input() movimiento: MovimientoInventarioModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  close(): void {
    this.visibleChange.emit(false);
  }

  /**
   * El color y la etiqueta salen del saldo y del catálogo del backend, no de
   * listas locales: las que había aquí cubrían 9 de los 17 tipos y pintaban
   * `ANULACION_COMPRA` como entrada cuando saca stock.
   */
  getSeverity(): TagSeverity {
    return this.esEntrada ? 'success' : 'danger';
  }

  getLabelTipo(): string {
    return (
      this.movimiento?.tipoEtiqueta ?? this.movimiento?.tipoMovimiento ?? ''
    );
  }

  get deltaStock(): number {
    if (!this.movimiento) return 0;
    return this.movimiento.saldoNuevo - this.movimiento.saldoAnterior;
  }

  get esEntrada(): boolean {
    return this.deltaStock >= 0;
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
