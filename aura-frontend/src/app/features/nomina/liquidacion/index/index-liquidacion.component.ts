import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { DetalleNominaComponent } from '../detail/detalle-nomina.component';
import { DocumentoPeriodoComponent } from '../documento/documento-periodo.component';
import { NominaService } from '../../../../core/services/nomina.service';
import {
  EstadoPeriodo,
  PeriodoNominaModel,
} from '../../../../core/models/nomina.model';
import { ProcesoModel, esTerminal } from '../../../../core/models/proceso.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

type TagSeverity = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

/** Cada cuánto se consulta el estado del proceso, en ms. */
const POLL_INTERVAL_MS = 2500;

@Component({
  selector: 'app-index-liquidacion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, ButtonModule, InputTextModule,
    TagModule, ToastModule, TooltipModule, SkeletonModule, DropdownModule,
    DialogModule, ProgressBarModule,
    ConfirmDialogModule, DetalleNominaComponent, DocumentoPeriodoComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-liquidacion.component.html',
  styleUrls: ['./index-liquidacion.component.scss'],
})
export class IndexLiquidacionComponent implements OnInit, OnDestroy {
  // Detalle de un empleado (nómina individual)
  public showDetalle = false;
  public selectedNominaId: number | null = null;

  // Documento del período (maestro-detalle)
  public showDocumento = false;
  public selectedPeriodoId: number | null = null;

  // Períodos (maestro de la tabla)
  public periodos: PeriodoNominaModel[] = [];
  public loadingPeriodos = true;
  public periodoSeleccionado: PeriodoNominaModel | null = null;
  public liquidandoTodos = false;

  // Progreso del proceso asíncrono
  public showProgreso = false;
  public proceso: ProcesoModel | null = null;
  private pollHandle: ReturnType<typeof setTimeout> | null = null;
  /** El período que se está liquidando; se abre su documento al terminar bien. */
  private periodoEnCurso: PeriodoNominaModel | null = null;

  constructor(
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  get periodosParaLiquidar(): PeriodoNominaModel[] {
    return this.periodos.filter(p => p.estado !== 'ANULADO' && p.estado !== 'PAGADO');
  }

  async cargarPeriodos(): Promise<void> {
    this.loadingPeriodos = true;
    try {
      const res = await lastValueFrom(this.nominaService.listPeriodos());
      this.periodos = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los períodos');
      this.periodos = [];
    } finally {
      this.loadingPeriodos = false;
    }
  }

  liquidarTodos(): void {
    if (!this.periodoSeleccionado) {
      this.alertService.showWarn('Período requerido', 'Selecciona un período para liquidar');
      return;
    }
    const periodo = this.periodoSeleccionado;
    this.confirmationService.confirm({
      message: `¿Liquidar nómina para todos los contratos vigentes del período ${this.formatFecha(periodo.fechaInicio)} - ${this.formatFecha(periodo.fechaFin)}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, liquidar',
      rejectLabel: 'Cancelar',
      accept: () => this.lanzarLiquidacion(periodo),
    });
  }

  /**
   * Lanza la liquidación en segundo plano y arranca el polling.
   *
   * El backend responde 202 con el proceso en PENDIENTE: ya no se espera a que
   * termine dentro del request (con volumen daba timeout).
   */
  private async lanzarLiquidacion(periodo: PeriodoNominaModel): Promise<void> {
    this.liquidandoTodos = true;
    try {
      const res = await lastValueFrom(this.nominaService.liquidarTodos(periodo.id));
      this.periodoEnCurso = periodo;
      this.proceso = res.data ?? null;
      this.showProgreso = true;
      if (this.proceso) this.programarPoll(this.proceso.id);
    } catch (err: any) {
      // 409 = ya hay una liquidación corriendo para ese período. El mensaje del
      // backend lo dice; se muestra tal cual en vez de un error genérico.
      const msg = err?.error?.message ?? 'No se pudo lanzar la liquidación.';
      this.alertService.showError('Error', msg);
    } finally {
      this.liquidandoTodos = false;
    }
  }

  private programarPoll(procesoId: number): void {
    this.detenerPolling();
    this.pollHandle = setTimeout(() => this.consultar(procesoId), POLL_INTERVAL_MS);
  }

  private async consultar(procesoId: number): Promise<void> {
    // Si el usuario cerró el diálogo, se corta el polling.
    if (!this.showProgreso) return;
    try {
      const res = await lastValueFrom(this.nominaService.consultarProceso(procesoId));
      this.proceso = res.data ?? this.proceso;
      if (this.proceso && esTerminal(this.proceso.estado)) {
        this.alFinalizar(this.proceso);
      } else {
        this.programarPoll(procesoId);
      }
    } catch {
      // Un fallo de red puntual no debe abortar el seguimiento: se reintenta.
      this.programarPoll(procesoId);
    }
  }

  /** Reacción al estado final del proceso. */
  private alFinalizar(p: ProcesoModel): void {
    this.detenerPolling();
    this.cargarPeriodos();

    switch (p.estado) {
      case 'COMPLETADO':
        this.alertService.showSuccess('Liquidado', `Se liquidaron ${p.itemsOk} contratos.`);
        this.showProgreso = false;
        if (this.periodoEnCurso) this.abrirDocumento(this.periodoEnCurso);
        break;
      case 'COMPLETADO_CON_ERRORES':
        // No es un fallo: los buenos quedaron liquidados. Se deja el diálogo
        // abierto con la lista de los que fallaron para que el usuario actúe.
        this.alertService.showWarn(
          'Liquidado con errores',
          `${p.itemsOk} liquidados, ${p.itemsError} con problemas.`,
        );
        break;
      case 'FALLIDO':
        this.alertService.showError('Falló la liquidación', p.mensaje ?? 'El proceso no pudo completarse.');
        break;
      default:
        this.showProgreso = false;
    }
  }

  private detenerPolling(): void {
    if (this.pollHandle) {
      clearTimeout(this.pollHandle);
      this.pollHandle = null;
    }
  }

  cerrarProgreso(): void {
    this.detenerPolling();
    this.showProgreso = false;
    const p = this.proceso;
    this.proceso = null;
    // Si terminó bien mientras el diálogo mostraba errores, abrir el documento
    // igual: los contratos buenos sí se liquidaron.
    if (p && p.estado === 'COMPLETADO_CON_ERRORES' && this.periodoEnCurso) {
      this.abrirDocumento(this.periodoEnCurso);
    }
  }

  severidadProceso(estado: string | undefined): TagSeverity {
    switch (estado) {
      case 'COMPLETADO': return 'success';
      case 'COMPLETADO_CON_ERRORES': return 'warn';
      case 'FALLIDO': return 'danger';
      case 'EN_PROCESO':
      case 'PENDIENTE': return 'info';
      default: return 'secondary';
    }
  }

  get procesoEnCurso(): boolean {
    return this.proceso?.estado === 'PENDIENTE' || this.proceso?.estado === 'EN_PROCESO';
  }

  // ── Documento del período ──
  abrirDocumento(p: PeriodoNominaModel): void {
    this.selectedPeriodoId = p.id;
    this.showDocumento = true;
  }
  onDocumentoClosed(): void {
    this.showDocumento = false;
    this.selectedPeriodoId = null;
  }

  // ── Detalle de empleado (desde dentro del documento) ──
  onVerNomina(nominaId: number): void {
    this.selectedNominaId = nominaId;
    this.showDetalle = true;
  }
  onDetalleClosed(): void { this.showDetalle = false; this.selectedNominaId = null; }
  onNominaActualizada(): void {
    this.showDetalle = false;
    this.selectedNominaId = null;
    // Recarga el documento abierto para reflejar cambios de estado/valores
    if (this.selectedPeriodoId != null) {
      const id = this.selectedPeriodoId;
      this.showDocumento = false;
      setTimeout(() => { this.selectedPeriodoId = id; this.showDocumento = true; }, 0);
    }
    this.cargarPeriodos();
  }

  formatFecha(f: string): string {
    return new Date(f).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  documentoLabel(p: PeriodoNominaModel): string {
    return `NOM-${p.id}`;
  }

  estadoLabel(e: EstadoPeriodo): string {
    const m: Record<EstadoPeriodo, string> = {
      ABIERTO: 'Abierto', LIQUIDADO: 'Liquidado', PAGADO: 'Pagado', ANULADO: 'Anulado',
    };
    return m[e] ?? e;
  }

  estadoSeverity(e: EstadoPeriodo): TagSeverity {
    const m: Record<EstadoPeriodo, TagSeverity> = {
      ABIERTO: 'success', LIQUIDADO: 'info', PAGADO: 'secondary', ANULADO: 'danger',
    };
    return m[e];
  }

  periodoLabel(p: PeriodoNominaModel): string {
    return `${this.formatFecha(p.fechaInicio)} → ${this.formatFecha(p.fechaFin)}`;
  }
}
