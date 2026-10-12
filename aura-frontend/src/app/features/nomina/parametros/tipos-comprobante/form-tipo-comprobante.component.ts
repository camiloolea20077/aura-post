import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
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
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import {
  ClaseComprobanteNomina,
  CreateTipoComprobanteDto,
  OPCIONES_CLASE_COMPROBANTE,
  OPCIONES_FRECUENCIA,
  TipoComprobanteModel,
  TipoVinculacionModel,
} from '../../../../core/models/nomina-parametros.model';
import { NominaTipoComprobanteService } from '../../../../core/services/nomina-tipo-comprobante.service';
import { NominaTipoVinculacionService } from '../../../../core/services/nomina-tipo-vinculacion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

/**
 * Crear o editar un tipo de comprobante de nómina. La frecuencia solo aplica
 * (y es obligatoria) en la nómina periódica; en las demás clases se oculta.
 */
@Component({
  selector: 'app-form-tipo-comprobante',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './form-tipo-comprobante.component.html',
  styleUrls: ['../parametros-form.scss'],
})
export class FormTipoComprobanteComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() tipo: TipoComprobanteModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<TipoComprobanteModel>();

  private readonly destroyRef = inject(DestroyRef);

  readonly opcionesClase = OPCIONES_CLASE_COMPROBANTE;
  readonly opcionesFrecuencia = OPCIONES_FRECUENCIA;
  readonly opcionesEstado = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];
  tiposVinculacion: TipoVinculacionModel[] = [];

  form: FormGroup;
  guardando = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NominaTipoComprobanteService,
    private readonly tiposVinculacionService: NominaTipoVinculacionService,
    private readonly alert: AlertService,
  ) {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      clase: ['PERIODICO' as ClaseComprobanteNomina, Validators.required],
      prefijo: [
        '',
        [Validators.required, Validators.pattern(/^[A-Za-z0-9]{1,10}$/)],
      ],
      frecuencia: ['MENSUAL'],
      tiposVinculacionIds: [[] as number[]],
      descripcion: ['', Validators.maxLength(500)],
      activo: [true],
    });
    this.form
      .get('clase')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((c: ClaseComprobanteNomina) => this.ajustarFrecuencia(c));
  }

  ngOnInit(): void {
    void this.cargarTiposVinculacion();
  }

  get esEdicion(): boolean {
    return !!this.tipo;
  }

  get esPeriodico(): boolean {
    return this.form.get('clase')!.value === 'PERIODICO';
  }

  ngOnChanges(): void {
    if (!this.visible) return;
    const t = this.tipo;
    this.form.reset({
      codigo: t?.codigo ?? '',
      nombre: t?.nombre ?? '',
      clase: t?.clase ?? 'PERIODICO',
      prefijo: t?.prefijo ?? '',
      frecuencia: t?.frecuencia ?? 'MENSUAL',
      tiposVinculacionIds: t?.tiposVinculacionIds ?? [],
      descripcion: t?.descripcion ?? '',
      activo: t?.activo ?? true,
    });
    this.ajustarFrecuencia(this.form.get('clase')!.value);
  }

  private async cargarTiposVinculacion(): Promise<void> {
    try {
      const res = await lastValueFrom(this.tiposVinculacionService.activos());
      this.tiposVinculacion = res?.data ?? [];
    } catch {
      this.tiposVinculacion = [];
    }
  }

  /** La frecuencia es obligatoria en la nómina periódica y no aplica en las demás. */
  private ajustarFrecuencia(clase: ClaseComprobanteNomina): void {
    const ctrl = this.form.get('frecuencia')!;
    if (clase === 'PERIODICO') {
      ctrl.setValidators(Validators.required);
      if (!ctrl.value) ctrl.setValue('MENSUAL', { emitEvent: false });
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateTipoComprobanteDto = {
      codigo: v.codigo.trim(),
      nombre: v.nombre.trim(),
      clase: v.clase,
      prefijo: v.prefijo.trim().toUpperCase(),
      frecuencia: v.clase === 'PERIODICO' ? v.frecuencia : null,
      descripcion: v.descripcion?.trim() || null,
      tiposVinculacionIds: v.tiposVinculacionIds ?? [],
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
