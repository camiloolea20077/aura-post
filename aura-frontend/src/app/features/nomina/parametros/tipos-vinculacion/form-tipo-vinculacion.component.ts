import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import {
  CONTRATOS_CON_FIN,
  CreateTipoVinculacionDto,
  OPCIONES_FRECUENCIA,
  OPCIONES_REMUNERACION,
  OPCIONES_TIPO_CONTRATO,
  TipoContrato,
  TipoVinculacionModel,
} from '../../../../core/models/nomina-parametros.model';
import { NominaTipoVinculacionService } from '../../../../core/services/nomina-tipo-vinculacion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

/**
 * Crear o editar un tipo de vinculación. Si el contrato por ley tiene fecha de
 * terminación (fijo, obra, aprendizaje), "exige fecha fin" queda en Sí y bloqueado.
 */
@Component({
  selector: 'app-form-tipo-vinculacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './form-tipo-vinculacion.component.html',
  styleUrls: ['../parametros-form.scss'],
})
export class FormTipoVinculacionComponent implements OnChanges {
  @Input() visible = false;
  @Input() tipo: TipoVinculacionModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<TipoVinculacionModel>();

  private readonly destroyRef = inject(DestroyRef);

  readonly opcionesContrato = OPCIONES_TIPO_CONTRATO;
  readonly opcionesRemuneracion = OPCIONES_REMUNERACION;
  readonly opcionesFrecuencia = OPCIONES_FRECUENCIA;
  readonly opcionesSiNo = [
    { label: 'Sí', value: true },
    { label: 'No', value: false },
  ];
  readonly opcionesEstado = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  form: FormGroup;
  guardando = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NominaTipoVinculacionService,
    private readonly alert: AlertService,
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      tipoContrato: [null as TipoContrato | null],
      tipoRemuneracion: ['MENSUAL', Validators.required],
      frecuenciaPago: ['MENSUAL', Validators.required],
      exigeFechaFin: [false],
      unicaPorEmpleado: [true],
      descripcion: ['', Validators.maxLength(500)],
      activo: [true],
    });
    this.form
      .get('tipoContrato')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((c: TipoContrato | null) => this.ajustarFechaFin(c));
  }

  get esEdicion(): boolean {
    return !!this.tipo;
  }

  ngOnChanges(): void {
    if (!this.visible) return;
    const t = this.tipo;
    this.form.reset({
      codigo: t?.codigo ?? '',
      nombre: t?.nombre ?? '',
      tipoContrato: t?.tipoContrato ?? null,
      tipoRemuneracion: t?.tipoRemuneracion ?? 'MENSUAL',
      frecuenciaPago: t?.frecuenciaPago ?? 'MENSUAL',
      exigeFechaFin: t?.exigeFechaFin ?? false,
      unicaPorEmpleado: t?.unicaPorEmpleado ?? true,
      descripcion: t?.descripcion ?? '',
      activo: t?.activo ?? true,
    });
  }

  /** Los contratos con fin legal siempre exigen la fecha: el campo se fija en Sí. */
  private ajustarFechaFin(contrato: TipoContrato | null): void {
    const ctrl = this.form.get('exigeFechaFin')!;
    if (contrato && CONTRATOS_CON_FIN.includes(contrato)) {
      ctrl.setValue(true, { emitEvent: false });
      ctrl.disable({ emitEvent: false });
    } else {
      ctrl.enable({ emitEvent: false });
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // getRawValue: exigeFechaFin puede estar deshabilitado y frm.value lo omitiría.
    const v = this.form.getRawValue();
    const dto: CreateTipoVinculacionDto = {
      codigo: v.codigo.trim(),
      nombre: v.nombre.trim(),
      tipoContrato: v.tipoContrato,
      tipoRemuneracion: v.tipoRemuneracion,
      frecuenciaPago: v.frecuenciaPago,
      exigeFechaFin: !!v.exigeFechaFin,
      unicaPorEmpleado: v.unicaPorEmpleado !== false,
      descripcion: v.descripcion?.trim() || null,
      activo: v.activo !== false,
    };

    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.esEdicion
          ? this.service.actualizar(this.tipo!.id, dto)
          : this.service.crear(dto),
      );
      this.alert.showSuccess(
        this.esEdicion ? 'Actualizado' : 'Creado',
        `${dto.nombre} guardado`,
      );
      this.guardado.emit(res.data);
      this.cerrar();
    } catch (err: any) {
      this.alert.showError(
        'No se pudo guardar',
        err?.error?.message ?? 'Revise los datos.',
      );
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }
}
