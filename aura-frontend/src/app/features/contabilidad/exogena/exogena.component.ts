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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ExogenaService } from '../../../core/services/exogena.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  ExogenaConcepto,
  ExogenaError,
  ExogenaFormato,
  ExogenaLinea,
  ExogenaLote,
  ExogenaMapeo,
} from '../../../core/models/exogena.model';

/**
 * E11 · Información exógena DIAN: wizard validar → generar → revisar →
 * aprobar → exportar Excel del prevalidador, más la parametrización de
 * mapeos cuenta→concepto por formato.
 */
@Component({
  selector: 'app-exogena',
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
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './exogena.component.html',
  styleUrls: ['./exogena.component.scss'],
})
export class ExogenaComponent implements OnInit {
  anio = new Date().getFullYear() - 1;
  readonly anioOpts = this.buildAnioOpts();

  formatos: ExogenaFormato[] = [];
  formatoId: number | null = null;
  conceptos: ExogenaConcepto[] = [];

  // ── Wizard ────────────────────────────────────────────────────────
  errores: ExogenaError[] = [];
  validado = false;
  loadingValidar = false;

  cuantiaMenorUmbral = 100000;
  generando = false;

  lotes: ExogenaLote[] = [];
  loteActivo: ExogenaLote | null = null;
  lineas: ExogenaLinea[] = [];
  erroresLote: ExogenaError[] = [];
  loadingLote = false;
  aprobando = false;

  // ── Mapeos ────────────────────────────────────────────────────────
  mapeos: ExogenaMapeo[] = [];
  loadingMapeos = false;
  showMapeoDialog = false;
  savingMapeo = false;
  nuevoConceptoId: number | null = null;
  nuevoCuentaDesde = '';
  nuevoCuentaHasta = '';
  nuevoTipoValor = 'MOVIMIENTO_DB';

  readonly tipoValorOpts = [
    { label: 'Movimiento débito del año', value: 'MOVIMIENTO_DB' },
    { label: 'Movimiento crédito del año', value: 'MOVIMIENTO_CR' },
    { label: 'Saldo débito a dic 31', value: 'SALDO_DB' },
    { label: 'Saldo crédito a dic 31', value: 'SALDO_CR' },
  ];

  constructor(
    private readonly service: ExogenaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarFormatos();
  }

  get formatoActivo(): ExogenaFormato | null {
    return this.formatos.find((f) => f.id === this.formatoId) ?? null;
  }

  get erroresBloqueantes(): number {
    return this.errores.length;
  }

  async cargarFormatos(): Promise<void> {
    const res = await lastValueFrom(this.service.formatos()).catch(() => null);
    this.formatos = res?.data ?? [];
    if (this.formatos.length && !this.formatoId) {
      this.formatoId = this.formatos[0].id;
      await this.onFormatoChange();
    }
    this.cdr.markForCheck();
  }

  async onFormatoChange(): Promise<void> {
    this.validado = false;
    this.errores = [];
    this.loteActivo = null;
    if (!this.formatoId) return;
    const [conceptosRes] = await Promise.all([
      lastValueFrom(this.service.conceptos(this.formatoId)).catch(() => null),
      this.cargarMapeos(),
      this.cargarLotes(),
    ]);
    this.conceptos = conceptosRes?.data ?? [];
    this.cdr.markForCheck();
  }

  // ── Paso 1: validar ───────────────────────────────────────────────

  async validar(): Promise<void> {
    if (!this.formatoId) return;
    this.loadingValidar = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.validar(this.anio, this.formatoId),
      );
      this.errores = res?.data ?? [];
      this.validado = true;
      if (!this.errores.length) {
        this.alertService.showSuccess(
          'Validación exitosa',
          'Sin hallazgos: puede generar el lote',
        );
      }
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo validar',
      );
    } finally {
      this.loadingValidar = false;
      this.cdr.markForCheck();
    }
  }

  // ── Paso 2: generar ───────────────────────────────────────────────

  async generar(): Promise<void> {
    if (!this.formatoId) return;
    this.generando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.generar(
          this.formatoId,
          this.anio,
          this.cuantiaMenorUmbral,
        ),
      );
      this.alertService.showSuccess(
        'Lote generado',
        `Versión ${res?.data?.version ?? ''} en borrador`,
      );
      await this.cargarLotes();
      if (res?.data) await this.abrirLote(res.data);
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo generar el lote',
      );
    } finally {
      this.generando = false;
      this.cdr.markForCheck();
    }
  }

  async cargarLotes(): Promise<void> {
    const res = await lastValueFrom(this.service.lotes(this.anio)).catch(
      () => null,
    );
    this.lotes = (res?.data ?? []).filter(
      (l) => l.formatoId === this.formatoId,
    );
    this.cdr.markForCheck();
  }

  // ── Paso 3: revisar ───────────────────────────────────────────────

  async abrirLote(lote: ExogenaLote): Promise<void> {
    this.loteActivo = lote;
    this.loadingLote = true;
    this.cdr.markForCheck();
    try {
      const [lineasRes, erroresRes] = await Promise.all([
        lastValueFrom(this.service.lineas(lote.id)),
        lastValueFrom(this.service.errores(lote.id)),
      ]);
      this.lineas = lineasRes?.data ?? [];
      this.erroresLote = erroresRes?.data ?? [];
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo cargar el lote',
      );
    } finally {
      this.loadingLote = false;
      this.cdr.markForCheck();
    }
  }

  get totalLote(): number {
    return this.lineas.reduce((s, l) => s + (l.valor || 0), 0);
  }

  // ── Paso 4: aprobar + export ──────────────────────────────────────

  aprobar(): void {
    if (!this.loteActivo) return;
    this.confirmationService.confirm({
      message:
        '¿Aprobar el lote? Quedará bloqueado; una nueva generación creará otra versión.',
      header: 'Aprobar lote de exógena',
      icon: 'pi pi-lock',
      acceptLabel: 'Sí, aprobar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        if (!this.loteActivo) return;
        this.aprobando = true;
        this.cdr.markForCheck();
        try {
          const res = await lastValueFrom(
            this.service.aprobar(this.loteActivo.id),
          );
          this.loteActivo = res?.data ?? this.loteActivo;
          this.alertService.showSuccess(
            'Lote aprobado',
            'El lote quedó bloqueado',
          );
          await this.cargarLotes();
        } catch (e: any) {
          this.alertService.showError(
            'No se pudo aprobar',
            e?.error?.message ?? 'Revise los hallazgos',
          );
        } finally {
          this.aprobando = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  async exportar(lote: ExogenaLote): Promise<void> {
    try {
      const blob = await lastValueFrom(this.service.exportar(lote.id));
      const formato =
        this.formatos.find((f) => f.id === lote.formatoId)?.codigo ??
        lote.formatoId;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exogena-${formato}-${lote.anio}-v${lote.version}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      this.alertService.showError('Error', 'No se pudo descargar el Excel');
    }
  }

  // ── Mapeos ────────────────────────────────────────────────────────

  async cargarMapeos(): Promise<void> {
    if (!this.formatoId) return;
    this.loadingMapeos = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.mapeos(this.formatoId));
      this.mapeos = res?.data ?? [];
    } finally {
      this.loadingMapeos = false;
      this.cdr.markForCheck();
    }
  }

  abrirNuevoMapeo(): void {
    this.nuevoConceptoId = this.conceptos[0]?.id ?? null;
    this.nuevoCuentaDesde = '';
    this.nuevoCuentaHasta = '';
    this.nuevoTipoValor = 'MOVIMIENTO_DB';
    this.showMapeoDialog = true;
    this.cdr.markForCheck();
  }

  async crearMapeo(): Promise<void> {
    if (!this.nuevoConceptoId || !this.nuevoCuentaDesde.trim()) return;
    this.savingMapeo = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.crearMapeo({
          conceptoId: this.nuevoConceptoId,
          cuentaDesde: this.nuevoCuentaDesde.trim(),
          cuentaHasta: this.nuevoCuentaHasta.trim() || null,
          tipoValor: this.nuevoTipoValor,
        }),
      );
      this.showMapeoDialog = false;
      this.alertService.showSuccess('Mapeo creado', '');
      await this.cargarMapeos();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo crear el mapeo',
      );
    } finally {
      this.savingMapeo = false;
      this.cdr.markForCheck();
    }
  }

  eliminarMapeo(m: ExogenaMapeo): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el mapeo ${m.cuentaDesde}?`,
      header: 'Eliminar mapeo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminarMapeo(m.id));
          await this.cargarMapeos();
        } catch (e: any) {
          this.alertService.showError(
            'Error',
            e?.error?.message ?? 'No se pudo eliminar',
          );
        }
      },
    });
  }

  async restaurarDefaults(): Promise<void> {
    try {
      await lastValueFrom(this.service.seedMapeos());
      this.alertService.showSuccess(
        'Mapeos default',
        'Se sembraron los mapeos sobre el PUC estándar',
      );
      await this.cargarMapeos();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudieron sembrar',
      );
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────

  conceptoLabel(conceptoId: number): string {
    const c = this.conceptos.find((x) => x.id === conceptoId);
    return c ? `${c.codigo} — ${c.nombre}` : `#${conceptoId}`;
  }

  tipoErrorSeverity(tipo: string): 'danger' | 'warn' | 'info' {
    if (tipo === 'COMPROBANTE_BORRADOR' || tipo === 'PERIODO_ABIERTO')
      return 'danger';
    if (tipo === 'TERCERO_INCOMPLETO' || tipo === 'SIN_MAPEO') return 'warn';
    return 'info';
  }

  estadoLoteSeverity(estado: string): 'success' | 'warn' {
    return estado === 'APROBADO' ? 'success' : 'warn';
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
