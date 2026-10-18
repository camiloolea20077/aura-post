import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { ProductoService } from '../../../core/services/producto.service';
import {
  HistorialCostoProductoModel,
  ORIGEN_COSTO,
  variacionCosto,
} from '../../../core/models/producto.model';
import { FechaEsPipe } from '../../pipes/fecha-es.pipe';

/**
 * Historial de costos de un producto: cómo cambió su costo promedio (y qué
 * documento lo movió) y a cuánto se compró cada vez. Sirve para revisar la
 * utilidad o liquidar entre socios. Se abre desde Productos y desde Compras.
 */
@Component({
  selector: 'app-historial-costo-producto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule, TableModule, TagModule, TabViewModule, TooltipModule, FechaEsPipe],
  templateUrl: './historial-costo-producto.component.html',
  styleUrls: ['./historial-costo-producto.component.scss'],
})
export class HistorialCostoProductoComponent implements OnChanges {
  @Input() visible = false;
  @Input() productoId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  historial: HistorialCostoProductoModel | null = null;
  loading = false;
  error = false;

  readonly variacion = variacionCosto;

  constructor(
    private readonly productoService: ProductoService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['visible'] || changes['productoId']) && this.visible && this.productoId) {
      this.cargar();
    }
  }

  /** Trae el historial del producto seleccionado. */
  async cargar(): Promise<void> {
    if (!this.productoId) return;
    this.loading = true;
    this.error = false;
    this.historial = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.productoService.historialCostos(this.productoId));
      this.historial = res?.data ?? null;
    } catch {
      this.error = true;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  origenLabel(origen: string): string {
    return ORIGEN_COSTO[origen]?.label ?? origen;
  }

  origenSeverity(origen: string) {
    return ORIGEN_COSTO[origen]?.severity ?? 'secondary';
  }

  esAnulada(estado: string | null): boolean {
    return (estado ?? '').toUpperCase() === 'ANULADA';
  }

  esNotaCredito(tipo: string | null): boolean {
    return (tipo ?? '').toUpperCase() === 'NOTA_CREDITO';
  }

  formatCOP(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(v));
  }
}
