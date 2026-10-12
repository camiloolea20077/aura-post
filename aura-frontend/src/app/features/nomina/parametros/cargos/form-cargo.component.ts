import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import { CreateNominaCargoDto, NominaCargoModel } from '../../../../core/models/nomina-parametros.model';
import { NominaCargoService } from '../../../../core/services/nomina-cargo.service';
import { NominaCatalogoService } from '../../../../core/services/nomina-catalogo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { rangoSalarialValidator } from './rango-salarial.validator';

interface Opcion {
  label: string;
  value: number;
}

/** Crear o editar un cargo: nivel, tipo, plazas, rango salarial, misión y funciones. */
@Component({
  selector: 'app-form-cargo',
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
  templateUrl: './form-cargo.component.html',
  styleUrls: ['../parametros-form.scss'],
})
export class FormCargoComponent implements OnChanges {
  @Input() visible = false;
  @Input() cargo: NominaCargoModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<NominaCargoModel>();

  readonly opcionesEstado = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  niveles: Opcion[] = [];
  tipos: Opcion[] = [];
  form: FormGroup;
  guardando = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NominaCargoService,
    private readonly catalogos: NominaCatalogoService,
    private readonly alert: AlertService,
  ) {
    this.form = this.fb.group(
      {
        codigo: ['', [Validators.required, Validators.maxLength(20)]],
        nombre: ['', [Validators.required, Validators.maxLength(150)]],
        nivelId: [null as number | null],
        tipoCargoId: [null as number | null],
        plazas: [null as number | null, Validators.min(0)],
        salarioMinimo: [null as number | null, Validators.min(0)],
        salarioReferencia: [null as number | null, Validators.min(0)],
        salarioMaximo: [null as number | null, Validators.min(0)],
        mision: [''],
        funciones: [''],
        activo: [true],
      },
      { validators: rangoSalarialValidator },
    );
  }

  get esEdicion(): boolean {
    return !!this.cargo;
  }

  /** Mensaje del rango salarial, solo cuando el usuario ya tocó algún salario. */
  get errorRango(): string | null {
    const tocado = ['salarioMinimo', 'salarioReferencia', 'salarioMaximo'].some((c) => this.form.get(c)?.touched);
    return tocado ? (this.form.errors?.['rangoSalarial'] ?? null) : null;
  }

  ngOnChanges(): void {
    if (!this.visible) return;
    const c = this.cargo;
    this.form.reset({
      codigo: c?.codigo ?? '',
      nombre: c?.nombre ?? '',
      nivelId: c?.nivelId ?? null,
      tipoCargoId: c?.tipoCargoId ?? null,
      plazas: c?.plazas ?? null,
      salarioMinimo: c?.salarioMinimo ?? null,
      salarioReferencia: c?.salarioReferencia ?? null,
      salarioMaximo: c?.salarioMaximo ?? null,
      mision: c?.mision ?? '',
      funciones: c?.funciones ?? '',
      activo: c?.activo ?? true,
    });
    void this.cargarCatalogos();
  }

  /** Niveles y tipos de cargo activos (cada uno es un catálogo aparte). */
  private async cargarCatalogos(): Promise<void> {
    try {
      const [niveles, tipos] = await Promise.all([
        lastValueFrom(this.catalogos.activos('niveles-cargo')),
        lastValueFrom(this.catalogos.activos('tipos-cargo')),
      ]);
      this.niveles = (niveles.data ?? []).map((n) => ({ label: n.nombre, value: n.id }));
      this.tipos = (tipos.data ?? []).map((t) => ({ label: t.nombre, value: t.id }));
    } catch {
      // Sin catálogos el cargo igual se puede guardar (nivel y tipo son opcionales).
    }
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateNominaCargoDto = {
      codigo: v.codigo.trim(),
      nombre: v.nombre.trim(),
      nivelId: v.nivelId,
      tipoCargoId: v.tipoCargoId,
      plazas: v.plazas,
      salarioMinimo: v.salarioMinimo,
      salarioReferencia: v.salarioReferencia,
      salarioMaximo: v.salarioMaximo,
      mision: v.mision?.trim() || null,
      funciones: v.funciones?.trim() || null,
      activo: v.activo !== false,
    };

    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.esEdicion ? this.service.actualizar(this.cargo!.id, dto) : this.service.crear(dto),
      );
      this.alert.showSuccess(this.esEdicion ? 'Actualizado' : 'Creado', `Cargo ${dto.nombre} guardado`);
      this.guardado.emit(res.data);
      this.cerrar();
    } catch (err: any) {
      this.alert.showError('No se pudo guardar', err?.error?.message ?? 'Revise los datos del cargo.');
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
