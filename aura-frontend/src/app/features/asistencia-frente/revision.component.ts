import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import { NominaService } from '../../core/services/nomina.service';
import { ProyectoService } from '../../core/services/proyecto.service';
import { AlertService } from '../../shared/pipes/alert.service';
import {
  AsistenciaFrenteModel,
  RevisionTableModel,
} from '../../core/models/asistencia-frente.model';

type Sev = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'app-revision-frente',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    TextareaModule,
    TagModule,
    ToastModule,
    TooltipModule,
    DatePickerModule,
  ],
  providers: [MessageService],
  templateUrl: './revision.component.html',
  styleUrls: ['./revision.component.scss'],
})
export class RevisionFrenteComponent implements OnInit {
  // Filtros
  estado: string | null = 'ENVIADO_REVISION';
  proyectoId: number | null = null;
  fecha: string | null = null;
  proyectoOpts: { label: string; value: number | null }[] = [];

  // Aprobar varios días a la vez (V242)
  frenteBloqueOpts: { label: string; value: number }[] = [];
  frenteBloqueId: number | null = null;
  rangoBloque: (Date | null)[] | null = null;
  enviarNominaBloque = true;
  aprobandoBloque = false;
  erroresBloque: { fecha: string; mensaje: string }[] = [];
  readonly enviarNominaOpts = [
    { label: 'Aprobar y enviar a nómina', value: true },
    { label: 'Solo aprobar', value: false },
  ];

  rows: RevisionTableModel[] = [];
  totalRecords = 0;
  loading = false;
  page = 0;
  pageSize = 10;

  view: 'lista' | 'detalle' = 'lista';
  detalle: AsistenciaFrenteModel | null = null;
  observacion = '';
  processing = false;

  readonly estadoRevisionOpts = [
    { label: 'Aprobado', value: 'APROBADO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
    { label: 'Pendiente', value: 'PENDIENTE' },
  ];

  readonly estadoOpts = [
    { label: 'Enviadas a revisión', value: 'ENVIADO_REVISION' },
    { label: 'Aprobadas', value: 'APROBADO' },
    { label: 'Rechazadas', value: 'RECHAZADO' },
    { label: 'En corrección', value: 'EN_CORRECCION' },
    { label: 'Todas', value: null },
  ];

  constructor(
    private readonly service: ProyectoService,
    private readonly nominaService: NominaService,
    private readonly alertService: AlertService,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // ── KPIs ──────────────────────────────────────────────────
  get totalTrabajadores(): number {
    return this.detalle?.detalles?.length ?? 0;
  }
  get registrosPendientes(): number {
    return (this.detalle?.detalles ?? []).filter(
      (d) => d.estadoAsistencia === 'SIN_REGISTRO',
    ).length;
  }
  get alertasDetectadas(): number {
    return this.detalle?.alertas?.length ?? 0;
  }
  get trabajadoresCeroHoras(): number {
    return (this.detalle?.detalles ?? []).filter(
      (d) =>
        (d.horasTrabajadas ?? 0) <= 0 && d.estadoAsistencia !== 'SIN_REGISTRO',
    ).length;
  }

  /** Se calcula una sola vez al abrir para NO recargar el iframe en cada ciclo de cambios. */
  safePdfUrl: SafeResourceUrl | null = null;

  ngOnInit(): void {
    this.cargarProyectos();
    this.cargar();
  }

  async cargarProyectos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.list());
      this.proyectoOpts = [
        { label: 'Todos los proyectos', value: null },
        ...(res?.data ?? []).map((p) => ({
          label: `${p.codigo} — ${p.nombre}`,
          value: p.id,
        })),
      ];
      this.cdr.markForCheck();
    } catch {
      /* no bloqueante */
    }
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.revisionPage({
          page: this.page,
          rows: this.pageSize,
          estado: this.estado,
          proyectoId: this.proyectoId,
          fecha: this.fecha,
        }),
      );
      this.rows = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (e: any) {
      if (e?.status !== 206) {
        this.alertService.showError('Error', 'No se pudo cargar la bandeja');
      }
      this.rows = [];
      this.totalRecords = 0;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  /** Frentes del proyecto elegido, para aprobar en bloque. */
  private async cargarFrentesBloque(): Promise<void> {
    this.frenteBloqueOpts = [];
    this.frenteBloqueId = null;
    if (!this.proyectoId) return;
    try {
      const res = await lastValueFrom(this.service.frentes(this.proyectoId));
      const frentes = (res?.data ?? []).filter((f) => f.estado !== 'ANULADO');
      this.frenteBloqueOpts = frentes.map((f) => ({
        label: f.esGeneral ? 'Todo el proyecto (General)' : `${f.codigo} — ${f.nombre}`,
        value: f.id,
      }));
      const general = frentes.find((f) => f.esGeneral);
      // V243 — sin frentes, todo está en el General (el proyecto completo).
      if (general && !(await this.usaFrentes())) this.frenteBloqueId = general.id;
      else if (frentes.length === 1) this.frenteBloqueId = frentes[0].id;
    } catch {
      /* no bloqueante */
    } finally {
      this.cdr.markForCheck();
    }
  }

  /** ¿La empresa divide los proyectos en frentes? (Configuración de nómina, V243). */
  private async usaFrentes(): Promise<boolean> {
    try {
      const res = await lastValueFrom(this.nominaService.getConfig());
      return res?.data?.asistenciaUsaFrentes !== false;
    } catch {
      return true;
    }
  }

  async aprobarBloque(): Promise<void> {
    const [desde, hasta] = this.rangoBloque ?? [];
    if (!this.frenteBloqueId || !desde || !hasta) return;
    this.aprobandoBloque = true;
    this.erroresBloque = [];
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.aprobarRango(this.frenteBloqueId, this.iso(desde), this.iso(hasta), this.enviarNominaBloque),
      );
      const r = res?.data;
      this.erroresBloque = r?.errores ?? [];
      if (this.erroresBloque.length)
        this.alertService.showWarn('Aprobación', `${r?.procesados ?? 0} día(s) aprobados; ${this.erroresBloque.length} con problemas.`);
      else this.alertService.showSuccess('Aprobación', `${r?.procesados ?? 0} día(s) aprobados.`);
      await this.cargar();
    } catch (e: any) {
      this.alertService.showError('No se pudo aprobar', e?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.aprobandoBloque = false;
      this.cdr.markForCheck();
    }
  }

  private iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  onFiltro(): void {
    this.page = 0;
    if (this.proyectoId !== this.proyectoBloque) {
      this.proyectoBloque = this.proyectoId;
      void this.cargarFrentesBloque();
    }
    this.cargar();
  }

  /** Proyecto del que están cargados los frentes del bloque. */
  private proyectoBloque: number | null = null;

  onPage(event: { first: number; rows: number }): void {
    this.page = event.first / event.rows;
    this.pageSize = event.rows;
    this.cargar();
  }

  async abrir(row: RevisionTableModel): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getRevision(row.id));
      this.detalle = res?.data ?? null;
      this.safePdfUrl = this.detalle?.soportePdfUrl
        ? this.sanitizer.bypassSecurityTrustResourceUrl(
            this.detalle.soportePdfUrl,
          )
        : null;
      // Por defecto se aprueba lo pendiente; el admin puede rechazar filas puntuales.
      (this.detalle?.detalles ?? []).forEach((d) => {
        if (d.id && (!d.estadoRevision || d.estadoRevision === 'PENDIENTE')) {
          d.estadoRevision = 'APROBADO';
        }
      });
      this.observacion = '';
      this.view = 'detalle';
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la asistencia');
    }
  }

  volver(): void {
    this.view = 'lista';
    this.detalle = null;
    this.safePdfUrl = null;
    this.cargar();
  }

  get tieneCriticas(): boolean {
    return !!this.detalle?.alertas?.some(
      (a) => a.nivel === 'CRITICA' && a.estado === 'ABIERTA',
    );
  }

  get esRevisable(): boolean {
    return this.detalle?.estado === 'ENVIADO_REVISION';
  }

  private async ejecutar(fn: () => Promise<any>, okMsg: string): Promise<void> {
    if (!this.detalle?.id) return;
    this.processing = true;
    this.cdr.markForCheck();
    try {
      await fn();
      this.alertService.showSuccess('Listo', okMsg);
      this.volver();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo procesar',
      );
    } finally {
      this.processing = false;
      this.cdr.markForCheck();
    }
  }

  async aprobar(): Promise<void> {
    if (!this.detalle?.id) return;
    const id = this.detalle.id;
    const items = (this.detalle.detalles ?? [])
      .filter((d) => d.id)
      .map((d) => ({ detalleId: d.id!, estadoRevision: d.estadoRevision }));
    this.processing = true;
    this.cdr.markForCheck();
    try {
      if (items.length)
        await lastValueFrom(this.service.revisarDetalles(id, items));
      await lastValueFrom(
        this.service.aprobarRevision(id, this.observacion || undefined),
      );
      this.alertService.showSuccess('Listo', 'Asistencia aprobada');
      this.volver();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo aprobar',
      );
    } finally {
      this.processing = false;
      this.cdr.markForCheck();
    }
  }

  formatFecha(f: string | null | undefined): string {
    if (!f) return '';
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  revisionSeverity(estado: string): Sev {
    const m: Record<string, Sev> = {
      APROBADO: 'success',
      RECHAZADO: 'danger',
      PENDIENTE: 'secondary',
      AJUSTADO: 'warn',
      ENVIADO_NOMINA: 'success',
    };
    return m[estado] ?? 'secondary';
  }

  rechazar(): void {
    if (!this.observacion.trim()) {
      this.alertService.showWarn(
        'Observación requerida',
        'Indica el motivo del rechazo',
      );
      return;
    }
    const id = this.detalle!.id!;
    this.ejecutar(
      () => lastValueFrom(this.service.rechazarRevision(id, this.observacion)),
      'Asistencia rechazada',
    );
  }

  solicitarCorreccion(): void {
    if (!this.observacion.trim()) {
      this.alertService.showWarn(
        'Observación requerida',
        'Indica qué debe corregir el líder',
      );
      return;
    }
    const id = this.detalle!.id!;
    this.ejecutar(
      () =>
        lastValueFrom(this.service.solicitarCorreccion(id, this.observacion)),
      'Corrección solicitada',
    );
  }

  async enviarNomina(): Promise<void> {
    if (!this.detalle?.id) return;
    const id = this.detalle.id;
    this.processing = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.enviarNomina(id));
      const n = res?.data ?? 0;
      this.alertService.showSuccess(
        'Enviado a nómina',
        `Se generaron ${n} novedad(es) de nómina.`,
      );
      this.volver();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo enviar a nómina',
      );
    } finally {
      this.processing = false;
      this.cdr.markForCheck();
    }
  }

  get esAprobada(): boolean {
    return this.detalle?.estado === 'APROBADO';
  }

  estadoSeverity(estado: string): Sev {
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
