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

import { ContratoService } from '../../../../core/services/contrato.service';
import {
  CreateContratoDto,
  TIPO_CONTRATO_OPTS,
  TipoContratoLaboral,
} from '../../../../core/models/contrato.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';

@Component({
  selector: 'app-form-contrato',
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
  templateUrl: './form-contrato.component.html',
})
export class FormContratoComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() empleadoId!: number;
  /** Si viene, el form está en modo edición (corrección) de ese contrato. */
  @Input() contratoId: number | null = null;
  @Output() guardado = new EventEmitter<void>();

  get esEdicion(): boolean {
    return this.contratoId != null;
  }

  readonly tipoContratoOpts = TIPO_CONTRATO_OPTS;
  readonly procedimientoOpts = [
    { label: 'Procedimiento 1 (mensual)', value: '1' },
    { label: 'Procedimiento 2 (% fijo semestral)', value: '2' },
  ];
  readonly nivelArlOpts = [
    { label: 'I (0.522%)', value: 1 },
    { label: 'II (1.044%)', value: 2 },
    { label: 'III (2.436%)', value: 3 },
    { label: 'IV (4.350%)', value: 4 },
    { label: 'V (6.960%)', value: 5 },
  ];

  saving = false;

  form: {
    tipoContrato: TipoContratoLaboral;
    cargo: string | null;
    fechaInicio: Date | null;
    fechaFin: Date | null;
    salarioBase: number | null;
    esSalarioIntegral: boolean;
    esPrincipal: boolean;
    procedimientoRetefuente: '1' | '2';
    nivelRiesgoArl: number | null;
    observacion: string | null;
  } = this.vacio();

  private vacio() {
    return {
      tipoContrato: 'INDEFINIDO' as TipoContratoLaboral,
      cargo: null,
      fechaInicio: null,
      fechaFin: null,
      salarioBase: null,
      esSalarioIntegral: false,
      esPrincipal: true,
      procedimientoRetefuente: '1' as '1' | '2',
      nivelRiesgoArl: 1 as number | null,
      observacion: null,
    };
  }

  /**
   * Solo el término fijo lleva fecha de vencimiento.
   *
   * El backend valida lo mismo y rechaza un INDEFINIDO con fecha fin, así que
   * ocultar el campo evita un 400 que el usuario no entendería.
   */
  get esFijo(): boolean {
    return this.form.tipoContrato === 'FIJO';
  }

  onTipoContratoChange(): void {
    if (!this.esFijo) this.form.fechaFin = null;
  }

  /** Al abrirse: en modo edición carga los datos del contrato. */
  async onShow(): Promise<void> {
    if (!this.esEdicion || !this.contratoId) {
      this.form = this.vacio();
      return;
    }
    try {
      const res = await lastValueFrom(this.service.obtener(this.contratoId));
      const c = res?.data?.contrato;
      if (c) {
        this.form = {
          tipoContrato: c.tipoContrato,
          cargo: c.cargo,
          fechaInicio: aDate(c.fechaInicio),
          fechaFin: aDate(c.fechaFin),
          salarioBase: c.salarioBase,
          esSalarioIntegral: !!c.esSalarioIntegral,
          esPrincipal: !!c.esPrincipal,
          procedimientoRetefuente: (c.procedimientoRetefuente ?? '1') as
            | '1'
            | '2',
          nivelRiesgoArl: c.nivelRiesgoArl ?? 1,
          observacion: c.observacion ?? null,
        };
      }
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el contrato.');
    }
  }

  onHide(): void {
    this.form = this.vacio();
    this.visibleChange.emit(false);
  }

  async guardar(): Promise<void> {
    if (!this.form.fechaInicio) {
      this.alert.showWarn('Datos incompletos', 'Indica la fecha de inicio.');
      return;
    }
    if (!this.form.salarioBase || this.form.salarioBase <= 0) {
      this.alert.showWarn(
        'Datos incompletos',
        'Indica un salario mayor a cero.',
      );
      return;
    }
    if (this.esFijo && !this.form.fechaFin) {
      this.alert.showWarn(
        'Datos incompletos',
        'Un contrato a término fijo exige fecha de vencimiento.',
      );
      return;
    }

    const dto: CreateContratoDto = {
      empleadoId: this.empleadoId,
      tipoContrato: this.form.tipoContrato,
      cargo: this.form.cargo?.trim() || null,
      fechaInicio: aFechaLocal(this.form.fechaInicio)!,
      fechaFin: this.esFijo ? aFechaLocal(this.form.fechaFin) : null,
      salarioBase: this.form.salarioBase,
      esSalarioIntegral: this.form.esSalarioIntegral,
      esPrincipal: this.form.esPrincipal,
      procedimientoRetefuente: this.form.procedimientoRetefuente,
      nivelRiesgoArl: this.form.nivelRiesgoArl,
      observacion: this.form.observacion?.trim() || null,
    };

    this.saving = true;
    try {
      if (this.esEdicion) {
        await lastValueFrom(this.service.editar(this.contratoId!, dto));
        this.alert.showSuccess('Contrato actualizado', '');
      } else {
        await lastValueFrom(this.service.crear(dto));
        this.alert.showSuccess('Contrato creado', '');
      }
      this.guardado.emit();
      this.onHide();
    } catch (err: any) {
      // 409 si ya hay otro contrato principal: es información accionable.
      const msg =
        err?.error?.message ??
        (this.esEdicion
          ? 'No se pudo actualizar el contrato.'
          : 'No se pudo crear el contrato.');
      this.alert.showError('Error', msg);
    } finally {
      this.saving = false;
    }
  }

  constructor(
    private readonly service: ContratoService,
    private readonly alert: AlertService,
  ) {}
}
