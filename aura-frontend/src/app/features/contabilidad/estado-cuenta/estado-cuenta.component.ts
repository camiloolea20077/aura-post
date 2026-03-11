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
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';

import { TerceroService } from '../../../core/services/tercero.service';
import {
  EstadoCuentaClienteModel,
  MovimientoCuentaModel,
  TerceroTableModel,
} from '../../../core/models/tercero.model';
import { AlertService } from '../../../shared/pipes/alert.service';

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
    DropdownModule,
  ],
  providers: [MessageService],
  templateUrl: './estado-cuenta.component.html',
  styleUrls: ['./estado-cuenta.component.scss'],
})
export class EstadoCuentaComponent implements OnInit {
  // ── Selector de cliente ─────────────────────────────────────
  clientes: TerceroTableModel[] = [];
  clienteSeleccionado: TerceroTableModel | null = null;
  loadingClientes = false;
  private _searchTimeout: ReturnType<typeof setTimeout> | null = null;

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

  onFiltroCliente(event: { filter: string }): void {
    const q = event.filter?.trim() ?? '';
    if (this._searchTimeout) clearTimeout(this._searchTimeout);
    if (q.length < 2) {
      this.clientes = this.clienteSeleccionado ? [this.clienteSeleccionado] : [];
      this.cdr.markForCheck();
      return;
    }
    this._searchTimeout = setTimeout(async () => {
      this.loadingClientes = true;
      this.cdr.markForCheck();
      try {
        const res = await lastValueFrom(this.terceroService.terceros(q));
        const resultados = res?.data ?? [];
        // mantener el seleccionado en la lista aunque no esté en los resultados
        if (this.clienteSeleccionado && !resultados.find(c => c.id === this.clienteSeleccionado!.id)) {
          this.clientes = [this.clienteSeleccionado, ...resultados];
        } else {
          this.clientes = resultados;
        }
      } catch {
        this.clientes = [];
      } finally {
        this.loadingClientes = false;
        this.cdr.markForCheck();
      }
    }, 300);
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
        ? this.fechaDesde.toISOString().split('T')[0]
        : undefined;
      const hasta = this.fechaHasta
        ? this.fechaHasta.toISOString().split('T')[0]
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

    const desde = this.fechaDesde ? this.fechaDesde.toISOString().split('T')[0] : undefined;
    const hasta = this.fechaHasta ? this.fechaHasta.toISOString().split('T')[0] : undefined;

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
