import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { VacacionesSaldoModel } from '../../../core/models/nomina.model';
import {
  ResultadoColectivasModel,
  TEXTO_ESTADO_VACACION,
  TEXTO_TIPO_VACACION,
  TipoVacacion,
  VacacionModel,
  severidadEstadoVacacion,
} from '../../../core/models/nomina-vacacion.model';
import { NominaVacacionService } from '../../../core/services/nomina-vacacion.service';
import { VinculacionService } from '../../../core/services/vinculacion.service';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../shared/pipes/fecha-es.pipe';
import { aFechaLocal } from '../../../shared/utils/fecha.util';

type Opcion = { label: string; value: number };

/** Formulario de vacaciones (fechas como Date para el p-calendar). */
interface FormVacacion {
  contratoId: number | null;
  tipo: TipoVacacion;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  dias: number | null;
  observacion: string;
}

interface FormColectivas {
  contratoIds: number[];
  fechaInicio: Date | null;
  fechaFin: Date | null;
  observacion: string;
}

const VACACION_VACIA = (): FormVacacion => ({
  contratoId: null,
  tipo: 'TIEMPO',
  fechaInicio: null,
  fechaFin: null,
  dias: null,
  observacion: '',
});

const COLECTIVAS_VACIAS = (): FormColectivas => ({
  contratoIds: [],
  fechaInicio: null,
  fechaFin: null,
  observacion: '',
});

/**
 * Vacaciones: se registran aquí (en tiempo o en dinero, individuales o colectivas) y
 * entran solas a la nómina del período como novedad. El saldo descuenta lo registrado.
 */
@Component({
  selector: 'app-index-vacaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    FechaEsPipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-vacaciones.component.html',
  styleUrls: ['./index-vacaciones.component.scss'],
})
export class IndexVacacionesComponent implements OnInit {
  filas: VacacionModel[] = [];
  totalFilas = 0;
  cargando = true;
  busqueda = '';
  pagina = 0;
  tamano = 10;

  vinculaciones: Opcion[] = [];
  guardando = false;

  mostrarForm = false;
  form: FormVacacion = VACACION_VACIA();
  saldo: VacacionesSaldoModel | null = null;
  cargandoSaldo = false;

  mostrarColectivas = false;
  colectivas: FormColectivas = COLECTIVAS_VACIAS();
  resultadoColectivas: ResultadoColectivasModel | null = null;

  mostrarRetorno = false;
  retornoDe: VacacionModel | null = null;
  fechaRetorno: Date | null = null;

  readonly tipos: { label: string; value: TipoVacacion }[] = [
    { label: 'En tiempo (disfrute)', value: 'TIEMPO' },
    { label: 'En dinero (compensadas)', value: 'DINERO' },
  ];
  readonly severidad = severidadEstadoVacacion;

  constructor(
    private readonly service: NominaVacacionService,
    private readonly vinculacionService: VinculacionService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.page({ page: this.pagina, rows: this.tamano, search: this.busqueda || null }),
      );
      this.filas = res?.data?.content ?? [];
      this.totalFilas = res?.data?.totalElements ?? 0;
    } catch {
      this.filas = [];
      this.totalFilas = 0;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onPagina(e: { first: number; rows: number }): void {
    this.pagina = e.first / e.rows;
    this.tamano = e.rows;
    void this.cargar();
  }

  buscar(): void {
    this.pagina = 0;
    void this.cargar();
  }

  limpiarBusqueda(): void {
    if (!this.busqueda) return;
    this.busqueda = '';
    this.buscar();
  }

  // ── Registrar ─────────────────────────────────────────────────────────

  async nuevo(): Promise<void> {
    this.form = VACACION_VACIA();
    this.saldo = null;
    this.mostrarForm = true;
    await this.cargarVinculaciones();
  }

  /** Al elegir la vinculación se muestra su saldo de días. */
  async onVinculacion(): Promise<void> {
    this.saldo = null;
    if (!this.form.contratoId) return;
    this.cargandoSaldo = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.saldo(this.form.contratoId));
      this.saldo = res?.data ?? null;
    } catch {
      this.saldo = null;
    } finally {
      this.cargandoSaldo = false;
      this.cdr.markForCheck();
    }
  }

  async guardar(): Promise<void> {
    const f = this.form;
    const enTiempo = f.tipo === 'TIEMPO';
    if (!f.contratoId || !f.fechaInicio || (enTiempo ? !f.fechaFin : !f.dias)) {
      this.alert.showWarn(
        'Vacaciones',
        enTiempo ? 'Elija la vinculación y las fechas de disfrute.' : 'Elija la vinculación, la fecha y los días.',
      );
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.registrar({
          contratoId: f.contratoId,
          tipo: f.tipo,
          fechaInicio: aFechaLocal(f.fechaInicio)!,
          fechaFin: enTiempo ? aFechaLocal(f.fechaFin) : null,
          dias: enTiempo ? null : f.dias,
          observacion: f.observacion.trim() || null,
        }),
      );
      this.mostrarForm = false;
      const v = res.data;
      this.alert.showSuccess(
        'Vacaciones',
        v.tipo === 'TIEMPO'
          ? `${v.empleadoNombre}: ${v.diasHabiles} días hábiles; regresa el ${v.fechaRegreso}.`
          : `${v.empleadoNombre}: ${v.diasHabiles} días compensados en dinero.`,
      );
      void this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo registrar', err?.error?.message ?? 'Revise los datos.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Colectivas ────────────────────────────────────────────────────────

  async nuevasColectivas(): Promise<void> {
    this.colectivas = COLECTIVAS_VACIAS();
    this.resultadoColectivas = null;
    this.mostrarColectivas = true;
    await this.cargarVinculaciones();
  }

  async guardarColectivas(): Promise<void> {
    const c = this.colectivas;
    if (!c.fechaInicio || !c.fechaFin) {
      this.alert.showWarn('Vacaciones colectivas', 'Elija las fechas de disfrute.');
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.colectivas({
          contratoIds: c.contratoIds,
          fechaInicio: aFechaLocal(c.fechaInicio)!,
          fechaFin: aFechaLocal(c.fechaFin)!,
          observacion: c.observacion.trim() || null,
        }),
      );
      this.resultadoColectivas = res.data;
      if (!res.data.omitidos.length) {
        this.mostrarColectivas = false;
        this.alert.showSuccess('Vacaciones colectivas', `${res.data.registradas} empleados registrados.`);
      }
      void this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudieron registrar', err?.error?.message ?? 'Revise los datos.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Regreso anticipado y anular ───────────────────────────────────────

  abrirRetorno(v: VacacionModel): void {
    this.retornoDe = v;
    this.fechaRetorno = null;
    this.mostrarRetorno = true;
  }

  async guardarRetorno(): Promise<void> {
    if (!this.retornoDe || !this.fechaRetorno) {
      this.alert.showWarn('Regreso anticipado', 'Elija la fecha en que volvió a trabajar.');
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.retorno(this.retornoDe.id, aFechaLocal(this.fechaRetorno)!));
      this.mostrarRetorno = false;
      this.alert.showSuccess(
        'Regreso anticipado',
        `${res.data.diasNoDisfrutados} días hábiles vuelven al saldo de ${res.data.empleadoNombre}.`,
      );
      void this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo registrar', err?.error?.message ?? 'Revise la fecha.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  confirmarAnular(v: VacacionModel): void {
    this.confirm.confirm({
      message: `¿Anular las vacaciones de <b>${v.empleadoNombre}</b>? Los días vuelven al saldo.`,
      header: 'Anular vacaciones',
      icon: 'pi pi-ban',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.anular(v),
    });
  }

  private async anular(v: VacacionModel): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(v.id));
      this.alert.showSuccess('Vacaciones', 'Vacaciones anuladas.');
      void this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo anular', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  // ── Apoyo ─────────────────────────────────────────────────────────────

  textoTipo(v: VacacionModel): string {
    return TEXTO_TIPO_VACACION[v.tipo];
  }

  textoEstado(v: VacacionModel): string {
    return TEXTO_ESTADO_VACACION[v.estado];
  }

  /** Vinculaciones activas para los selects (una sola carga por apertura). */
  private async cargarVinculaciones(): Promise<void> {
    if (this.vinculaciones.length) return;
    try {
      const res = await lastValueFrom(
        this.vinculacionService.page(0, 1000, null, {
          estado: 'ACTIVO',
          tipoVinculacionId: null,
          cargoId: null,
          grupoNominaId: null,
        }),
      );
      this.vinculaciones = (res?.data?.content ?? []).map((v) => ({
        label: `${v.empleadoDocumento} - ${v.empleadoNombre} (${v.codigo ?? 'sin código'})`,
        value: v.id,
      }));
    } catch {
      this.vinculaciones = [];
    }
    this.cdr.markForCheck();
  }
}
