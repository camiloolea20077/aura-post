import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CreateVinculacionConceptoDto, VinculacionConcepto } from '../../../../core/models/vinculacion.model';
import { ConceptoService } from '../../../../core/services/concepto.service';
import { VinculacionService } from '../../../../core/services/vinculacion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';
import { OpcionConcepto, opcionesConcepto, severidadClase } from './conceptos.util';

/**
 * Conceptos propios de la vinculación: lo que se le paga o descuenta de forma
 * fija (bonificación, auxilio de rodamiento, descuento pactado…) con vigencia.
 */
@Component({
  selector: 'app-conceptos-vinculacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './conceptos-vinculacion.component.html',
  styleUrls: ['../../tab-detalle.scss'],
})
export class ConceptosVinculacionComponent implements OnChanges {
  @Input({ required: true }) vinculacionId!: number;
  /** Inicio de la vinculación: fecha por defecto y mínima de un concepto. */
  @Input() fechaInicio: string | null = null;
  @Input() soloLectura = false;

  filas: VinculacionConcepto[] = [];
  opciones: OpcionConcepto[] = [];
  mostrarForm = false;
  editando: VinculacionConcepto | null = null;
  guardando = false;
  form: FormGroup;

  readonly severidadClase = severidadClase;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: VinculacionService,
    private readonly conceptos: ConceptoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {
    this.form = this.fb.group({
      conceptoCodigo: [null as string | null, Validators.required],
      cantidad: [null as number | null],
      valor: [null as number | null],
      porcentaje: [null as number | null],
      fechaDesde: [null as Date | null, Validators.required],
      fechaHasta: [null as Date | null],
      observacion: ['', Validators.maxLength(300)],
    });
  }

  get minimo(): Date | null {
    return aDate(this.fechaInicio);
  }

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const [lista, catalogo] = await Promise.all([
        lastValueFrom(this.service.conceptos(this.vinculacionId)),
        lastValueFrom(this.conceptos.vigentes()),
      ]);
      this.filas = lista.data ?? [];
      this.opciones = opcionesConcepto(catalogo.data ?? []);
    } catch {
      this.alert.showError('Conceptos', 'No se pudieron cargar.');
    }
  }

  nuevo(): void {
    this.editando = null;
    this.form.reset({ fechaDesde: this.minimo, observacion: '' });
    this.mostrarForm = true;
  }

  editar(c: VinculacionConcepto): void {
    this.editando = c;
    this.form.reset({
      ...c,
      fechaDesde: aDate(c.fechaDesde),
      fechaHasta: aDate(c.fechaHasta),
      observacion: c.observacion ?? '',
    });
    this.mostrarForm = true;
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.valor == null && v.porcentaje == null && v.cantidad == null) {
      this.alert.showWarn('Conceptos', 'Indique el valor, el porcentaje o la cantidad.');
      return;
    }
    const dto: CreateVinculacionConceptoDto = {
      conceptoCodigo: v.conceptoCodigo,
      cantidad: v.cantidad,
      valor: v.valor,
      porcentaje: v.porcentaje,
      fechaDesde: aFechaLocal(v.fechaDesde)!,
      fechaHasta: aFechaLocal(v.fechaHasta),
      observacion: v.observacion?.trim() || null,
    };
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.editando
          ? this.service.actualizarConcepto(this.vinculacionId, this.editando.id, dto)
          : this.service.crearConcepto(this.vinculacionId, dto),
      );
      this.filas = res.data ?? [];
      this.mostrarForm = false;
      this.alert.showSuccess('Conceptos', 'Concepto guardado.');
    } catch (err: any) {
      this.alert.showError('Conceptos', err?.error?.message ?? 'No se pudo guardar.');
    } finally {
      this.guardando = false;
    }
  }

  confirmarEliminar(c: VinculacionConcepto): void {
    this.confirm.confirm({
      message: `¿Quitar <b>${c.conceptoNombre ?? c.conceptoCodigo}</b> de la vinculación?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(c),
    });
  }

  private async eliminar(c: VinculacionConcepto): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.eliminarConcepto(this.vinculacionId, c.id));
      this.filas = res.data ?? [];
    } catch (err: any) {
      this.alert.showError('Conceptos', err?.error?.message ?? 'No se pudo quitar.');
    }
  }
}
