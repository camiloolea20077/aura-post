import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  AgregarNovedadDocumentoDto,
  DocumentoNominaModel,
  NovedadDocumentoModel,
  OPCIONES_SUBTIPO_INCAPACIDAD,
  OPCIONES_TIPO_NOVEDAD,
  novedadPideFechas,
  textoTipoNovedad,
} from '../../../../core/models/nomina-documento.model';
import { TipoNovedad } from '../../../../core/models/nomina.model';
import { NominaDocumentoService } from '../../../../core/services/nomina-documento.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';

/** Formulario de una novedad nueva (fechas como Date para el p-calendar). */
interface NovedadForm {
  nominaId: number | null;
  tipo: TipoNovedad | null;
  subtipo: string | null;
  descripcion: string;
  cantidad: number | null;
  valorUnitario: number | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  numeroAutorizacion: string;
}

const NOVEDAD_VACIA = (): NovedadForm => ({
  nominaId: null,
  tipo: null,
  subtipo: null,
  descripcion: '',
  cantidad: 1,
  valorUnitario: null,
  fechaInicio: null,
  fechaFin: null,
  numeroAutorizacion: '',
});

/**
 * Pestaña Novedades de la prenómina: horas extra, incapacidades, licencias,
 * bonos, préstamos… de los empleados del documento. Al agregar o quitar una, el
 * empleado queda sin liquidar y se reliquida desde la pestaña Liquidación.
 */
@Component({
  selector: 'app-novedades-prenomina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    FechaEsPipe,
  ],
  templateUrl: './novedades-prenomina.component.html',
  styleUrls: ['./prenomina-tabs.scss'],
})
export class NovedadesPrenominaComponent implements OnInit {
  @Input({ required: true }) documento!: DocumentoNominaModel;
  @Input() editable = false;
  /** Cambió una novedad: el encabezado y la liquidación se refrescan. */
  @Output() cambio = new EventEmitter<void>();

  novedades: NovedadDocumentoModel[] = [];
  /** Texto del buscador de la tabla (filtro global de p-table). */
  busqueda = '';
  cargando = true;

  mostrarForm = false;
  guardando = false;
  form: NovedadForm = NOVEDAD_VACIA();
  empleados: { label: string; value: number }[] = [];

  readonly opcionesTipo = OPCIONES_TIPO_NOVEDAD;
  readonly opcionesSubtipo = OPCIONES_SUBTIPO_INCAPACIDAD;
  readonly textoTipo = textoTipoNovedad;

  constructor(
    private readonly service: NominaDocumentoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargar();
  }

  get pideFechas(): boolean {
    return novedadPideFechas(this.form.tipo);
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.novedades(this.documento.id));
      this.novedades = res?.data ?? [];
    } catch {
      this.novedades = [];
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  async nueva(): Promise<void> {
    this.form = NOVEDAD_VACIA();
    try {
      const res = await lastValueFrom(this.service.empleados(this.documento.id));
      this.empleados = (res?.data ?? []).map((e) => ({
        label: `${e.empleadoDocumento} - ${e.empleadoNombre}`,
        value: e.nominaId,
      }));
    } catch {
      this.empleados = [];
    }
    this.mostrarForm = true;
    this.cdr.markForCheck();
  }

  async guardar(): Promise<void> {
    const f = this.form;
    if (!f.nominaId || !f.tipo) {
      this.alert.showWarn('Novedad', 'Elija el empleado y el tipo de novedad.');
      return;
    }
    if (this.pideFechas && (!f.fechaInicio || !f.fechaFin)) {
      this.alert.showWarn('Novedad', 'Indique la fecha de inicio y de fin.');
      return;
    }
    if (!this.pideFechas && !f.valorUnitario) {
      this.alert.showWarn('Novedad', 'Indique el valor de la novedad.');
      return;
    }
    const dto: AgregarNovedadDocumentoDto = {
      nominaId: f.nominaId,
      tipo: f.tipo,
      subtipo: f.tipo === 'INCAPACIDAD' ? f.subtipo : null,
      descripcion: f.descripcion.trim() || null,
      cantidad: f.cantidad,
      valorUnitario: f.valorUnitario,
      fechaInicio: aFechaLocal(f.fechaInicio),
      fechaFin: aFechaLocal(f.fechaFin),
      numeroAutorizacion: f.numeroAutorizacion.trim() || null,
    };
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.agregarNovedad(this.documento.id, dto));
      this.novedades = res?.data ?? [];
      this.mostrarForm = false;
      this.alert.showSuccess('Novedad', 'Agregada. Reliquide al empleado en la pestaña Liquidación.');
      this.cambio.emit();
    } catch (err: any) {
      this.alert.showError('No se pudo agregar', err?.error?.message ?? 'Revise los datos.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  confirmarEliminar(n: NovedadDocumentoModel): void {
    this.confirm.confirm({
      message: `¿Quitar la novedad <b>${this.textoTipo(n.tipo)}</b> de ${n.empleadoNombre}?`,
      header: 'Quitar novedad',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(n),
    });
  }

  private async eliminar(n: NovedadDocumentoModel): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.eliminarNovedad(this.documento.id, n.id));
      this.novedades = res?.data ?? [];
      this.alert.showSuccess('Novedad', 'Quitada. Reliquide al empleado en la pestaña Liquidación.');
      this.cambio.emit();
    } catch (err: any) {
      this.alert.showError('No se pudo quitar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.cdr.markForCheck();
    }
  }
}
