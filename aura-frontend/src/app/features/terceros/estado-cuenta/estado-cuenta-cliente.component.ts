import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { TerceroService } from '../../../core/services/tercero.service';
import {
  EstadoCuentaClienteModel,
  MovimientoCuentaModel,
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
  selector: 'app-estado-cuenta-cliente',
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
    TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './estado-cuenta-cliente.component.html',
  styleUrls: ['./estado-cuenta-cliente.component.scss'],
})
export class EstadoCuentaClienteComponent implements OnInit {
  estado: EstadoCuentaClienteModel | null = null;
  loading = true;
  clienteId!: number;

  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly terceroService: TerceroService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  async cargar(): Promise<void> {
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
        this.terceroService.getEstadoCuenta(this.clienteId, desde, hasta),
      );
      this.estado = res?.data ?? null;
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo cargar el estado de cuenta',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  filtrar(): void {
    this.cargar();
  }

  limpiarFiltros(): void {
    this.fechaDesde = null;
    this.fechaHasta = null;
    this.cargar();
  }

  volver(): void {
    this.router.navigate(['/terceros']);
  }

  // ─── Formateo ────────────────────────────────────────────────
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
}
