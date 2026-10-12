import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import {
  AtributoCatalogoModel,
  CreateNominaCatalogoDto,
  NominaCatalogoModel,
  TipoCatalogoNominaModel,
} from '../../../../core/models/nomina-parametros.model';
import { NominaCatalogoService } from '../../../../core/services/nomina-catalogo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  OPCIONES_SI_NO,
  controlAtributo,
  decimalesAtributo,
} from './atributos-catalogo.util';

/**
 * Crear o editar un elemento de un catálogo de nómina. Los campos propios
 * (prioridad, límite, quién paga…) se arman con la definición que manda el back.
 */
@Component({
  selector: 'app-form-catalogo-nomina',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
  ],
  templateUrl: './form-catalogo-nomina.component.html',
  styleUrls: ['../parametros-form.scss'],
})
export class FormCatalogoNominaComponent implements OnChanges {
  @Input() visible = false;
  @Input() definicion: TipoCatalogoNominaModel | null = null;
  @Input() elemento: NominaCatalogoModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<NominaCatalogoModel>();

  readonly opcionesSiNo = OPCIONES_SI_NO;
  readonly opcionesEstado = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  form: FormGroup;
  atributos: FormGroup;
  guardando = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NominaCatalogoService,
    private readonly alert: AlertService,
  ) {
    this.atributos = this.fb.group({});
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(20)]],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      descripcion: ['', Validators.maxLength(500)],
      orden: [0],
      activo: [true],
      atributos: this.atributos,
    });
  }

  get esEdicion(): boolean {
    return !!this.elemento;
  }

  get camposPropios(): AtributoCatalogoModel[] {
    return this.definicion?.atributos ?? [];
  }

  ngOnChanges(): void {
    if (!this.visible) return;
    const e = this.elemento;
    this.form.reset({
      codigo: e?.codigo ?? '',
      nombre: e?.nombre ?? '',
      descripcion: e?.descripcion ?? '',
      orden: e?.orden ?? 0,
      activo: e?.activo ?? true,
    });
    // Los campos propios cambian con el catálogo: se rearman después del reset.
    this.armarAtributos(e);
  }

  /** Un control por cada campo propio del catálogo. */
  private armarAtributos(e: NominaCatalogoModel | null): void {
    Object.keys(this.atributos.controls).forEach((k) =>
      this.atributos.removeControl(k),
    );
    for (const a of this.camposPropios)
      this.atributos.addControl(
        a.nombre,
        controlAtributo(a, e?.atributos?.[a.nombre]),
      );
  }

  decimales(a: AtributoCatalogoModel): number {
    return decimalesAtributo(a);
  }

  opcionesDe(
    a: AtributoCatalogoModel,
  ): { label: string; value: string | null }[] {
    const base = a.opciones.map((o) => ({
      label: o,
      value: o as string | null,
    }));
    return a.obligatorio ? base : [{ label: 'Ninguna', value: null }, ...base];
  }

  async guardar(): Promise<void> {
    if (!this.definicion) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateNominaCatalogoDto = {
      codigo: v.codigo.trim(),
      nombre: v.nombre.trim(),
      descripcion: v.descripcion?.trim() || null,
      orden: v.orden ?? 0,
      activo: v.activo !== false,
      atributos: v.atributos ?? {},
    };

    this.guardando = true;
    try {
      const ruta = this.definicion.ruta;
      const res = await lastValueFrom(
        this.esEdicion
          ? this.service.actualizar(ruta, this.elemento!.id, dto)
          : this.service.crear(ruta, dto),
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
