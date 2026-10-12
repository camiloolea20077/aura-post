import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SelectModule } from 'primeng/select';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, lastValueFrom } from 'rxjs';

import {
  CreateDocumentoNominaDto,
  DocumentoNominaModel,
  nominaPagada,
  severidadEstadoDocumento,
  textoEstadoDocumento,
} from '../../../../core/models/nomina-documento.model';
import {
  OPCIONES_CLASE_COMPROBANTE,
  TipoComprobanteModel,
} from '../../../../core/models/nomina-parametros.model';
import { NominaDocumentoService } from '../../../../core/services/nomina-documento.service';
import { NominaTipoComprobanteService } from '../../../../core/services/nomina-tipo-comprobante.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { ResponseModel } from '../../../../shared/utils/responde.models';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';
import { PantallaDocumento, pantallaDocumento, periodoPorClase, rangoDelMes } from '../prenomina.util';
import { EmpleadosPrenominaComponent } from '../tabs/empleados-prenomina.component';
import { ContabilidadPrenominaComponent } from '../tabs/contabilidad-prenomina.component';
import { LiquidacionPrenominaComponent } from '../tabs/liquidacion-prenomina.component';
import { NovedadesPrenominaComponent } from '../tabs/novedades-prenomina.component';
import { TrazaPrenominaComponent } from '../tabs/traza-prenomina.component';

/**
 * Prenómina: encabezado del documento (tipo de comprobante, período de días,
 * fechas de liquidación y pago, simulación) y, al guardarlo, las pestañas
 * Empleados, Liquidación, Presupuesto, Contabilidad, Traza y Adjuntos.
 */
@Component({
  selector: 'app-form-prenomina',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    SelectModule,
    TabViewModule,
    TagModule,
    TextareaModule,
    TooltipModule,
    PuedeDirective,
    EmpleadosPrenominaComponent,
    NovedadesPrenominaComponent,
    LiquidacionPrenominaComponent,
    ContabilidadPrenominaComponent,
    TrazaPrenominaComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './form-prenomina.component.html',
  styleUrls: ['./form-prenomina.component.scss'],
})
export class FormPrenominaComponent implements OnInit {
  documento: DocumentoNominaModel | null = null;
  tipos: TipoComprobanteModel[] = [];
  opcionesTipos: { label: string; value: number }[] = [];
  readonly opcionesSiNo = [
    { label: 'No', value: false },
    { label: 'Sí', value: true },
  ];

  /**
   * Pestañas que quedan vacías por decisión del usuario, en orden: Presupuesto
   * (entre Liquidación y Contabilidad) y Adjuntos (al final).
   */
  readonly pestanasVacias = [
    { titulo: 'Presupuesto', icono: 'pi pi-chart-bar', vacio: 'Sin datos de presupuesto para este documento.' },
    { titulo: 'Adjuntos', icono: 'pi pi-paperclip', vacio: 'No hay archivos adjuntos.' },
  ];

  /** Sube al terminar cada liquidación: la pestaña Traza se recarga. */
  version = 0;

  /** Prenómina o nómina, según la ruta (al cargar manda la clase del documento). */
  pantalla: PantallaDocumento;
  /** Acción del ciclo en curso (confirmar, generar…), para el spinner del botón. */
  procesando: string | null = null;

  form: FormGroup;
  cargando = true;
  guardando = false;
  tabActiva = 0;

  readonly severidad = severidadEstadoDocumento;
  readonly textoEstado = textoEstadoDocumento;
  readonly pagada = nominaPagada;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: NominaDocumentoService,
    private readonly tiposService: NominaTipoComprobanteService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {
    this.pantalla = pantallaDocumento(this.route.snapshot.data['clase']);
    const mes = rangoDelMes(new Date());
    this.form = this.fb.group({
      tipoComprobanteId: [null as number | null, Validators.required],
      fecha: [new Date() as Date | null, Validators.required],
      fechaDesde: [mes.desde as Date | null, Validators.required],
      fechaHasta: [mes.hasta as Date | null, Validators.required],
      fechaLiquidacion: [mes.hasta as Date | null],
      fechaPago: [mes.hasta as Date | null],
      simulacion: [false],
      descripcion: ['', Validators.maxLength(500)],
    });
  }

  get esEdicion(): boolean {
    return !!this.documento;
  }

  /** Solo la prenómina preliminar se edita. */
  get editable(): boolean {
    if (!this.documento) return this.pantalla.clase === 'PRENOMINA';
    return this.documento.claseDocumento === 'PRENOMINA' && this.documento.estado === 'PRELIMINAR';
  }

  get esNomina(): boolean {
    return this.documento?.claseDocumento === 'NOMINA';
  }

  /** Clase del tipo elegido, para mostrarla junto al select. */
  get claseTipo(): string | null {
    const id = this.form.get('tipoComprobanteId')!.value;
    const tipo = this.tipos.find((t) => t.id === id);
    return tipo ? (OPCIONES_CLASE_COMPROBANTE.find((o) => o.value === tipo.clase)?.label ?? null) : null;
  }

  private readonly destroyRef = inject(DestroyRef);

  async ngOnInit(): Promise<void> {
    await this.cargarTipos();
    // Al crear: el período y la fecha de pago se proponen según la clase del tipo.
    this.form
      .get('tipoComprobanteId')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id: number | null) => {
        if (!this.documento) this.proponerFechas(id);
      });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) await this.cargarDocumento(id);
    else this.proponerTipo();
    this.cargando = false;
  }

  private async cargarTipos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.tiposService.activos());
      this.tipos = res?.data ?? [];
      this.opcionesTipos = this.tipos.map((t) => ({ label: `${t.nombre} (${t.prefijo})`, value: t.id }));
    } catch {
      this.tipos = [];
      this.opcionesTipos = [];
    }
  }

  /** Período, liquidación y pago propuestos para la clase del tipo elegido. */
  private proponerFechas(tipoId: number | null): void {
    const clase = this.tipos.find((t) => t.id === tipoId)?.clase ?? null;
    const p = periodoPorClase(clase, new Date());
    this.form.patchValue(
      { fechaDesde: p.desde, fechaHasta: p.hasta, fechaLiquidacion: p.hasta, fechaPago: p.pago },
      { emitEvent: false },
    );
  }

  /** Al crear se propone el primer tipo periódico (la nómina del mes). */
  private proponerTipo(): void {
    const periodico = this.tipos.find((t) => t.clase === 'PERIODICO') ?? this.tipos[0];
    if (periodico) this.form.patchValue({ tipoComprobanteId: periodico.id });
  }

  private async cargarDocumento(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.obtener(id));
      this.aplicar(res.data);
    } catch (err: any) {
      this.alert.showError('Prenómina', err?.error?.message ?? 'No se encontró el documento.');
      this.volver();
    }
  }

  private aplicar(d: DocumentoNominaModel): void {
    this.documento = d;
    this.pantalla = pantallaDocumento(d.claseDocumento);
    // Un tipo inactivo no sale en /list: se agrega para que el select lo muestre.
    if (!this.opcionesTipos.some((o) => o.value === d.tipoComprobanteId)) {
      this.opcionesTipos = [...this.opcionesTipos, { label: d.tipoComprobanteNombre, value: d.tipoComprobanteId }];
    }
    this.form.reset({
      tipoComprobanteId: d.tipoComprobanteId,
      fecha: aDate(d.fecha),
      fechaDesde: aDate(d.fechaDesde),
      fechaHasta: aDate(d.fechaHasta),
      fechaLiquidacion: aDate(d.fechaLiquidacion),
      fechaPago: aDate(d.fechaPago),
      simulacion: d.simulacion,
      descripcion: d.descripcion ?? '',
    });
    if (this.editable) this.form.enable();
    else this.form.disable();
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.alert.showWarn('Prenómina', 'Revise los campos marcados.');
      return;
    }
    this.guardando = true;
    try {
      const dto = this.aDto();
      const res = await lastValueFrom(
        this.esEdicion ? this.service.actualizar(this.documento!.id, dto) : this.service.crearPrenomina(dto),
      );
      this.alert.showSuccess('Prenómina', `${res.data.numeroCompleto} guardada`);
      if (this.esEdicion) this.aplicar(res.data);
      else void this.router.navigate([this.pantalla.ruta, res.data.id], { replaceUrl: true });
    } catch (err: any) {
      this.alert.showError('No se pudo guardar', err?.error?.message ?? 'Revise los datos.');
    } finally {
      this.guardando = false;
    }
  }

  confirmarAnular(): void {
    const d = this.documento;
    if (!d) return;
    const nomina = d.claseDocumento === 'NOMINA';
    this.confirm.confirm({
      message: nomina
        ? `¿Anular la nómina <b>${d.numeroCompleto}</b>? Se reversa el asiento de cada empleado. No se puede deshacer.`
        : `¿Anular la prenómina <b>${d.numeroCompleto}</b>? No se puede deshacer.`,
      header: nomina ? 'Anular nómina' : 'Anular prenómina',
      icon: 'pi pi-ban',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.anular(d.id),
    });
  }

  private async anular(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.anular(id));
      this.alert.showSuccess(this.pantalla.titulo, `${res.data.numeroCompleto} anulada`);
      this.aplicar(res.data);
    } catch (err: any) {
      this.alert.showError('No se pudo anular', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  /** Terminó una liquidación o un pago (desde la pestaña): refresca encabezado, Contabilidad y Traza. */
  async onLiquidado(): Promise<void> {
    this.version++;
    await this.recargar();
  }

  /** Cambió una novedad: el empleado quedó sin liquidar; se refresca todo. */
  async onNovedad(): Promise<void> {
    this.version++;
    await this.recargar();
  }

  /** Relee el encabezado (conteo de empleados) después de agregar o quitar. */
  async recargar(): Promise<void> {
    if (!this.documento) return;
    try {
      const res = await lastValueFrom(this.service.obtener(this.documento.id));
      this.documento = res.data;
    } catch {
      // El conteo se corrige al recargar la página.
    }
  }

  /** Al cambiar el período, la liquidación y el pago siguen a la fecha final. */
  onFechaHasta(): void {
    const hasta = this.form.get('fechaHasta')!.value as Date | null;
    if (!hasta) return;
    this.form.patchValue({ fechaLiquidacion: hasta, fechaPago: hasta });
  }

  volver(): void {
    void this.router.navigate([this.pantalla.ruta]);
  }

  // ── Ciclo prenómina → nómina ──────────────────────────────────────────────

  confirmarPrenomina(): void {
    const d = this.documento;
    if (!d) return;
    this.confirm.confirm({
      message: `¿Confirmar la prenómina <b>${d.numeroCompleto}</b>? Ya no se podrán agregar, quitar ni liquidar empleados (se puede reabrir mientras no se genere la nómina).`,
      header: 'Confirmar prenómina',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      accept: () => void this.ejecutar('confirmar', () => this.service.confirmarPrenomina(d.id), 'Prenómina confirmada'),
    });
  }

  reabrir(): void {
    const d = this.documento;
    if (d) void this.ejecutar('reabrir', () => this.service.reabrir(d.id), 'Prenómina reabierta');
  }

  async generarNomina(): Promise<void> {
    const d = this.documento;
    if (!d) return;
    this.procesando = 'generar';
    try {
      const res = await lastValueFrom(this.service.generarNomina(d.id));
      this.alert.showSuccess('Nómina', `${res.data.numeroCompleto} generada`);
      void this.router.navigate(['/nomina/nominas', res.data.id]);
    } catch (err: any) {
      this.alert.showError('No se pudo generar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.procesando = null;
    }
  }

  confirmarNomina(): void {
    const d = this.documento;
    if (!d) return;
    this.confirm.confirm({
      message: `¿Confirmar la nómina <b>${d.numeroCompleto}</b>? Se aprueban sus ${d.empleados} empleado(s), se genera el asiento contable y se prepara la nómina electrónica.`,
      header: 'Confirmar nómina',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      accept: () => void this.ejecutar('confirmar', () => this.service.confirmarNomina(d.id), 'Nómina confirmada'),
    });
  }

  /** ¿Nómina de cesantías confirmada? (descarga la consignación por fondo). */
  get esCesantiasConfirmada(): boolean {
    const d = this.documento;
    return !!d && d.claseDocumento === 'NOMINA' && d.estado === 'CONFIRMADO' && d.claseComprobante === 'CESANTIAS';
  }

  async descargarCesantias(): Promise<void> {
    const d = this.documento;
    if (!d) return;
    this.procesando = 'cesantias';
    try {
      const blob = await lastValueFrom(this.service.cesantiasExcel(d.id));
      this.service.descargar(blob, `Consignacion_cesantias_${d.numeroCompleto}.xlsx`);
    } catch {
      this.alert.showError('Cesantías', 'No se pudo generar el Excel de la consignación.');
    } finally {
      this.procesando = null;
    }
  }

  irANomina(): void {
    if (this.documento?.nominaGeneradaId) void this.router.navigate(['/nomina/nominas', this.documento.nominaGeneradaId]);
  }

  irAPrenomina(): void {
    if (this.documento?.documentoOrigenId) void this.router.navigate(['/nomina/prenomina', this.documento.documentoOrigenId]);
  }

  /** Corre una acción del ciclo y refresca el documento con lo que devuelve. */
  private async ejecutar(
    accion: string,
    llamada: () => Observable<ResponseModel<DocumentoNominaModel>>,
    exito: string,
  ): Promise<void> {
    this.procesando = accion;
    try {
      const res = await lastValueFrom(llamada());
      this.alert.showSuccess(this.pantalla.titulo, exito);
      this.aplicar(res.data);
      this.version++;
    } catch (err: any) {
      this.alert.showError('No se pudo completar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.procesando = null;
    }
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  private aDto(): CreateDocumentoNominaDto {
    const v = this.form.getRawValue();
    return {
      tipoComprobanteId: v.tipoComprobanteId,
      fecha: aFechaLocal(v.fecha),
      fechaDesde: aFechaLocal(v.fechaDesde),
      fechaHasta: aFechaLocal(v.fechaHasta),
      fechaLiquidacion: aFechaLocal(v.fechaLiquidacion),
      fechaPago: aFechaLocal(v.fechaPago),
      simulacion: v.simulacion === true,
      descripcion: v.descripcion?.trim() || null,
    };
  }
}
