import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { AsientoContableModel } from '../../../core/models/contabilidad.model';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
@Component({
  selector: 'app-revision-asientos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    DropdownModule,
    CalendarModule,
    TabViewModule,
    SkeletonModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './revision-asientos.component.html',
  styleUrls: ['./revision-asientos.component.scss'],
})
export class RevisionAsientosComponent implements OnInit {
  // ── Pendientes (borradores) ──────────────────────────────────────
  pendientes: AsientoContableModel[] = [];
  loading = false;
  aprobandoId: number | null = null;
  aprobandoMasivo = false;

  // ── Descuadrados (red de seguridad) ──────────────────────────────
  descuadrados: AsientoContableModel[] = [];
  loadingDescuadrados = false;

  // ── Detalle ──────────────────────────────────────────────────────
  asientoDetalle: AsientoContableModel | null = null;
  showDetalle = false;

  // ── Aprobación masiva ────────────────────────────────────────────
  rangoFechas: Date[] = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(),
  ];
  tipoOrigenMasivo: string | null = null;

  readonly tipoOrigenOpts = [
    { label: 'Todos los tipos', value: null },
    { label: 'Venta', value: 'VENTA' },
    { label: 'Compra', value: 'COMPRA' },
    { label: 'Gasto', value: 'GASTO' },
    { label: 'Nómina', value: 'NOMINA' },
    { label: 'Tesorería', value: 'TESORERIA' },
    { label: 'Manual', value: 'MANUAL' },
  ];

  constructor(
    private readonly service: ContabilidadService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  get totalPendiente(): number {
    return this.pendientes.reduce((s, a) => s + (a.totalDebito || 0), 0);
  }

  // ── Carga ────────────────────────────────────────────────────────

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.asientosPendientes());
      this.pendientes = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los comprobantes pendientes');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async cargarDescuadrados(): Promise<void> {
    this.loadingDescuadrados = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.asientosDescuadrados());
      this.descuadrados = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los comprobantes descuadrados');
    } finally {
      this.loadingDescuadrados = false;
      this.cdr.markForCheck();
    }
  }

  // ── Aprobar uno ──────────────────────────────────────────────────

  aprobar(a: AsientoContableModel): void {
    this.confirmationService.confirm({
      message: `¿Contabilizar el comprobante ${a.numeroComprobante ?? '#' + a.id}? Una vez contabilizado no se puede editar, solo reversar.`,
      header: 'Aprobar comprobante',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, contabilizar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: async () => {
        this.aprobandoId = a.id;
        this.cdr.markForCheck();
        try {
          await lastValueFrom(this.service.contabilizarBorrador(a.id));
          this.pendientes = this.pendientes.filter((p) => p.id !== a.id);
          this.alertService.showSuccess('Contabilizado', `${a.numeroComprobante ?? 'Comprobante'} pasó a CONTABILIZADO`);
        } catch (e: any) {
          this.alertService.showError('Error', e?.error?.message ?? 'No se pudo contabilizar el comprobante');
        } finally {
          this.aprobandoId = null;
          this.cdr.markForCheck();
        }
      },
    });
  }

  // ── Aprobar en bloque ────────────────────────────────────────────

  aprobarMasivo(): void {
    if (!this.rangoFechas?.[0] || !this.rangoFechas?.[1]) {
      this.alertService.showError('Rango requerido', 'Seleccione el rango de fechas a contabilizar');
      return;
    }
    const tipoLabel = this.tipoOrigenOpts.find((o) => o.value === this.tipoOrigenMasivo)?.label ?? 'Todos';
    this.confirmationService.confirm({
      message: `¿Contabilizar en bloque todos los borradores del rango seleccionado (${tipoLabel})? Esta acción no se puede deshacer sin reversar cada comprobante.`,
      header: 'Aprobar en bloque',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, contabilizar todo',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: async () => {
        this.aprobandoMasivo = true;
        this.cdr.markForCheck();
        try {
          const desde = this.toISO(this.rangoFechas[0]);
          const hasta = this.toISO(this.rangoFechas[1]);
          const res = await lastValueFrom(
            this.service.contabilizarMasivo(desde, hasta, this.tipoOrigenMasivo),
          );
          const total = res?.data ?? 0;
          this.alertService.showSuccess('Contabilizados', `${total} comprobante(s) pasaron a CONTABILIZADO`);
          await this.cargar();
        } catch (e: any) {
          this.alertService.showError('Error', e?.error?.message ?? 'No se pudo contabilizar el bloque');
        } finally {
          this.aprobandoMasivo = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  // ── Detalle ──────────────────────────────────────────────────────

  async verDetalle(a: AsientoContableModel): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.obtenerAsiento(a.id));
      this.asientoDetalle = res?.data ?? null;
      this.showDetalle = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el detalle');
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  tipoOrigenBadge(tipo: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const m: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      MANUAL: 'info', VENTA: 'success', COMPRA: 'warn',
      GASTO: 'danger', NOMINA: 'secondary', TESORERIA: 'contrast',
    };
    return m[tipo] ?? 'secondary';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  toISO(d: Date): string {
    return aFechaLocal(d);
  }
}
