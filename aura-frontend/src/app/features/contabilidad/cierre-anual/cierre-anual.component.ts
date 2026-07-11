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
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { CierreAnualService } from '../../../core/services/cierre-anual.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TerceroPickerComponent } from '../../../shared/components/tercero-picker/tercero-picker.component';
import {
  CierreAnualOperacion,
  DistribucionUtilidades,
  DividendoPago,
  SugerenciaDistribucion,
  SugerenciaProvision,
} from '../../../core/models/cierre-anual.model';

/**
 * E8 · Cierre anual fiscal: wizard de cierre de ejercicio (provisión de renta
 * sugerida pero DIGITADA por el contador → cierre de diciembre → traslado
 * 3605→3705) y distribución de utilidades post-asamblea con sus pagos.
 */
@Component({
  selector: 'app-cierre-anual',
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
    InputTextModule,
    InputNumberModule,
    TabViewModule,
    SkeletonModule,
    TerceroPickerComponent,
  ],
  providers: [MessageService],
  templateUrl: './cierre-anual.component.html',
  styleUrls: ['./cierre-anual.component.scss'],
})
export class CierreAnualComponent implements OnInit {
  anio = new Date().getFullYear() - (new Date().getMonth() < 6 ? 1 : 0);
  readonly anioOpts = this.buildAnioOpts();

  // ── Paso 1: provisión de renta ────────────────────────────────────
  sugerencia: SugerenciaProvision | null = null;
  loadingSugerencia = false;
  tarifa = 35;
  montoProvision: number | null = null;
  detalleProvision = '';
  savingProvision = false;

  // ── Paso 2: traslado ──────────────────────────────────────────────
  savingTraslado = false;

  operaciones: CierreAnualOperacion[] = [];
  loadingOperaciones = false;

  // ── Distribución ──────────────────────────────────────────────────
  sugerenciaDist: SugerenciaDistribucion | null = null;
  loadingDist = false;
  reservaLegal: number | null = null;
  dividendos: number | null = null;
  observacionesDist = '';
  savingDist = false;
  distribuciones: DistribucionUtilidades[] = [];

  // ── Pago de dividendos ────────────────────────────────────────────
  showPagoDialog = false;
  distribucionPago: DistribucionUtilidades | null = null;
  pagosDistribucion: DividendoPago[] = [];
  montoPago: number | null = null;
  metodoPago = 'TRANSFERENCIA';
  cuentaBancariaPagoId: number | null = null;
  terceroPagoId: number | null = null;
  savingPago = false;
  cuentaBancariaOpts: { label: string; value: number }[] = [];

  readonly metodoPagoOpts = [
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Cheque', value: 'CHEQUE' },
  ];

  constructor(
    private readonly service: CierreAnualService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarOperaciones();
    this.cargarDistribuciones();
    this.cargarCuentasBancarias();
  }

  get provisionRegistrada(): boolean {
    return this.operaciones.some(
      (o) => o.tipo === 'PROVISION_RENTA' && o.anio === this.anio,
    );
  }

  get trasladoRegistrado(): boolean {
    return this.operaciones.some(
      (o) => o.tipo === 'TRASLADO' && o.anio === this.anio,
    );
  }

  // ── Provisión de renta ────────────────────────────────────────────

  async cargarSugerencia(): Promise<void> {
    this.loadingSugerencia = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.sugerenciaProvision(this.anio, this.tarifa),
      );
      this.sugerencia = res?.data ?? null;
      if (this.sugerencia && this.montoProvision == null) {
        this.montoProvision = this.sugerencia.provisionSugerida;
      }
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo calcular la sugerencia',
      );
    } finally {
      this.loadingSugerencia = false;
      this.cdr.markForCheck();
    }
  }

  async provisionar(): Promise<void> {
    if (!this.montoProvision || this.montoProvision <= 0) return;
    this.savingProvision = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.provisionar({
          anio: this.anio,
          monto: this.montoProvision,
          detalle: this.detalleProvision || null,
        }),
      );
      this.alertService.showSuccess(
        'Provisión contabilizada',
        `Asiento DB 5405 · CR 2404 con fecha 31/12/${this.anio}`,
      );
      this.montoProvision = null;
      this.detalleProvision = '';
      await this.cargarOperaciones();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo registrar la provisión',
      );
    } finally {
      this.savingProvision = false;
      this.cdr.markForCheck();
    }
  }

  // ── Traslado 3605 → 3705 ──────────────────────────────────────────

  async trasladar(): Promise<void> {
    this.savingTraslado = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.trasladar(this.anio));
      const monto = res?.data?.monto ?? 0;
      this.alertService.showSuccess(
        'Traslado contabilizado',
        monto >= 0
          ? 'Utilidad trasladada a resultados acumulados (3705)'
          : 'Pérdida trasladada a resultados acumulados (3705)',
      );
      await this.cargarOperaciones();
      await this.cargarSugerenciaDistribucion();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo trasladar la utilidad',
      );
    } finally {
      this.savingTraslado = false;
      this.cdr.markForCheck();
    }
  }

  async cargarOperaciones(): Promise<void> {
    this.loadingOperaciones = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.operaciones());
      this.operaciones = res?.data ?? [];
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar las operaciones del cierre',
      );
    } finally {
      this.loadingOperaciones = false;
      this.cdr.markForCheck();
    }
  }

  // ── Distribución de utilidades ────────────────────────────────────

  async cargarSugerenciaDistribucion(): Promise<void> {
    this.loadingDist = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.sugerenciaDistribucion());
      this.sugerenciaDist = res?.data ?? null;
      if (this.sugerenciaDist) {
        this.reservaLegal = this.sugerenciaDist.reservaSugerida;
        this.dividendos = this.sugerenciaDist.dividendosDisponibles;
      }
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo cargar la sugerencia',
      );
    } finally {
      this.loadingDist = false;
      this.cdr.markForCheck();
    }
  }

  async distribuir(): Promise<void> {
    const total = (this.reservaLegal ?? 0) + (this.dividendos ?? 0);
    if (total <= 0) return;
    this.savingDist = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.distribuir({
          anio: this.anio,
          reservaLegal: this.reservaLegal ?? 0,
          dividendos: this.dividendos ?? 0,
          observaciones: this.observacionesDist || null,
        }),
      );
      this.alertService.showSuccess(
        'Distribución contabilizada',
        'DB 3705 · CR 330505 (reserva) / 2360 (dividendos)',
      );
      this.observacionesDist = '';
      await Promise.all([
        this.cargarDistribuciones(),
        this.cargarSugerenciaDistribucion(),
      ]);
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo registrar la distribución',
      );
    } finally {
      this.savingDist = false;
      this.cdr.markForCheck();
    }
  }

  async cargarDistribuciones(): Promise<void> {
    const res = await lastValueFrom(this.service.distribuciones()).catch(
      () => null,
    );
    this.distribuciones = res?.data ?? [];
    this.cdr.markForCheck();
  }

  // ── Pagos de dividendos ───────────────────────────────────────────

  async abrirPagos(d: DistribucionUtilidades): Promise<void> {
    this.distribucionPago = d;
    this.montoPago = null;
    this.terceroPagoId = null;
    this.showPagoDialog = true;
    const res = await lastValueFrom(this.service.pagos(d.id)).catch(() => null);
    this.pagosDistribucion = res?.data ?? [];
    this.cdr.markForCheck();
  }

  get totalPagado(): number {
    return this.pagosDistribucion.reduce((s, p) => s + (p.monto || 0), 0);
  }

  get pendientePago(): number {
    return (this.distribucionPago?.dividendos ?? 0) - this.totalPagado;
  }

  async pagar(): Promise<void> {
    if (!this.distribucionPago || !this.montoPago || this.montoPago <= 0)
      return;
    this.savingPago = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.pagarDividendos({
          distribucionId: this.distribucionPago.id,
          monto: this.montoPago,
          metodoPago: this.metodoPago,
          cuentaBancariaId:
            this.metodoPago === 'EFECTIVO' ? null : this.cuentaBancariaPagoId,
          terceroId: this.terceroPagoId,
        }),
      );
      this.alertService.showSuccess(
        'Pago contabilizado',
        'DB 2360 · CR caja/banco',
      );
      this.montoPago = null;
      const res = await lastValueFrom(
        this.service.pagos(this.distribucionPago.id),
      ).catch(() => null);
      this.pagosDistribucion = res?.data ?? [];
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo registrar el pago',
      );
    } finally {
      this.savingPago = false;
      this.cdr.markForCheck();
    }
  }

  onTerceroPago(e: { id: number; nombre: string } | null): void {
    this.terceroPagoId = e?.id ?? null;
    this.cdr.markForCheck();
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private async cargarCuentasBancarias(): Promise<void> {
    const res = await lastValueFrom(this.cuentaBancariaService.list()).catch(
      () => null,
    );
    this.cuentaBancariaOpts = (res?.data ?? [])
      .filter((c: any) => c.activa)
      .map((c: any) => ({ label: c.nombre, value: c.id }));
    this.cdr.markForCheck();
  }

  tipoOperacionLabel(tipo: string): string {
    return tipo === 'PROVISION_RENTA'
      ? 'Provisión de renta'
      : 'Traslado a acumulados';
  }

  tipoSeverity(tipo: string): 'info' | 'success' {
    return tipo === 'PROVISION_RENTA' ? 'info' : 'success';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private buildAnioOpts(): { label: string; value: number }[] {
    const actual = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => {
      const v = actual - 4 + i;
      return { label: String(v), value: v };
    });
  }
}
