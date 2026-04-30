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
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';
import { InventarioService } from '../../../../core/services/inventario.service';
import {
  HistorialMovimiento,
  HistorialProductoResponse,
} from '../../../../core/models/inventario.model';

@Component({
  selector: 'app-historial-producto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule, TableModule, TagModule, SkeletonModule],
  templateUrl: './historial-producto.component.html',
  styleUrls: ['./historial-producto.component.scss'],
})
export class HistorialProductoComponent implements OnChanges {
  @Input() visible = false;
  @Input() productoId: number | null = null;
  @Input() productoNombre = '';
  @Input() productoSku: string | null = null;
  @Input() sucursalId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  movimientos: HistorialMovimiento[] = [];
  loading = false;

  constructor(
    private readonly inventarioService: InventarioService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.productoId && this.sucursalId) {
      this.loadHistorial();
    }
  }

  async loadHistorial(): Promise<void> {
    if (!this.productoId || !this.sucursalId) return;
    
    this.loading = true;
    this.movimientos = [];
    this.cdr.markForCheck();

    try {
      const res = await lastValueFrom(
        this.inventarioService.historialProducto(this.productoId, this.sucursalId),
      );
      this.movimientos = res?.data?.movimientos ?? [];
    } catch {
      this.movimientos = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  getTipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      COMPRA: 'Compra',
      VENTA: 'Venta',
      MERMA: 'Merma',
      TRASLADO_ENTRADA: 'Traslado entrada',
      TRASLADO_SALIDA: 'Traslado salida',
      AJUSTE: 'Ajuste',
    };
    return map[tipo] ?? tipo;
  }

  getTipoSeverity(tipo: string): 'success' | 'danger' | 'warn' | 'info' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'danger' | 'warn' | 'info' | 'secondary'> = {
      COMPRA: 'success',
      VENTA: 'danger',
      MERMA: 'warn',
      TRASLADO_ENTRADA: 'info',
      TRASLADO_SALIDA: 'info',
      AJUSTE: 'secondary',
    };
    return map[tipo];
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}