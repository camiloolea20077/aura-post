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
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;

import { ProyectoService } from '../../core/services/proyecto.service';
import { NominaService } from '../../core/services/nomina.service';
import { RegistroHoras } from '../../core/models/nomina.model';
import { ImportarMarcajeComponent } from './importar-marcaje/importar-marcaje.component';
import { CalendarioAsistenciaComponent } from './calendario-asistencia/calendario-asistencia.component';
import { FilaCalendario, filasDesdeCalendario } from './calendario-asistencia/calendario-asistencia.util';
import { DatePickerModule } from 'primeng/datepicker';
import { AlertService } from '../../shared/pipes/alert.service';
import {
  AsistenciaDetalleModel,
  AsistenciaFrenteModel,
  EstadoAsistencia,
} from '../../core/models/asistencia-frente.model';

type Sev = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-digitacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    ToastModule,
    TooltipModule,
    ProgressBarModule,
    ImportarMarcajeComponent,
    CalendarioAsistenciaComponent,
    DatePickerModule,
  ],
  providers: [MessageService],
  templateUrl: './digitacion.component.html',
  styleUrls: ['./digitacion.component.scss'],
})
export class DigitacionComponent implements OnInit {
  proyectoOpts: { label: string; value: number }[] = [];
  frenteOpts: { label: string; value: number }[] = [];

  proyectoId: number | null = null;
  frenteId: number | null = null;
  /** El proyecto solo tiene su frente General: se trabaja por proyecto, sin elegir frente (V241). */
  soloProyecto = false;
  /** Diálogo de marcaje del mes desde Excel (V242). */
  mostrarImportar = false;

  /** Vista: un día (digitar/consultar) o el mes en calendario. */
  vista: 'dia' | 'mes' = 'dia';
  mesVista: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  calendario: { anio: number; mes: number; festivos: string[]; filas: FilaCalendario[] } | null = null;
  cargandoMes = false;

  /** Cómo trabaja la empresa (Configuración de nómina → Asistencia por obra, V243). */
  usaFrentes = true;
  exigeSoporte = true;
  registro: RegistroHoras = 'AMBOS';
  /** false = sin revisión: lo registrado pasa directo a la prenómina al liquidar (V245). */
  requiereAprobacion = true;

  /** Se pueden digitar horas a mano (el día es editable y la empresa no trabaja solo con Excel). */
  get puedeDigitar(): boolean {
    return this.editable && this.registro !== 'EXCEL';
  }

  /**
   * Tarjeta del soporte PDF (descargar planilla, subir escaneado): solo si la empresa
   * digita a mano y exige soporte. Con registro por Excel el soporte es el Excel importado.
   */
  get muestraSoportePdf(): boolean {
    return this.requiereAprobacion && this.registro !== 'EXCEL' && (this.exigeSoporte || this.tieneSoporte);
  }

  /** Falta el soporte para enviar a revisión (con Excel lo pone la importación). */
  get faltaSoporte(): boolean {
    return this.exigeSoporte && this.registro !== 'EXCEL' && !this.tieneSoporte;
  }

  /** El botón de importar Excel se ofrece salvo que la empresa digite solo a mano. */
  get permiteExcel(): boolean {
    return this.registro !== 'MANUAL';
  }

  /** Nombre del proyecto/frente elegido, para el título de la plantilla. */
  get nombreFrenteActual(): string {
    const p = this.proyectoOpts.find((o) => o.value === this.proyectoId)?.label ?? '';
    if (this.soloProyecto) return p;
    const f = this.frenteOpts.find((o) => o.value === this.frenteId)?.label ?? '';
    return [p, f].filter(Boolean).join(' · ');
  }

  /** Tras importar, recarga el día o el mes que se está viendo. */
  onImportado(): void {
    if (this.vista === 'mes') void this.cargarMes();
    else if (this.data) void this.cargar();
  }

  verMes(): void {
    this.vista = 'mes';
    void this.cargarMes();
  }

  verDia(): void {
    this.vista = 'dia';
    this.cdr.markForCheck();
  }

  /** Asistencia del mes elegido en calendario (trabajadores × días). */
  async cargarMes(): Promise<void> {
    if (!this.frenteId) return;
    const anio = this.mesVista.getFullYear();
    const mes = this.mesVista.getMonth() + 1;
    this.cargandoMes = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.calendarioAsistencia(this.frenteId, `${anio}-${String(mes).padStart(2, '0')}`),
      );
      const cal = res?.data;
      this.calendario = cal
        ? { anio: cal.anio, mes: cal.mes, festivos: cal.festivos, filas: filasDesdeCalendario(cal) }
        : null;
    } catch (e: any) {
      this.alertService.showError('Calendario', e?.error?.message ?? 'No se pudo cargar el mes');
    } finally {
      this.cargandoMes = false;
      this.cdr.markForCheck();
    }
  }

  /** Clic en un día del calendario: abre ese día en la vista Día. */
  abrirDia(fecha: string): void {
    this.fecha = fecha;
    this.vista = 'dia';
    void this.cargar();
  }
  fecha: string = this.hoyISO();

  data: AsistenciaFrenteModel | null = null;

  loading = false;
  saving = false;
  sending = false;
  uploading = false;
  dragOver = false;

  readonly estadoAsistenciaOpts: { label: string; value: EstadoAsistencia }[] =
    [
      { label: 'Asistió', value: 'ASISTIO' },
      { label: 'No asistió', value: 'NO_ASISTIO' },
      { label: 'Llegó tarde', value: 'LLEGO_TARDE' },
      { label: 'Salió temprano', value: 'SALIO_TEMPRANO' },
      { label: 'Permiso', value: 'PERMISO' },
      { label: 'Incapacidad', value: 'INCAPACIDAD' },
      { label: 'Vacaciones', value: 'VACACIONES' },
      { label: 'Suspendido', value: 'SUSPENDIDO' },
      { label: 'Sin registro', value: 'SIN_REGISTRO' },
    ];

  constructor(
    private readonly service: ProyectoService,
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarProyectos();
    this.cargarModo();
  }

  /** Lee de la configuración de nómina cómo se trabaja la asistencia por obra. */
  private async cargarModo(): Promise<void> {
    try {
      const res = await lastValueFrom(this.nominaService.getConfig());
      const c = res?.data;
      this.usaFrentes = c?.asistenciaUsaFrentes !== false;
      this.exigeSoporte = c?.asistenciaExigeSoporte !== false;
      this.registro = c?.asistenciaRegistro ?? 'AMBOS';
      this.requiereAprobacion = c?.asistenciaRequiereAprobacion !== false;
      this.cdr.markForCheck();
    } catch {
      /* sin configuración: como siempre */
    }
  }

  private hoyISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  }

  async cargarProyectos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.list());
      this.proyectoOpts = (res?.data ?? []).map((p) => ({
        label: `${p.codigo} — ${p.nombre}`,
        value: p.id,
      }));
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  async onProyectoChange(): Promise<void> {
    this.frenteId = null;
    this.frenteOpts = [];
    this.soloProyecto = false;
    this.data = null;
    if (!this.proyectoId) return;
    try {
      const res = await lastValueFrom(this.service.frentes(this.proyectoId));
      const frentes = (res?.data ?? []).filter((f) => f.estado !== 'ANULADO');
      this.frenteOpts = frentes.map((f) => ({
        label: f.esGeneral ? 'Todo el proyecto (General)' : `${f.codigo} — ${f.nombre}`,
        value: f.id,
      }));
      // Sin frentes (por configuración o porque el proyecto no tiene propios): se
      // trabaja sobre el General, que es el proyecto completo, y se elige solo.
      const general = frentes.find((f) => f.esGeneral);
      if (general && (!this.usaFrentes || frentes.length === 1)) {
        this.soloProyecto = true;
        this.frenteId = general.id;
      }
      if (this.vista === 'mes') {
        this.calendario = null;
        if (this.frenteId) void this.cargarMes();
      }
      if (!general && !this.usaFrentes)
        this.alertService.showWarn('Proyecto sin frente General',
          'Vuelva a guardar la Configuración de nómina para preparar el proyecto completo.');
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  async cargar(): Promise<void> {
    if (!this.frenteId || !this.fecha) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.obtenerAsistencia(this.frenteId, this.fecha),
      );
      this.data = res?.data ?? null;
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo cargar la asistencia',
      );
      this.data = null;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  get editable(): boolean {
    if (!this.data) return false;
    return (
      this.data.estado === 'BORRADOR' || this.data.estado === 'EN_CORRECCION'
    );
  }

  get tieneSoporte(): boolean {
    return !!this.data?.soportePdfId;
  }

  get proyectoNombre(): string {
    return (
      this.proyectoOpts.find((p) => p.value === this.proyectoId)?.label ?? ''
    );
  }

  // ── Soporte PDF (Fase C) ─────────────────────────────────────
  descargarPlantilla(): void {
    if (!this.data) return;
    const body = (this.data.detalles ?? []).map((d, i) => [
      String(i + 1),
      d.empleadoNombre,
      d.documento ?? '',
      d.cargo ?? '',
      '',
      '',
      '',
    ]);
    const doc: any = {
      pageSize: 'A4',
      pageMargins: [28, 32, 28, 32],
      content: [
        { text: 'PLANILLA DE ASISTENCIA', style: 'titulo' },
        {
          columns: [
            { text: [{ text: 'Proyecto: ', bold: true }, this.proyectoNombre] },
            { text: [{ text: 'Fecha: ', bold: true }, this.fecha], width: 130 },
          ],
          margin: [0, 8, 0, 2],
        },
        {
          text: [{ text: 'Frente: ', bold: true }, this.data.frenteNombre],
          margin: [0, 0, 0, 8],
        },
        {
          table: {
            headerRows: 1,
            widths: [18, '*', 70, 80, 55, 55, 70],
            body: [
              [
                { text: '#', style: 'th' },
                { text: 'Trabajador', style: 'th' },
                { text: 'Documento', style: 'th' },
                { text: 'Cargo', style: 'th' },
                { text: 'Entrada', style: 'th' },
                { text: 'Salida', style: 'th' },
                { text: 'Firma', style: 'th' },
              ],
              ...(body.length
                ? body
                : [
                    [
                      {
                        text: 'Sin trabajadores asignados',
                        colSpan: 7,
                        alignment: 'center',
                      },
                      '',
                      '',
                      '',
                      '',
                      '',
                      '',
                    ],
                  ]),
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          columns: [
            {
              text: '\n\n_______________________\nFirma del líder',
              alignment: 'center',
            },
            {
              text: '\n\n_______________________\nRevisado por',
              alignment: 'center',
            },
          ],
          margin: [0, 24, 0, 0],
        },
      ],
      styles: {
        titulo: { fontSize: 15, bold: true, alignment: 'center' },
        th: { bold: true, fontSize: 9, fillColor: '#f1f5f9' },
      },
      defaultStyle: { fontSize: 9 },
    };
    pdfMake
      .createPdf(doc)
      .download(`Planilla-${this.data.frenteNombre}-${this.fecha}.pdf`);
  }

  async onSoporteSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    await this.subirArchivo(file);
    input.value = '';
  }

  // ── Drag & drop del PDF ──────────────────────────────────────
  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    if (!this.editable || this.uploading) return;
    this.dragOver = true;
    this.cdr.markForCheck();
  }

  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    this.dragOver = false;
    this.cdr.markForCheck();
  }

  async onDrop(ev: DragEvent): Promise<void> {
    ev.preventDefault();
    this.dragOver = false;
    this.cdr.markForCheck();
    if (!this.editable || this.uploading) return;
    await this.subirArchivo(ev.dataTransfer?.files?.[0]);
  }

  private async subirArchivo(file: File | undefined): Promise<void> {
    if (!file || !this.frenteId) return;
    if (file.type !== 'application/pdf') {
      this.alertService.showError('Error', 'El soporte debe ser un archivo PDF');
      return;
    }
    this.uploading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.subirSoporte(this.frenteId, this.fecha, file),
      );
      this.data = res?.data ?? this.data;
      this.alertService.showSuccess(
        'Cargado',
        'Soporte PDF cargado correctamente',
      );
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo cargar el soporte',
      );
    } finally {
      this.uploading = false;
      this.cdr.markForCheck();
    }
  }

  /** Horas calculadas en vivo para mostrar en la fila. */
  horas(row: AsistenciaDetalleModel): number {
    if (!row.horaEntrada || !row.horaSalida) return 0;
    if (
      row.estadoAsistencia === 'NO_ASISTIO' ||
      row.estadoAsistencia === 'SIN_REGISTRO'
    )
      return 0;
    const [eh, em] = row.horaEntrada.split(':').map(Number);
    const [sh, sm] = row.horaSalida.split(':').map(Number);
    const descanso = Number(row.minutosDescanso) > 0 ? Number(row.minutosDescanso) : 0;
    const min = sh * 60 + sm - (eh * 60 + em) - descanso;
    return min > 0 ? Math.round((min / 60) * 100) / 100 : 0;
  }

  private buildDto() {
    return {
      fecha: this.fecha,
      observacionLider: this.data?.observacionLider ?? null,
      detalles: (this.data?.detalles ?? []).map((d) => ({
        empleadoId: d.empleadoId,
        horaEntrada: d.horaEntrada || null,
        horaSalida: d.horaSalida || null,
        minutosDescanso:
          d.minutosDescanso === null || d.minutosDescanso === undefined || (d.minutosDescanso as any) === ''
            ? null
            : Number(d.minutosDescanso),
        estadoAsistencia: d.estadoAsistencia,
        observacionLider: d.observacionLider || null,
      })),
    };
  }

  async guardar(): Promise<boolean> {
    if (!this.frenteId) return false;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.guardarBorrador(this.frenteId, this.buildDto()),
      );
      this.data = res?.data ?? this.data;
      this.alertService.showSuccess(
        'Guardado',
        'Borrador de asistencia guardado',
      );
      return true;
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo guardar',
      );
      return false;
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  async enviar(): Promise<void> {
    // Persistir lo digitado y luego enviar a revisión. Con registro solo por Excel no
    // hay nada digitado que guardar (el back rechaza la digitación manual).
    const ok = this.puedeDigitar ? await this.guardar() : true;
    if (!ok || !this.data?.id) return;
    this.sending = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.enviarRevision(this.data.id));
      this.alertService.showSuccess('Enviado', 'Asistencia enviada a revisión');
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo enviar a revisión',
      );
    } finally {
      this.sending = false;
      this.cdr.markForCheck();
    }
  }

  estadoFrenteSeverity(estado: string): Sev {
    const m: Record<string, Sev> = {
      BORRADOR: 'secondary',
      ENVIADO_REVISION: 'info',
      EN_CORRECCION: 'warn',
      APROBADO: 'success',
      RECHAZADO: 'danger',
      ENVIADO_NOMINA: 'success',
      ANULADO: 'danger',
    };
    return m[estado] ?? 'secondary';
  }

  nivelSeverity(nivel: string): Sev {
    const m: Record<string, Sev> = {
      INFO: 'info',
      ADVERTENCIA: 'warn',
      CRITICA: 'danger',
    };
    return m[nivel] ?? 'secondary';
  }
}
