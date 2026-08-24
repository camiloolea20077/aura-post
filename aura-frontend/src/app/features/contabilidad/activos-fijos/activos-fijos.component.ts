import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ActivoFijoService } from '../../../core/services/activo-fijo.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { PeriodoContableService } from '../../../core/services/periodo-contable.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  ActivoFijoModel,
  ActivoFijoTableModel,
  CreateActivoFijoDto,
  DepreciacionPeriodoModel,
  CATEGORIA_ACTIVO_OPTIONS,
  METODO_DEPRECIACION_OPTIONS,
  ESTADO_ACTIVO_BADGE,
  EstadoActivo,
} from '../../../core/models/activo-fijo.model';
import { PlanCuentaModel } from '../../../core/models/contabilidad.model';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
@Component({
  selector: 'app-activos-fijos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    DialogModule,
    BadgeModule,
    TooltipModule,
    TabViewModule,
    DividerModule,
    TextareaModule,
    IconFieldModule,
    InputIconModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './activos-fijos.component.html',
  styleUrls: ['./activos-fijos.component.scss'],
})
export class ActivosFijosComponent implements OnInit {
  // ── Estado tabla ───────────────────────────────────────────────
  activos: ActivoFijoTableModel[] = [];
  total = 0;
  page = 0;
  rows = 10;
  search = '';
  loading = true;

  // ── Modal CRUD ─────────────────────────────────────────────────
  showModal = false;
  isEdit = false;
  editId: number | null = null;
  saving = false;

  // ── Modal historial ────────────────────────────────────────────
  showHistorial = false;
  historialActivo: ActivoFijoTableModel | null = null;
  historial: DepreciacionPeriodoModel[] = [];

  // ── Modal dar de baja ──────────────────────────────────────────
  showBajaModal = false;
  bajaId: number | null = null;
  bajaObservaciones = '';

  // ── Modal depreciar ────────────────────────────────────────────
  showDepreciarModal = false;
  periodoIdDepreciar: number | null = null;
  periodosOpts: { label: string; value: number }[] = [];
  depreciando = false;

  // ── Formulario ─────────────────────────────────────────────────
  form: CreateActivoFijoDto = this.emptyForm();
  fechaAdquisicion: Date = new Date();

  // ── Catálogos ──────────────────────────────────────────────────
  cuentasOpts: { label: string; value: number }[] = [];
  readonly categoriaOpts = CATEGORIA_ACTIVO_OPTIONS;
  readonly metodoOpts = METODO_DEPRECIACION_OPTIONS;
  readonly estadoBadge = ESTADO_ACTIVO_BADGE;

  constructor(
    private readonly activoService: ActivoFijoService,
    private readonly contabilidadService: ContabilidadService,
    private readonly periodoService: PeriodoContableService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCatalogos();
    this.loadActivos();
  }

  private async loadCatalogos(): Promise<void> {
    try {
      const [cuentasRes, periodosRes] = await Promise.all([
        lastValueFrom(this.contabilidadService.listarPlan()),
        lastValueFrom(this.periodoService.listar()),
      ]);
      this.cuentasOpts = (cuentasRes?.data ?? []).map((c: PlanCuentaModel) => ({
        label: `${c.codigo} - ${c.nombre}`,
        value: c.id,
      }));
      this.periodosOpts = (periodosRes?.data ?? []).map((p: any) => ({
        label: `${p.anio}/${String(p.mes).padStart(2, '0')} — ${p.estado}`,
        value: p.id,
      }));
    } catch {
      /* non-fatal */
    }
    this.cdr.markForCheck();
  }

  async loadActivos(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.activoService.listar({
          page: this.page,
          rows: this.rows,
          search: this.search,
        }),
      );
      this.activos = res?.data?.content ?? [];
      this.total = res?.data?.totalElements ?? 0;
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar los activos fijos.',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    this.page = 0;
    this.loadActivos();
  }
  onPage(e: { first?: number; rows?: number | null }): void {
    const first = e.first ?? 0;
    const rows = e.rows ?? this.rows;
    this.page = first / rows;
    this.rows = rows;
    this.loadActivos();
  }

  // ── CRUD ────────────────────────────────────────────────────────
  openCreate(): void {
    this.isEdit = false;
    this.editId = null;
    this.form = this.emptyForm();
    this.fechaAdquisicion = new Date();
    this.showModal = true;
    this.cdr.markForCheck();
  }

  async openEdit(row: ActivoFijoTableModel): Promise<void> {
    try {
      const res = await lastValueFrom(this.activoService.getById(row.id));
      if (res?.data) {
        const d: ActivoFijoModel = res.data;
        this.form = {
          codigo: d.codigo,
          descripcion: d.descripcion,
          categoria: d.categoria,
          fechaAdquisicion: d.fechaAdquisicion,
          valorCompra: d.valorCompra,
          vidaUtilMeses: d.vidaUtilMeses,
          metodoDepreciacion: d.metodoDepreciacion,
          valorResidual: d.valorResidual,
          ubicacion: d.ubicacion,
          responsable: d.responsable,
          cuentaActivoId: d.cuentaActivoId,
          cuentaDepreciacionId: d.cuentaDepreciacionId,
          cuentaGastoDepId: d.cuentaGastoDepId,
          centroCostoId: d.centroCostoId,
          periodoContableId: d.periodoContableId,
          terceroId: d.terceroId,
          observaciones: d.observaciones,
        };
        this.fechaAdquisicion = new Date(d.fechaAdquisicion + 'T00:00:00');
        this.isEdit = true;
        this.editId = d.id;
        this.showModal = true;
        this.cdr.markForCheck();
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el activo.');
    }
  }

  async save(): Promise<void> {
    if (
      !this.form.codigo ||
      !this.form.descripcion ||
      !this.form.categoria ||
      !this.form.valorCompra
    ) {
      this.alertService.showWarn(
        'Campos requeridos',
        'Completa código, descripción, categoría y valor de compra.',
      );
      return;
    }
    this.form.fechaAdquisicion = aFechaLocal(this.fechaAdquisicion);
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const obs =
        this.isEdit && this.editId
          ? this.activoService.update(this.editId, this.form)
          : this.activoService.create(this.form);
      await lastValueFrom(obs);
      this.alertService.showSuccess(
        this.isEdit ? 'Actualizado' : 'Registrado',
        `Activo ${this.isEdit ? 'actualizado' : 'registrado'} correctamente.`,
      );
      this.showModal = false;
      this.loadActivos();
    } catch {
      this.alertService.showError('Error', 'No se pudo guardar el activo.');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  // ── Dar de baja ─────────────────────────────────────────────────
  openBaja(row: ActivoFijoTableModel): void {
    this.bajaId = row.id;
    this.bajaObservaciones = '';
    this.showBajaModal = true;
    this.cdr.markForCheck();
  }

  async confirmarBaja(): Promise<void> {
    if (!this.bajaId) return;
    try {
      await lastValueFrom(
        this.activoService.darDeBaja(
          this.bajaId,
          this.bajaObservaciones || undefined,
        ),
      );
      this.alertService.showSuccess(
        'Dado de baja',
        'Activo dado de baja correctamente.',
      );
      this.showBajaModal = false;
      this.loadActivos();
    } catch {
      this.alertService.showError('Error', 'No se pudo dar de baja el activo.');
    }
    this.cdr.markForCheck();
  }

  // ── Depreciación ────────────────────────────────────────────────
  openDepreciar(): void {
    this.periodoIdDepreciar = null;
    this.showDepreciarModal = true;
    this.cdr.markForCheck();
  }

  async ejecutarDepreciacion(): Promise<void> {
    if (!this.periodoIdDepreciar) {
      this.alertService.showWarn(
        'Selecciona un período',
        'Debes elegir el período a depreciar.',
      );
      return;
    }
    this.depreciando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.activoService.calcularDepreciacion(this.periodoIdDepreciar),
      );
      const procesados = res?.data?.length ?? 0;
      this.alertService.showSuccess(
        'Depreciación calculada',
        `Se procesaron ${procesados} activo(s) para el período seleccionado.`,
      );
      this.showDepreciarModal = false;
      this.loadActivos();
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo calcular la depreciación.',
      );
    } finally {
      this.depreciando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Historial ───────────────────────────────────────────────────
  async openHistorial(row: ActivoFijoTableModel): Promise<void> {
    this.historialActivo = row;
    this.historial = [];
    this.showHistorial = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.activoService.historialDepreciacion(row.id),
      );
      this.historial = res?.data ?? [];
    } catch {
      this.historial = [];
    }
    this.cdr.markForCheck();
  }

  estadoBadgeSeverity(
    estado: EstadoActivo,
  ):
    | 'success'
    | 'secondary'
    | 'info'
    | 'warn'
    | 'danger'
    | 'contrast'
    | 'help'
    | 'primary' {
    return (this.estadoBadge[estado] ?? 'info') as
      | 'success'
      | 'secondary'
      | 'info'
      | 'warn'
      | 'danger'
      | 'contrast'
      | 'help'
      | 'primary';
  }

  private emptyForm(): CreateActivoFijoDto {
    return {
      codigo: '',
      descripcion: '',
      categoria: 'EQUIPO',
      fechaAdquisicion: aFechaLocal(new Date()),
      valorCompra: 0,
      vidaUtilMeses: 60,
      metodoDepreciacion: 'LINEA_RECTA',
      valorResidual: 0,
      ubicacion: null,
      responsable: null,
      cuentaActivoId: null,
      cuentaDepreciacionId: null,
      cuentaGastoDepId: null,
      centroCostoId: null,
      periodoContableId: null,
      terceroId: null,
      observaciones: null,
    };
  }
}
