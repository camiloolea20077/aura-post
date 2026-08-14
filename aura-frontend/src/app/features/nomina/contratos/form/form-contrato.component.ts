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
import { NominaService } from '../../../../core/services/nomina.service';
import { NominaConfigModel } from '../../../../core/models/nomina.model';
import {
  CreateContratoDto,
  FASE_APRENDIZ_OPTS,
  FaseAprendiz,
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
  readonly faseAprendizOpts = FASE_APRENDIZ_OPTS;
  /** Cargos ya usados en la empresa: el dropdown es editable, se puede agregar nuevos. */
  cargoOpts: string[] = [];
  /** Config de nómina (SMMLV y % del aprendiz) para auto-calcular el apoyo. */
  private config: NominaConfigModel | null = null;
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
    fase: FaseAprendiz | null;
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
      fase: null as FaseAprendiz | null,
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

  /** El aprendiz SENA lleva fase (lectiva/práctica), que define apoyo y ARL. */
  get esAprendiz(): boolean {
    return this.form.tipoContrato === 'APRENDIZAJE';
  }

  onTipoContratoChange(): void {
    if (!this.esFijo) this.form.fechaFin = null;
    if (!this.esAprendiz) {
      this.form.fase = null;
    } else {
      if (!this.form.fase) this.form.fase = 'LECTIVA';
      this.aplicarApoyoAprendiz();
    }
  }

  /** Al abrirse: carga el catálogo de cargos y, en edición, los datos del contrato. */
  async onShow(): Promise<void> {
    this.cargarCargos();
    this.cargarConfig();
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
          fase: c.fase ?? null,
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

  private async cargarCargos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.cargos());
      this.cargoOpts = res?.data ?? [];
    } catch {
      this.cargoOpts = [];
    }
  }

  private async cargarConfig(): Promise<void> {
    try {
      const res = await lastValueFrom(this.nominaService.getConfig());
      this.config = res?.data ?? null;
    } catch {
      this.config = null;
    }
  }

  /** Al cambiar la fase del aprendiz, recalcula el apoyo sugerido. */
  onFaseChange(): void {
    this.aplicarApoyoAprendiz();
  }

  /**
   * Sugiere el salario del aprendiz según la fase: SMMLV × % (lectiva 50 / práctica
   * 75, parametrizable en config). Así nadie tiene que sacar la cuenta. Solo en alta
   * (en edición el salario se cambia por "Salario e historial") y el usuario puede
   * ajustarlo manualmente después.
   */
  private aplicarApoyoAprendiz(): void {
    if (this.esEdicion || !this.esAprendiz || !this.config || !this.form.fase) return;
    const pct =
      this.form.fase === 'PRACTICA'
        ? this.config.aprendizPctPractica
        : this.config.aprendizPctLectiva;
    if (pct == null || !this.config.smmlv) return;
    this.form.salarioBase = Math.round((this.config.smmlv * pct) / 100);
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
    if (this.esAprendiz && !this.form.fase) {
      this.alert.showWarn(
        'Datos incompletos',
        'Indica la fase del aprendiz (lectiva o práctica).',
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
      fase: this.esAprendiz ? this.form.fase : null,
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
    private readonly nominaService: NominaService,
    private readonly alert: AlertService,
  ) {}
}
