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
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ConciliacionService } from '../../../core/services/conciliacion.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  ExtractoBancario,
  ExtractoLinea,
  MovimientoLibro,
  ResumenConciliacion,
  SugerenciaMatching,
  TipoAjusteBancario,
} from '../../../core/models/conciliacion.model';

/**
 * E9 · Conciliación bancaria: extracto importado (CSV) a la izquierda, libro
 * de la cuenta contable del banco a la derecha; matching sugerido por valor
 * exacto y fecha ±3 días; los cargos del banco sin registro se contabilizan
 * como ajuste (comisión, GMF, intereses) desde la misma pantalla.
 */
@Component({
  selector: 'app-conciliacion-bancaria',
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
    CalendarModule,
    TextareaModule,
    SkeletonModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './conciliacion-bancaria.component.html',
  styleUrls: ['./conciliacion-bancaria.component.scss'],
})
export class ConciliacionBancariaComponent implements OnInit {
  // ── Listado de extractos ──────────────────────────────────────────
  extractos: ExtractoBancario[] = [];
  loading = false;
  cuentaFiltroId: number | null = null;
  cuentaBancariaOpts: { label: string; value: number }[] = [];

  // ── Extracto seleccionado (pantalla de trabajo) ───────────────────
  extracto: ExtractoBancario | null = null;
  lineas: ExtractoLinea[] = [];
  movimientos: MovimientoLibro[] = [];
  resumen: ResumenConciliacion | null = null;
  sugerencias = new Map<number, MovimientoLibro[]>();
  loadingDetalle = false;

  // ── Crear extracto ────────────────────────────────────────────────
  showCrear = false;
  saving = false;
  nuevoCuentaId: number | null = null;
  nuevoPeriodo: Date = new Date();
  nuevoSaldoInicial: number | null = null;
  nuevoSaldoFinal: number | null = null;

  // ── Importar líneas ───────────────────────────────────────────────
  showImportar = false;
  csvContenido = '';
  importando = false;

  // ── Conciliar línea (candidatos) ──────────────────────────────────
  showCandidatos = false;
  lineaActiva: ExtractoLinea | null = null;
  candidatosLinea: MovimientoLibro[] = [];

  // ── Ajuste ────────────────────────────────────────────────────────
  showAjuste = false;
  tipoAjuste: TipoAjusteBancario = 'GASTO_BANCARIO';
  readonly tipoAjusteOpts: { label: string; value: TipoAjusteBancario }[] = [
    { label: 'Comisión / gasto bancario (530515)', value: 'GASTO_BANCARIO' },
    { label: 'GMF 4x1000 (530595)', value: 'GMF' },
    { label: 'Intereses (abono → 421005 / cargo → 5305)', value: 'INTERES' },
  ];

  cerrando = false;

  constructor(
    private readonly service: ConciliacionService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarCuentas();
    this.cargarExtractos();
  }

  // ── Extractos ─────────────────────────────────────────────────────

  async cargarCuentas(): Promise<void> {
    const res = await lastValueFrom(this.cuentaBancariaService.list()).catch(
      () => null,
    );
    this.cuentaBancariaOpts = (res?.data ?? [])
      .filter((c: any) => c.activa)
      .map((c: any) => ({ label: c.nombre, value: c.id }));
    this.cdr.markForCheck();
  }

  async cargarExtractos(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.listar(this.cuentaFiltroId));
      this.extractos = res?.data ?? [];
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar los extractos',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  abrirCrear(): void {
    this.nuevoCuentaId = this.cuentaFiltroId;
    this.nuevoPeriodo = new Date();
    this.nuevoSaldoInicial = null;
    this.nuevoSaldoFinal = null;
    this.showCrear = true;
    this.cdr.markForCheck();
  }

  async crear(): Promise<void> {
    if (!this.nuevoCuentaId) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const periodo = `${this.nuevoPeriodo.getFullYear()}-${String(this.nuevoPeriodo.getMonth() + 1).padStart(2, '0')}`;
      const res = await lastValueFrom(
        this.service.crear({
          cuentaBancariaId: this.nuevoCuentaId,
          periodo,
          saldoInicial: this.nuevoSaldoInicial ?? 0,
          saldoFinal: this.nuevoSaldoFinal ?? 0,
        }),
      );
      this.showCrear = false;
      this.alertService.showSuccess('Extracto creado', `Período ${periodo}`);
      await this.cargarExtractos();
      if (res?.data) await this.abrir(res.data);
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo crear el extracto',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  eliminarExtracto(e: ExtractoBancario): void {
    this.confirmationService.confirm({
      message: `¿Eliminar el extracto de ${e.periodo}? Solo se permite si no tiene ajustes contabilizados.`,
      header: 'Eliminar extracto',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminar(e.id));
          this.alertService.showSuccess('Extracto eliminado', '');
          if (this.extracto?.id === e.id) this.extracto = null;
          await this.cargarExtractos();
        } catch (err: any) {
          this.alertService.showError(
            'Error',
            err?.error?.message ?? 'No se pudo eliminar',
          );
        }
      },
    });
  }

  // ── Pantalla de trabajo ───────────────────────────────────────────

  async abrir(e: ExtractoBancario): Promise<void> {
    this.extracto = e;
    await this.refrescarDetalle();
  }

  async refrescarDetalle(): Promise<void> {
    if (!this.extracto) return;
    this.loadingDetalle = true;
    this.cdr.markForCheck();
    try {
      const id = this.extracto.id;
      const [lineasRes, movRes, resumenRes, sugRes] = await Promise.all([
        lastValueFrom(this.service.lineas(id)),
        lastValueFrom(this.service.movimientosLibro(id)),
        lastValueFrom(this.service.resumen(id)),
        lastValueFrom(this.service.sugerencias(id)),
      ]);
      this.lineas = lineasRes?.data ?? [];
      this.movimientos = movRes?.data ?? [];
      this.resumen = resumenRes?.data ?? null;
      this.sugerencias = new Map(
        (sugRes?.data ?? []).map((s: SugerenciaMatching) => [
          s.linea.id,
          s.candidatos,
        ]),
      );
      if (this.resumen) this.extracto = this.resumen.extracto;
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo cargar el extracto',
      );
    } finally {
      this.loadingDetalle = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.extracto = null;
    this.resumen = null;
    this.cargarExtractos();
  }

  // ── Importación ───────────────────────────────────────────────────

  abrirImportar(): void {
    this.csvContenido = '';
    this.showImportar = true;
    this.cdr.markForCheck();
  }

  onArchivo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.csvContenido = String(reader.result ?? '');
      this.cdr.markForCheck();
    };
    reader.readAsText(file);
  }

  async importar(): Promise<void> {
    if (!this.extracto || !this.csvContenido.trim()) return;
    this.importando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.importar(this.extracto.id, this.csvContenido),
      );
      this.alertService.showSuccess(
        'Importación exitosa',
        `${res?.data?.length ?? 0} líneas importadas`,
      );
      this.showImportar = false;
      await this.refrescarDetalle();
    } catch (e: any) {
      this.alertService.showError(
        'Error al importar',
        e?.error?.message ?? 'Revise el formato del CSV',
      );
    } finally {
      this.importando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Matching ──────────────────────────────────────────────────────

  candidatosDe(linea: ExtractoLinea): MovimientoLibro[] {
    return this.sugerencias.get(linea.id) ?? [];
  }

  abrirCandidatos(linea: ExtractoLinea): void {
    this.lineaActiva = linea;
    this.candidatosLinea = this.candidatosDe(linea);
    this.showCandidatos = true;
    this.cdr.markForCheck();
  }

  async conciliarCon(mov: MovimientoLibro): Promise<void> {
    if (!this.extracto || !this.lineaActiva) return;
    try {
      await lastValueFrom(
        this.service.conciliar(
          this.extracto.id,
          this.lineaActiva.id,
          mov.asientoDetalleId,
        ),
      );
      this.showCandidatos = false;
      this.alertService.showSuccess('Línea conciliada', '');
      await this.refrescarDetalle();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo conciliar',
      );
    }
  }

  async desconciliar(linea: ExtractoLinea): Promise<void> {
    if (!this.extracto) return;
    try {
      await lastValueFrom(
        this.service.desconciliar(this.extracto.id, linea.id),
      );
      await this.refrescarDetalle();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo desconciliar',
      );
    }
  }

  // ── Ajustes ───────────────────────────────────────────────────────

  abrirAjuste(linea: ExtractoLinea): void {
    this.lineaActiva = linea;
    this.tipoAjuste = linea.valor < 0 ? 'GASTO_BANCARIO' : 'INTERES';
    this.showAjuste = true;
    this.cdr.markForCheck();
  }

  async registrarAjuste(): Promise<void> {
    if (!this.extracto || !this.lineaActiva) return;
    try {
      await lastValueFrom(
        this.service.registrarAjuste(
          this.extracto.id,
          this.lineaActiva.id,
          this.tipoAjuste,
        ),
      );
      this.showAjuste = false;
      this.alertService.showSuccess(
        'Ajuste contabilizado',
        'Asiento AB generado desde la conciliación',
      );
      await this.refrescarDetalle();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo registrar el ajuste',
      );
    }
  }

  // ── Cierre ────────────────────────────────────────────────────────

  cerrar(): void {
    if (!this.extracto) return;
    this.confirmationService.confirm({
      message:
        '¿Cerrar el extracto? Quedará bloqueado y certificará el saldo del banco contra el libro.',
      header: 'Cerrar extracto',
      icon: 'pi pi-lock',
      acceptLabel: 'Sí, cerrar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        if (!this.extracto) return;
        this.cerrando = true;
        this.cdr.markForCheck();
        try {
          await lastValueFrom(this.service.cerrar(this.extracto.id));
          this.alertService.showSuccess(
            'Extracto conciliado',
            'El saldo del banco quedó certificado contra el extracto',
          );
          await this.refrescarDetalle();
        } catch (e: any) {
          this.alertService.showError(
            'No se pudo cerrar',
            e?.error?.message ?? 'Revise el resumen',
          );
        } finally {
          this.cerrando = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  cuentaNombre(id: number): string {
    return (
      this.cuentaBancariaOpts.find((c) => c.value === id)?.label ?? `#${id}`
    );
  }

  estadoLineaSeverity(estado: string): 'success' | 'warn' | 'info' {
    if (estado === 'CONCILIADO') return 'success';
    if (estado === 'AJUSTE') return 'info';
    return 'warn';
  }

  estadoExtractoSeverity(estado: string): 'success' | 'warn' {
    return estado === 'CONCILIADO' ? 'success' : 'warn';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
