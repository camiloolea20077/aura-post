import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  DetalleLiquidacionModel,
  DocumentoNominaModel,
  LiquidacionEmpleadoModel,
  PasoTraza,
  leerTraza,
} from '../../../../core/models/nomina-documento.model';
import { PagoNominaDto } from '../../../../core/models/nomina.model';
import { ProcesoModel, esTerminal } from '../../../../core/models/proceso.model';
import { NominaDocumentoService } from '../../../../core/services/nomina-documento.service';
import { NominaService } from '../../../../core/services/nomina.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { PagoNominaDialogComponent } from '../../liquidacion/pago/pago-nomina-dialog.component';
import { NominaElectronicaComponent } from '../../liquidacion/electronica/nomina-electronica.component';
import { totalesLiquidacion } from '../prenomina.util';
import { DesprendibleModel } from '../../../../core/models/desprendible.model';
import { CertificadoService } from '../../../../core/services/certificado.service';
import { EnvioComprobantesComponent } from './envio-comprobantes/envio-comprobantes.component';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { NominaPagoPdfService } from '../../../../core/services/nomina-pago-pdf.service';

/** Cada cuánto se consulta el avance de la liquidación. */
const POLL_MS = 1500;

/** Desprendibles que se piden a la vez al armar los PDF de pago. */
const LOTE_PDF = 6;

/**
 * Pestaña Liquidación: el botón Liquidar (en segundo plano, con barra de avance)
 * y, una vez liquidados, devengado, deducido, neto y aportes por empleado (o la
 * causa por la que no se liquidó). Al desplegar un empleado se ve su detalle por
 * concepto, y cada línea muestra la traza del motor. Antes de liquidar está vacía.
 */
@Component({
  selector: 'app-liquidacion-prenomina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ProgressBarModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    PagoNominaDialogComponent,
    NominaElectronicaComponent,
    RouterLink,
    EnvioComprobantesComponent,
  ],
  templateUrl: './liquidacion-prenomina.component.html',
  styleUrls: ['./prenomina-tabs.scss'],
})
export class LiquidacionPrenominaComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) documento!: DocumentoNominaModel;
  @Input() editable = false;
  /** Sube cuando algo fuera de la pestaña cambia lo liquidado (una novedad): se recarga. */
  @Input() version = 0;
  /** Terminó una liquidación: el encabezado refresca sus totales y la Traza. */
  @Output() liquidado = new EventEmitter<void>();

  /** Proceso de liquidación en curso (barra de avance); null si no hay. */
  proceso: ProcesoModel | null = null;
  lanzando = false;
  private pollHandle: ReturnType<typeof setTimeout> | null = null;

  filas: LiquidacionEmpleadoModel[] = [];
  /** Texto del buscador de la tabla (filtro global de p-table). */
  busqueda = '';
  cargando = true;
  /** Modal de conceptos: fila abierta, sus líneas y la línea con la traza desplegada. */
  mostrarConceptos = false;
  filaConceptos: LiquidacionEmpleadoModel | null = null;
  detalle: DetalleLiquidacionModel[] = [];
  cargandoDetalle = false;
  trazaAbierta: number | null = null;

  constructor(
    private readonly service: NominaDocumentoService,
    private readonly nominaService: NominaService,
    private readonly certificados: CertificadoService,
    private readonly empresaService: EmpresaService,
    private readonly pagoPdf: NominaPagoPdfService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['version'] && !changes['version'].firstChange) void this.cargar();
  }

  // ── Pago (nómina confirmada) ──────────────────────────────────────────────

  mostrarPago = false;
  pagando = false;
  /** Fila a pagar; null = todas las pendientes. */
  filaAPagar: LiquidacionEmpleadoModel | null = null;

  /** ¿Es una nómina confirmada (se paga desde aquí)? */
  get modoPago(): boolean {
    return this.documento.claseDocumento === 'NOMINA' && this.documento.estado === 'CONFIRMADO';
  }

  get pendientesPago(): LiquidacionEmpleadoModel[] {
    return this.filas.filter((f) => f.estado === 'APROBADO');
  }

  /** Mes de la nómina, para abrir Nómina electrónica → Por mes en ese mes. */
  get mesElectronica(): { anio: number; mes: number } {
    const [anio, mes] = this.documento.fechaHasta.substring(0, 7).split('-').map(Number);
    return { anio, mes };
  }

  get totalPendientePago(): number {
    return this.pendientesPago.reduce((t, f) => t + (f.neto ?? 0), 0);
  }

  /** Fila cuya nómina electrónica del mes se está consultando. */
  electronicaNominaId: number | null = null;
  mostrarElectronica = false;

  // ── PDF de pago: comprobantes y planilla para el banco ────────────────────

  /** Qué PDF se está armando (para el spinner del botón). */
  generandoPdf: 'banco' | number | null = null;
  /** Envío de los comprobantes por correo a cada empleado. */
  mostrarEnvioCorreo = false;

  /** Filas de la nómina que se pagan (liquidadas y no anuladas). */
  get filasPago(): LiquidacionEmpleadoModel[] {
    return this.filas.filter((f) => f.liquidada && f.estado !== 'ANULADO');
  }

  /** Comprobante de pago de un empleado. */
  async descargarComprobantes(fila: LiquidacionEmpleadoModel): Promise<void> {
    const filas = [fila];
    this.generandoPdf = fila.nominaId;
    this.cdr.markForCheck();
    try {
      const desprendibles = await this.desprendibles(filas);
      const empresa = (await lastValueFrom(this.empresaService.getConfig()))?.data ?? {};
      const nombre = `${this.documento.numeroCompleto}-${fila.empleadoNombre}`;
      await this.pagoPdf.comprobantes(desprendibles, this.documento, empresa, nombre);
    } catch (err: any) {
      this.alert.showError('Comprobantes', err?.error?.message ?? 'No se pudieron generar los comprobantes.');
    } finally {
      this.generandoPdf = null;
      this.cdr.markForCheck();
    }
  }

  /** Planilla para el banco: cuenta y valor a consignar de cada empleado. */
  async descargarPlanillaBanco(): Promise<void> {
    const filas = this.filasPago;
    if (!filas.length) return;
    this.generandoPdf = 'banco';
    this.cdr.markForCheck();
    try {
      const desprendibles = await this.desprendibles(filas);
      const empresa = (await lastValueFrom(this.empresaService.getConfig()))?.data ?? {};
      await this.pagoPdf.planillaBanco(desprendibles, this.documento, empresa);
    } catch (err: any) {
      this.alert.showError('Planilla del banco', err?.error?.message ?? 'No se pudo generar la planilla.');
    } finally {
      this.generandoPdf = null;
      this.cdr.markForCheck();
    }
  }

  /** Desprendible de cada fila, pedidos por lotes para no saturar el servidor. */
  private async desprendibles(filas: LiquidacionEmpleadoModel[]): Promise<DesprendibleModel[]> {
    const out: DesprendibleModel[] = [];
    for (let i = 0; i < filas.length; i += LOTE_PDF) {
      const lote = await Promise.all(
        filas.slice(i, i + LOTE_PDF).map((f) => lastValueFrom(this.certificados.desprendible(f.nominaId))),
      );
      out.push(...lote.map((r) => r.data));
    }
    return out;
  }

  /**
   * Consulta la nómina electrónica del MES del empleado (qué nóminas junta, estado,
   * CUNE, XML y PDF). El envío se hace por mes en Nómina electrónica → Por mes.
   */
  abrirElectronica(fila: LiquidacionEmpleadoModel): void {
    this.electronicaNominaId = fila.nominaId;
    this.mostrarElectronica = true;
  }

  abrirPago(fila: LiquidacionEmpleadoModel | null): void {
    this.filaAPagar = fila;
    this.mostrarPago = true;
  }

  async confirmarPago(pago: PagoNominaDto): Promise<void> {
    this.pagando = true;
    this.cdr.markForCheck();
    try {
      const ids = this.filaAPagar ? [this.filaAPagar.nominaId] : [];
      await lastValueFrom(this.service.pagar(this.documento.id, pago, ids));
      this.alert.showSuccess('Pago', this.filaAPagar ? `${this.filaAPagar.empleadoNombre} pagado` : 'Nómina pagada');
      this.mostrarPago = false;
      await this.cargar();
      this.liquidado.emit();
    } catch (err: any) {
      this.alert.showError('No se pudo pagar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.pagando = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  /** Empleados del documento aún sin liquidar: los nuevos y los que fallaron. */
  get pendientes(): number {
    return Math.max(0, this.documento.empleados - this.filas.filter((f) => f.liquidada).length);
  }

  /** Liquidar solo se ofrece mientras haya pendientes; el resto se reliquida por fila. */
  get mostrarLiquidar(): boolean {
    return this.editable && !this.cargando && this.pendientes > 0;
  }

  // ── Liquidar en segundo plano ─────────────────────────────────────────────

  /** Liquida los empleados pendientes (nuevos o con error). */
  liquidar(): Promise<void> {
    return this.lanzar([], true);
  }

  /** Vuelve a liquidar solo a ese empleado (después de corregir su vinculación o novedades). */
  reliquidar(fila: LiquidacionEmpleadoModel): Promise<void> {
    return this.lanzar([fila.nominaId], false);
  }

  private async lanzar(nominaIds: number[], soloPendientes: boolean): Promise<void> {
    this.lanzando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.liquidar(this.documento.id, nominaIds, soloPendientes));
      this.proceso = res.data;
      this.programarPoll(res.data.id);
    } catch (err: any) {
      this.alert.showError('No se pudo liquidar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.lanzando = false;
      this.cdr.markForCheck();
    }
  }

  private programarPoll(procesoId: number): void {
    this.detenerPolling();
    this.pollHandle = setTimeout(() => void this.consultarProceso(procesoId), POLL_MS);
  }

  private async consultarProceso(procesoId: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.nominaService.consultarProceso(procesoId));
      this.proceso = res.data ?? this.proceso;
      this.cdr.markForCheck();
      if (this.proceso && esTerminal(this.proceso.estado)) {
        await this.alTerminar(this.proceso);
        return;
      }
    } catch {
      // Un fallo de red puntual no corta el seguimiento: se reintenta.
    }
    this.programarPoll(procesoId);
  }

  /** Avisa cómo terminó, recarga la lista y avisa al encabezado. */
  private async alTerminar(p: ProcesoModel): Promise<void> {
    this.detenerPolling();
    if (p.estado === 'COMPLETADO') {
      this.alert.showSuccess('Liquidación', `${p.itemsOk} empleado(s) liquidado(s).`);
    } else if (p.estado === 'COMPLETADO_CON_ERRORES') {
      this.alert.showWarn('Liquidación', `${p.itemsOk} liquidados, ${p.itemsError} no se liquidaron: vea la causa en la lista.`);
    } else {
      this.alert.showError('Liquidación', p.mensaje ?? 'El proceso no pudo completarse.');
    }
    this.proceso = null;
    await this.cargar();
    this.liquidado.emit();
  }

  private detenerPolling(): void {
    if (this.pollHandle) clearTimeout(this.pollHandle);
    this.pollHandle = null;
  }

  get totales() {
    return totalesLiquidacion(this.filas);
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.liquidacion(this.documento.id));
      this.filas = res?.data ?? [];
    } catch {
      this.filas = [];
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  /** Abre el modal con los conceptos del empleado. */
  async verConceptos(fila: LiquidacionEmpleadoModel): Promise<void> {
    this.filaConceptos = fila;
    this.detalle = [];
    this.trazaAbierta = null;
    this.mostrarConceptos = true;
    this.cargandoDetalle = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.detalle(this.documento.id, fila.nominaId));
      this.detalle = res?.data ?? [];
    } catch {
      this.detalle = [];
    } finally {
      this.cargandoDetalle = false;
      this.cdr.markForCheck();
    }
  }

  cerrarConceptos(): void {
    this.mostrarConceptos = false;
    this.filaConceptos = null;
  }

  alternarTraza(lineaId: number): void {
    this.trazaAbierta = this.trazaAbierta === lineaId ? null : lineaId;
  }

  pasos(linea: DetalleLiquidacionModel): PasoTraza[] {
    return leerTraza(linea.traza);
  }

  /** Columna en la que cae el valor de la línea según su clase. */
  valorEn(linea: DetalleLiquidacionModel, columna: 'DEVENGADO' | 'DEDUCCION' | 'APORTE'): number | null {
    if (columna === 'APORTE') {
      return linea.clase === 'APORTE_EMPLEADOR' || linea.clase === 'PROVISION' ? linea.valor : null;
    }
    return linea.clase === columna ? linea.valor : null;
  }
}
