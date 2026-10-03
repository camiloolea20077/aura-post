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
import { Router } from '@angular/router';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { RetiroActivoDto } from '../../../core/models/activo-fijo.model';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { CuentaAutocompleteComponent } from '../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';

@Component({
  selector: 'app-activos-fijos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CuentaAutocompleteComponent,
    PuedeDirective,
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
    TerceroAutocompleteComponent,
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
  bajaFecha: Date = new Date();
  retirando = false;

  // ── Modal venta ────────────────────────────────────────────────
  showVentaModal = false;
  ventaActivo: ActivoFijoTableModel | null = null;
  ventaFecha: Date = new Date();
  ventaMotivo = '';
  ventaValor: number | null = null;
  ventaIva = 0;
  ventaCuentaId: number | null = null;
  ventaCompradorId: number | null = null;
  cuentasCobroOpts: { label: string; value: number }[] = [];
  readonly ivaOpts = [0, 5, 19].map((t) => ({ label: `${t} %`, value: t }));

  // ── Ficha: fechas y componentes ────────────────────────────────
  fechaInicioDep: Date | null = null;
  polizaVence: Date | null = null;
  padreOpts: { label: string; value: number }[] = [];

  // ── Depreciación por unidades de producción ────────────────────
  activosUnidades: { id: number; codigo: string; descripcion: string; unidades: number | null }[] = [];
  reversando = false;

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
    private readonly router: Router,
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
      // La venta se cobra en caja, banco o cartera (clientes).
      this.cuentasCobroOpts = (cuentasRes?.data ?? [])
        .filter((c: PlanCuentaModel) => c.auxiliar && c.activa && /^(11|13)/.test(c.codigo ?? ''))
        .map((c: PlanCuentaModel) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
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
    this.fechaInicioDep = null;
    this.polizaVence = null;
    this.cargarPadres(null);
    this.showModal = true;
    this.cdr.markForCheck();
  }

  /** Activos que pueden ser padre (el activo del que este es componente). */
  private async cargarPadres(excluirId: number | null): Promise<void> {
    try {
      const res = await lastValueFrom(this.activoService.listar({ page: 0, rows: 500, search: '' }));
      this.padreOpts = (res?.data?.content ?? [])
        .filter((a) => a.id !== excluirId && (a.estado === 'ACTIVO' || a.estado === 'DEPRECIADO'))
        .map((a) => ({ label: `${a.codigo} — ${a.descripcion}`, value: a.id }));
    } catch {
      this.padreOpts = [];
    }
    this.cdr.markForCheck();
  }

  verFicha(row: ActivoFijoTableModel): void {
    this.router.navigate(['/contabilidad/activos-fijos', row.id]);
  }

  verInforme(): void {
    this.router.navigate(['/contabilidad/activos-fijos/informe']);
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
          placa: d.placa ?? null,
          serial: d.serial ?? null,
          marca: d.marca ?? null,
          modelo: d.modelo ?? null,
          responsableTerceroId: d.responsableTerceroId ?? null,
          activoPadreId: d.activoPadreId ?? null,
          aseguradora: d.aseguradora ?? null,
          polizaNumero: d.polizaNumero ?? null,
          polizaVence: d.polizaVence ?? null,
          fechaInicioDepreciacion: d.fechaInicioDepreciacion ?? null,
          unidadesEstimadas: d.unidadesEstimadas ?? null,
        };
        this.fechaAdquisicion = new Date(d.fechaAdquisicion + 'T00:00:00');
        this.fechaInicioDep = d.fechaInicioDepreciacion ? new Date(d.fechaInicioDepreciacion + 'T00:00:00') : null;
        this.polizaVence = d.polizaVence ? new Date(d.polizaVence + 'T00:00:00') : null;
        this.cargarPadres(d.id);
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
    this.form.fechaInicioDepreciacion = this.fechaInicioDep ? aFechaLocal(this.fechaInicioDep) : null;
    this.form.polizaVence = this.polizaVence ? aFechaLocal(this.polizaVence) : null;
    if (this.form.metodoDepreciacion !== 'UNIDADES_PRODUCCION') this.form.unidadesEstimadas = null;
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
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? e?.message ?? 'No se pudo guardar el activo.');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }

  // ── Dar de baja ─────────────────────────────────────────────────
  openBaja(row: ActivoFijoTableModel): void {
    this.bajaId = row.id;
    this.bajaObservaciones = '';
    this.bajaFecha = new Date();
    this.showBajaModal = true;
    this.cdr.markForCheck();
  }

  async confirmarBaja(): Promise<void> {
    if (!this.bajaId) return;
    if (!this.bajaObservaciones.trim()) {
      this.alertService.showWarn('Falta el motivo', 'Escribe por qué se da de baja el activo.');
      return;
    }
    this.retirando = true;
    this.cdr.markForCheck();
    try {
      const dto: RetiroActivoDto = { fecha: aFechaLocal(this.bajaFecha), motivo: this.bajaObservaciones.trim() };
      await lastValueFrom(this.activoService.darDeBaja(this.bajaId, dto));
      this.alertService.showSuccess('Dado de baja', 'Activo dado de baja y contabilizado.');
      this.showBajaModal = false;
      this.loadActivos();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo dar de baja el activo.');
    } finally {
      this.retirando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Venta ───────────────────────────────────────────────────────
  openVenta(row: ActivoFijoTableModel): void {
    this.ventaActivo = row;
    this.ventaFecha = new Date();
    this.ventaMotivo = '';
    this.ventaValor = null;
    this.ventaIva = 0;
    this.ventaCuentaId = null;
    this.ventaCompradorId = null;
    this.showVentaModal = true;
    this.cdr.markForCheck();
  }

  get ventaResultado(): number | null {
    if (this.ventaActivo == null || this.ventaValor == null) return null;
    return this.ventaValor - (this.ventaActivo.valorEnLibros ?? 0);
  }

  async confirmarVenta(): Promise<void> {
    if (!this.ventaActivo) return;
    if (!this.ventaMotivo.trim() || this.ventaValor == null || !this.ventaCuentaId) {
      this.alertService.showWarn('Datos incompletos', 'Escribe el motivo, el precio y la cuenta que recibe el pago.');
      return;
    }
    this.retirando = true;
    this.cdr.markForCheck();
    try {
      const dto: RetiroActivoDto = {
        fecha: aFechaLocal(this.ventaFecha),
        motivo: this.ventaMotivo.trim(),
        valorVenta: this.ventaValor,
        ivaPorcentaje: this.ventaIva,
        cuentaCobroId: this.ventaCuentaId,
        compradorTerceroId: this.ventaCompradorId,
      };
      await lastValueFrom(this.activoService.vender(this.ventaActivo.id, dto));
      this.alertService.showSuccess('Venta registrada', 'El activo salió de los libros con su utilidad o pérdida.');
      this.showVentaModal = false;
      this.loadActivos();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo registrar la venta.');
    } finally {
      this.retirando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Depreciación ────────────────────────────────────────────────
  async openDepreciar(): Promise<void> {
    this.periodoIdDepreciar = null;
    this.activosUnidades = [];
    this.showDepreciarModal = true;
    this.cdr.markForCheck();
    // Los activos por unidades de producción necesitan el uso del mes.
    try {
      const res = await lastValueFrom(this.activoService.listar({ page: 0, rows: 500, search: '' }));
      this.activosUnidades = (res?.data?.content ?? [])
        .filter((a) => a.metodoDepreciacion === 'UNIDADES_PRODUCCION' && a.estado === 'ACTIVO')
        .map((a) => ({ id: a.id, codigo: a.codigo, descripcion: a.descripcion, unidades: null }));
    } catch {
      this.activosUnidades = [];
    }
    this.cdr.markForCheck();
  }

  async reversarDepreciacion(): Promise<void> {
    if (!this.periodoIdDepreciar) {
      this.alertService.showWarn('Selecciona un período', 'Elige el período cuya depreciación quieres reversar.');
      return;
    }
    this.reversando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.activoService.reversarDepreciacion(this.periodoIdDepreciar));
      this.alertService.showSuccess('Depreciación reversada', res?.message ?? 'Listo.');
      this.showDepreciarModal = false;
      this.loadActivos();
    } catch (e: any) {
      this.alertService.showError('Error', e?.error?.message ?? 'No se pudo reversar la depreciación.');
    } finally {
      this.reversando = false;
      this.cdr.markForCheck();
    }
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
      const unidades: Record<number, number> = {};
      this.activosUnidades
        .filter((a) => (a.unidades ?? 0) > 0)
        .forEach((a) => (unidades[a.id] = a.unidades!));
      const res = await lastValueFrom(
        this.activoService.calcularDepreciacion(
          this.periodoIdDepreciar,
          Object.keys(unidades).length ? unidades : undefined,
        ),
      );
      const procesados = res?.data?.length ?? 0;
      this.alertService.showSuccess(
        'Depreciación calculada',
        `Se procesaron ${procesados} activo(s) para el período seleccionado.`,
      );
      this.showDepreciarModal = false;
      this.loadActivos();
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo calcular la depreciación.',
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
      placa: null,
      serial: null,
      marca: null,
      modelo: null,
      responsableTerceroId: null,
      activoPadreId: null,
      aseguradora: null,
      polizaNumero: null,
      polizaVence: null,
      fechaInicioDepreciacion: null,
      unidadesEstimadas: null,
    };
  }
}
