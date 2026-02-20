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
  TipoMovimiento,
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

  getSeverity(tipo: TipoMovimiento): TagSeverity {
    const entradas: TipoMovimiento[] = [
      'COMPRA',
      'ANULACION_VENTA',
      'ANULACION_MERMA',
      'TRASLADO_ENTRADA',
      'ANULACION_COMPRA',
    ];

    const salidas: TipoMovimiento[] = [
      'VENTA',
      'MERMA',
      'TRASLADO_SALIDA',
      'ANULACION_TRASLADO',
    ];

    if (entradas.includes(tipo)) return 'success';
    if (salidas.includes(tipo)) return 'danger';
    return 'secondary';
  }

  getLabelTipo(tipo: TipoMovimiento): string {
    const map: Record<TipoMovimiento, string> = {
      COMPRA: 'Compra',
      ANULACION_COMPRA: 'Anulación compra',
      VENTA: 'Venta',
      ANULACION_VENTA: 'Anulación venta',
      MERMA: 'Merma',
      ANULACION_MERMA: 'Anulación merma',
      TRASLADO_SALIDA: 'Traslado salida',
      TRASLADO_ENTRADA: 'Traslado entrada',
      ANULACION_TRASLADO: 'Anulación traslado',
    };
    return map[tipo] ?? tipo;
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
