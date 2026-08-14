import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { lastValueFrom } from 'rxjs';

import { ConceptoService } from '../../../../core/services/concepto.service';
import {
  BASE_CONCEPTO_OPTS,
  BaseConcepto,
  CLASE_CONCEPTO_OPTS,
  ClaseConcepto,
  ConceptoModel,
  CreateConceptoDto,
} from '../../../../core/models/concepto.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';

/**
 * Alta de un concepto de nómina, o de una nueva vigencia de uno existente.
 *
 * **Cambiar una tarifa no edita el concepto: crea una versión nueva.** Cuando se
 * abre desde una fila (`base` presente), se precargan código, nombre y clase, y
 * el usuario solo indica desde cuándo rige la tarifa nueva. El backend rechaza
 * (409) si la vigencia se solapa con otra versión del mismo código.
 */
@Component({
  selector: 'app-form-concepto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    ToggleSwitchModule,
  ],
  templateUrl: './form-concepto.component.html',
})
export class FormConceptoComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /**
   * Concepto del que se crea una nueva vigencia. Si viene, el formulario entra
   * en modo "nueva versión": código/nombre/clase quedan fijos y solo se pide la
   * tarifa nueva y desde cuándo rige.
   */
  @Input() base: ConceptoModel | null = null;

  @Output() guardado = new EventEmitter<void>();

  readonly claseOpts = CLASE_CONCEPTO_OPTS;
  readonly baseOpts = BASE_CONCEPTO_OPTS;

  saving = false;

  form: {
    codigo: string;
    nombre: string;
    clase: ClaseConcepto;
    base: BaseConcepto;
    constituyeIbc: boolean;
    porcentaje: number | null;
    valorFijo: number | null;
    vigenteDesde: Date | null;
    vigenteHasta: Date | null;
    codigoDian: string | null;
    orden: number | null;
  } = this.vacio();

  private vacio() {
    return {
      codigo: '',
      nombre: '',
      clase: 'DEVENGADO' as ClaseConcepto,
      base: 'SALARIO' as BaseConcepto,
      constituyeIbc: true,
      porcentaje: null,
      valorFijo: null,
      vigenteDesde: null,
      vigenteHasta: null,
      codigoDian: null,
      orden: 100,
    };
  }

  /** Modo "nueva vigencia": el código ya existe y no se puede cambiar. */
  get esNuevaVersion(): boolean {
    return this.base !== null;
  }

  get titulo(): string {
    return this.esNuevaVersion
      ? `Nueva vigencia de ${this.base!.codigo}`
      : 'Nuevo concepto';
  }

  /** FIJO exige valor; MANUAL no lleva ni porcentaje ni valor. */
  get esFijo(): boolean {
    return this.form.base === 'FIJO';
  }

  get esManual(): boolean {
    return this.form.base === 'MANUAL';
  }

  /** Los porcentuales exigen porcentaje; FIJO y MANUAL no. */
  get esPorcentual(): boolean {
    return !this.esFijo && !this.esManual;
  }

  onShow(): void {
    // p-dialog dispara onShow al hacerse visible; aquí se precarga el estado.
    if (this.esNuevaVersion) {
      const b = this.base!;
      this.form = {
        codigo: b.codigo,
        nombre: b.nombre,
        clase: b.clase,
        base: b.base,
        constituyeIbc: b.constituyeIbc,
        // La tarifa se re-digita a propósito: la nueva vigencia suele cambiarla.
        porcentaje: b.porcentaje,
        valorFijo: b.valorFijo,
        vigenteDesde: null,
        vigenteHasta: null,
        codigoDian: b.codigoDian,
        orden: b.orden,
      };
    } else {
      this.form = this.vacio();
    }
  }

  onBaseChange(): void {
    if (this.esFijo) this.form.porcentaje = null;
    if (this.esManual) {
      this.form.porcentaje = null;
      this.form.valorFijo = null;
    }
    if (!this.esFijo) this.form.valorFijo = null;
  }

  onHide(): void {
    this.form = this.vacio();
    this.visibleChange.emit(false);
  }

  async guardar(): Promise<void> {
    if (!this.form.codigo.trim() || !this.form.nombre.trim()) {
      this.alert.showWarn('Datos incompletos', 'Indica código y nombre.');
      return;
    }
    if (!this.form.vigenteDesde) {
      this.alert.showWarn('Datos incompletos', 'Indica desde cuándo rige.');
      return;
    }
    if (
      this.form.vigenteHasta &&
      this.form.vigenteHasta < this.form.vigenteDesde
    ) {
      this.alert.showWarn(
        'Fechas inválidas',
        'La vigencia final no puede ser anterior a la inicial.',
      );
      return;
    }
    if (this.esFijo && (this.form.valorFijo == null || this.form.valorFijo <= 0)) {
      this.alert.showWarn('Datos incompletos', 'Un concepto de valor fijo exige un valor.');
      return;
    }
    if (this.esPorcentual && this.form.porcentaje == null) {
      this.alert.showWarn('Datos incompletos', 'Este concepto exige un porcentaje.');
      return;
    }

    const dto: CreateConceptoDto = {
      codigo: this.form.codigo.trim(),
      nombre: this.form.nombre.trim(),
      clase: this.form.clase,
      constituyeIbc: this.form.constituyeIbc,
      base: this.form.base,
      porcentaje: this.esPorcentual ? this.form.porcentaje : null,
      valorFijo: this.esFijo ? this.form.valorFijo : null,
      vigenteDesde: aFechaLocal(this.form.vigenteDesde)!,
      vigenteHasta: aFechaLocal(this.form.vigenteHasta),
      codigoDian: this.form.codigoDian?.trim() || null,
      orden: this.form.orden ?? 100,
    };

    this.saving = true;
    try {
      await lastValueFrom(this.service.crear(dto));
      this.alert.showSuccess('Concepto guardado', '');
      this.guardado.emit();
      this.onHide();
    } catch (err: any) {
      // 409 = la vigencia se solapa con otra versión del mismo código. El
      // mensaje del backend dice qué vigencia cerrar; se muestra tal cual.
      const msg = err?.error?.message ?? 'No se pudo guardar el concepto.';
      this.alert.showError('Error', msg);
    } finally {
      this.saving = false;
    }
  }

  constructor(
    private readonly service: ConceptoService,
    private readonly alert: AlertService,
  ) {}
}
