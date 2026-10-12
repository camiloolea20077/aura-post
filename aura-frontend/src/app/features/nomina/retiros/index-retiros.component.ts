import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  RetiroModel,
  TEXTO_ESTADO_RETIRO,
  severidadEstadoRetiro,
} from '../../../core/models/nomina-retiro.model';
import { NominaCatalogoService } from '../../../core/services/nomina-catalogo.service';
import { NominaRetiroService } from '../../../core/services/nomina-retiro.service';
import { VinculacionService } from '../../../core/services/vinculacion.service';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../shared/pipes/fecha-es.pipe';
import { aFechaLocal } from '../../../shared/utils/fecha.util';

type Opcion = { label: string; value: number };

/** Formulario del retiro (fechas como Date para el p-calendar). */
interface FormRetiro {
  contratoId: number | null;
  fechaRetiro: Date | null;
  motivoId: number | null;
  cesantiasCorteHasta: Date | null;
  observacion: string;
}

const RETIRO_VACIO = (): FormRetiro => ({
  contratoId: null,
  fechaRetiro: new Date(),
  motivoId: null,
  cesantiasCorteHasta: null,
  observacion: '',
});

/**
 * Retiros: registrar el retiro de una vinculación (la termina en esa fecha y PILA
 * reporta RET), ver su estado de liquidación y anularlo mientras no esté liquidado.
 */
@Component({
  selector: 'app-index-retiros',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    FechaEsPipe,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-retiros.component.html',
  styleUrls: ['./index-retiros.component.scss'],
})
export class IndexRetirosComponent implements OnInit {
  filas: RetiroModel[] = [];
  totalFilas = 0;
  cargando = true;
  busqueda = '';
  pagina = 0;
  tamano = 10;

  mostrarForm = false;
  guardando = false;
  /** Retiro cuya liquidación se está generando. */
  generando: number | null = null;
  form: FormRetiro = RETIRO_VACIO();
  vinculaciones: Opcion[] = [];
  motivos: Opcion[] = [];

  readonly severidad = severidadEstadoRetiro;

  constructor(
    private readonly service: NominaRetiroService,
    private readonly vinculacionService: VinculacionService,
    private readonly catalogos: NominaCatalogoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly router: Router,
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

  /** Abre el modal con las vinculaciones activas y los motivos de retiro. */
  async nuevo(): Promise<void> {
    this.form = RETIRO_VACIO();
    this.mostrarForm = true;
    const [vinc, motivos] = await Promise.allSettled([
      lastValueFrom(
        this.vinculacionService.page(0, 1000, null, {
          estado: 'ACTIVO',
          tipoVinculacionId: null,
          cargoId: null,
          grupoNominaId: null,
        }),
      ),
      lastValueFrom(this.catalogos.activos('motivos-retiro')),
    ]);
    this.vinculaciones =
      vinc.status === 'fulfilled'
        ? (vinc.value?.data?.content ?? []).map((v) => ({
            label: `${v.empleadoDocumento} - ${v.empleadoNombre} (${v.codigo ?? 'sin código'})`,
            value: v.id,
          }))
        : [];
    this.motivos =
      motivos.status === 'fulfilled' ? (motivos.value?.data ?? []).map((m) => ({ label: m.nombre, value: m.id })) : [];
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    const f = this.form;
    if (!f.contratoId || !f.fechaRetiro || !f.motivoId) {
      this.alert.showWarn('Retiro', 'Elija la vinculación, la fecha y el motivo del retiro.');
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.registrar({
          contratoId: f.contratoId,
          fechaRetiro: aFechaLocal(f.fechaRetiro),
          motivoId: f.motivoId,
          cesantiasCorteHasta: aFechaLocal(f.cesantiasCorteHasta),
          observacion: f.observacion.trim() || null,
        }),
      );
      this.mostrarForm = false;
      this.alert.showSuccess('Retiro', `${res.data.empleadoNombre} retirado. Queda pendiente de liquidar.`);
      void this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo registrar', err?.error?.message ?? 'Revise los datos.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  confirmarAnular(r: RetiroModel): void {
    this.confirm.confirm({
      message: `¿Anular el retiro de <b>${r.empleadoNombre}</b>? La vinculación vuelve a quedar activa.`,
      header: 'Anular retiro',
      icon: 'pi pi-ban',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.anular(r),
    });
  }

  private async anular(r: RetiroModel): Promise<void> {
    try {
      await lastValueFrom(this.service.anular(r.id));
      this.alert.showSuccess('Retiro', 'Retiro anulado; la vinculación quedó activa.');
      void this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo anular', err?.error?.message ?? 'Intente de nuevo.');
    }
  }

  textoEstado(r: RetiroModel): string {
    return TEXTO_ESTADO_RETIRO[r.estado];
  }

  /** Crea la prenómina de liquidación definitiva y la abre. */
  async generarLiquidacion(r: RetiroModel): Promise<void> {
    this.generando = r.id;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.generarLiquidacion(r.id));
      this.alert.showSuccess('Retiro', `Liquidación ${res.data.numeroCompleto} creada. Liquídela en su pestaña Liquidación.`);
      void this.router.navigate(['/nomina/prenomina', res.data.id]);
    } catch (err: any) {
      this.alert.showError('No se pudo generar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.generando = null;
      this.cdr.markForCheck();
    }
  }

  abrirLiquidacion(r: RetiroModel): void {
    if (r.documentoId) void this.router.navigate(['/nomina/prenomina', r.documentoId]);
  }
}
