import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { MessageService } from 'primeng/api';

import { TerceroService } from '../../../core/services/tercero.service';
import {
  EstadoCuentaClienteModel,
  MovimientoCuentaModel,
  TerceroTableModel,
} from '../../../core/models/tercero.model';
import { AlertService } from '../../../shared/pipes/alert.service';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-estado-cuenta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    CalendarModule,
    ToastModule,
    SkeletonModule,
    TerceroAutocompleteComponent,
  ],
  providers: [MessageService],
  templateUrl: './estado-cuenta.component.html',
  styleUrls: ['./estado-cuenta.component.scss'],
})
export class EstadoCuentaComponent implements OnInit {
  // ── Selector de cliente ─────────────────────────────────────
  clienteSeleccionado: TerceroTableModel | null = null;

  // ── Filtros fecha ───────────────────────────────────────────
  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;

  // ── Estado de cuenta ────────────────────────────────────────
  estado: EstadoCuentaClienteModel | null = null;
  loading = false;
  loadingPdf = false;

  constructor(
    private readonly terceroService: TerceroService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {}

  onClienteSeleccionado(t: TerceroTableModel | null): void {
    this.clienteSeleccionado = t;
    this.onClienteChange();
  }

  async onClienteChange(): Promise<void> {
    if (!this.clienteSeleccionado) {
      this.estado = null;
      this.cdr.markForCheck();
      return;
    }
    await this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.clienteSeleccionado) return;

    this.loading = true;
    this.cdr.markForCheck();

    try {
      const desde = this.fechaDesde
        ? aFechaLocal(this.fechaDesde)
        : undefined;
      const hasta = this.fechaHasta
        ? aFechaLocal(this.fechaHasta)
        : undefined;

      const res = await lastValueFrom(
        this.terceroService.getEstadoCuenta(
          this.clienteSeleccionado.id,
          desde,
          hasta,
        ),
      );
      this.estado = res?.data ?? null;
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo cargar el estado de cuenta',
      );
      this.estado = null;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  descargarPdf(): void {
    if (!this.clienteSeleccionado) return;
    this.loadingPdf = true;
    this.cdr.markForCheck();

    const desde = this.fechaDesde ? aFechaLocal(this.fechaDesde) : undefined;
    const hasta = this.fechaHasta ? aFechaLocal(this.fechaHasta) : undefined;

    this.terceroService.getEstadoCuentaPdf(this.clienteSeleccionado.id, desde, hasta)
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        },
        error: () => this.alert.showError('Error', 'No se pudo generar el PDF'),
        complete: () => { this.loadingPdf = false; this.cdr.markForCheck(); },
      });
  }

  limpiarFiltros(): void {
    this.fechaDesde = null;
    this.fechaHasta = null;
    if (this.clienteSeleccionado) this.cargar();
  }

  // ─── Formateo ─────────────────────────────────────────────
  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  formatFecha(f: string): string {
    if (!f) return '—';
    return new Date(f).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  getTipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      VENTA: 'Venta',
      ABONO: 'Abono',
      NOTA_CREDITO: 'Nota crédito',
      NOTA_DEBITO: 'Nota débito',
    };
    return map[tipo] ?? tipo;
  }

  getTipoSeverity(tipo: string): TagSeverity {
    const map: Record<string, TagSeverity> = {
      VENTA: 'info',
      ABONO: 'success',
      NOTA_CREDITO: 'warn',
      NOTA_DEBITO: 'danger',
    };
    return map[tipo] ?? 'secondary';
  }

  getSaldoClass(m: MovimientoCuentaModel): string {
    return m.saldoAcumulado < 0
      ? 'text-success'
      : m.saldoAcumulado > 0
        ? 'text-danger'
        : '';
  }

  getClienteLabel(c: TerceroTableModel): string {
    return `${c.nombreCompleto} · ${c.tipoDocumento} ${c.numeroDocumento}`;
  }
}
