import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CalendarModule } from 'primeng/calendar';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import { ConceptoService } from '../../../../core/services/concepto.service';
import {
  BASE_CONCEPTO_OPTS,
  BaseConcepto,
  ConceptoModel,
  NuevaVigenciaDto,
  SI_NO_OPTS,
} from '../../../../core/models/concepto.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal, aDate } from '../../../../shared/utils/fecha.util';

/**
 * Nueva vigencia de un concepto propio.
 *
 * **Cambiar una tarifa no edita el concepto: crea una versión nueva.** La versión
 * actual se cierra el día antes de la nueva fecha, así un período viejo se
 * reliquida con la tarifa que regía entonces. Número, nombre y clase no cambian.
 */
@Component({
  selector: 'app-form-concepto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    SelectModule,
    CalendarModule, TextareaModule,
  ],
  templateUrl: './form-concepto.component.html',
})
export class FormConceptoComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** Versión vigente de la que se parte. */
  @Input() concepto: ConceptoModel | null = null;

  @Output() guardado = new EventEmitter<void>();

  readonly baseOpts = BASE_CONCEPTO_OPTS;
  readonly siNoOpts = SI_NO_OPTS;

  saving = false;

  form: {
    base: BaseConcepto;
    constituyeIbc: boolean;
    porcentaje: number | null;
    valorFijo: number | null;
    formula: string | null;
    vigenteDesde: Date | null;
  } = this.vacio();

  constructor(
    private readonly service: ConceptoService,
    private readonly alert: AlertService,
  ) {}

  private vacio() {
    return {
      base: 'SALARIO' as BaseConcepto,
      constituyeIbc: true,
      porcentaje: null,
      valorFijo: null,
      formula: null,
      vigenteDesde: null,
    };
  }

  get titulo(): string {
    return this.concepto
      ? `Nueva vigencia de ${this.concepto.numero} - ${this.concepto.nombre}`
      : 'Nueva vigencia';
  }

  /** La nueva vigencia debe empezar después de la actual. */
  /**
   * La nueva vigencia debe empezar después de la actual. Se calcula una vez al
   * abrir: un getter que crea un Date nuevo en cada ciclo deja al p-calendar
   * recalculando sin fin y congela la página.
   */
  fechaMinima: Date | null = null;

  get esFormula(): boolean {
    return this.form.base === 'FORMULA';
  }

  get esFijo(): boolean {
    return this.form.base === 'FIJO';
  }

  /** FIJO lleva valor; MANUAL y NOVEDAD no llevan ni porcentaje ni valor. */
  get esPorcentual(): boolean {
    return !['FIJO', 'MANUAL', 'NOVEDAD', 'FORMULA'].includes(this.form.base);
  }

  onShow(): void {
    const c = this.concepto;
    if (!c) return;
    const desde = aDate(c.vigenteDesde);
    if (desde) desde.setDate(desde.getDate() + 1);
    this.fechaMinima = desde;
    this.form = {
      base: c.base,
      constituyeIbc: c.constituyeIbc,
      porcentaje: c.porcentaje,
      valorFijo: c.valorFijo,
      formula: c.formula,
      vigenteDesde: null,
    };
  }

  onBaseChange(): void {
    if (!this.esPorcentual) this.form.porcentaje = null;
    if (!this.esFijo) this.form.valorFijo = null;
  }

  onHide(): void {
    this.form = this.vacio();
    this.visibleChange.emit(false);
  }

  async guardar(): Promise<void> {
    if (!this.concepto) return;
    if (!this.form.vigenteDesde) {
      this.alert.showWarn(
        'Datos incompletos',
        'Indica desde cuándo rige la tarifa nueva.',
      );
      return;
    }
    if (
      this.esFijo &&
      (this.form.valorFijo == null || this.form.valorFijo <= 0)
    ) {
      this.alert.showWarn(
        'Datos incompletos',
        'Un concepto de valor fijo exige un valor.',
      );
      return;
    }
    if (this.esPorcentual && this.form.porcentaje == null) {
      this.alert.showWarn(
        'Datos incompletos',
        'Este concepto exige un porcentaje.',
      );
      return;
    }

    if (this.esFormula && !this.form.formula?.trim()) {
      this.alert.showWarn('Datos incompletos', 'Escriba la fórmula.');
      return;
    }

    const dto: NuevaVigenciaDto = {
      base: this.form.base,
      constituyeIbc: this.form.constituyeIbc,
      porcentaje: this.esPorcentual ? this.form.porcentaje : null,
      valorFijo: this.esFijo ? this.form.valorFijo : null,
      formula: this.esFormula ? this.form.formula : null,
      vigenteDesde: aFechaLocal(this.form.vigenteDesde)!,
    };

    this.saving = true;
    try {
      await lastValueFrom(this.service.nuevaVigencia(this.concepto.id, dto));
      this.alert.showSuccess(
        'Nueva vigencia creada',
        'La tarifa anterior quedó cerrada el día antes.',
      );
      this.guardado.emit();
      this.onHide();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo crear la vigencia.',
      );
    } finally {
      this.saving = false;
    }
  }
}
