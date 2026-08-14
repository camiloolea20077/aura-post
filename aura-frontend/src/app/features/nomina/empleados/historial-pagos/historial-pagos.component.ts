import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../../core/services/nomina.service';
import {
  EstadoNomina,
  HistorialPagoModel,
} from '../../../../core/models/nomina.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

/**
 * Trazabilidad de pagos de un empleado: la lista de todas sus nóminas (no
 * anuladas) con período, montos, estado y datos del pago. Se alimenta del
 * endpoint {@code GET /nomina/empleado/{id}/historial}.
 */
@Component({
  selector: 'app-historial-pagos',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, SkeletonModule],
  templateUrl: './historial-pagos.component.html',
  styleUrls: ['./historial-pagos.component.scss'],
})
export class HistorialPagosComponent implements OnChanges {
  @Input() empleadoId: number | null = null;

  public pagos: HistorialPagoModel[] = [];
  public loading = false;

  constructor(
    private readonly nominaService: NominaService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['empleadoId'] && this.empleadoId != null) {
      this.cargar();
    }
  }

  async cargar(): Promise<void> {
    if (this.empleadoId == null) return;
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.nominaService.historialPagos(this.empleadoId),
      );
      this.pagos = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el historial de pagos.');
      this.pagos = [];
    } finally {
      this.loading = false;
    }
  }

  // ─── Totales ─────────────────────────────────────────────────
  get totalPagado(): number {
    return this.pagos
      .filter((p) => p.estado === 'PAGADO')
      .reduce((s, p) => s + (p.netoPagar ?? 0), 0);
  }

  get cantidadPagadas(): number {
    return this.pagos.filter((p) => p.estado === 'PAGADO').length;
  }

  // ─── Presentación ────────────────────────────────────────────
  money(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  fecha(f: string | null | undefined): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  medioLabel(m: string | null): string {
    if (!m) return '—';
    return m === 'TRANSFERENCIA' ? 'Transferencia' : 'Efectivo';
  }

  estadoLabel(e: EstadoNomina): string {
    const map: Record<EstadoNomina, string> = {
      BORRADOR: 'Borrador',
      APROBADO: 'Aprobado',
      PAGADO: 'Pagado',
      ANULADO: 'Anulado',
    };
    return map[e] ?? e;
  }

  estadoSeverity(e: EstadoNomina): TagSeverity {
    const map: Record<EstadoNomina, TagSeverity> = {
      BORRADOR: 'warn',
      APROBADO: 'success',
      PAGADO: 'info',
      ANULADO: 'danger',
    };
    return map[e];
  }
}
