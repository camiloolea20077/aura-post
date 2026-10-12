import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CreateFamiliarDto, Familiar, OPCIONES_PARENTESCO } from '../../../../core/models/empleado-hoja-vida.model';
import { SEXO_OPTS, TIPO_DOCUMENTO_OPTIONS } from '../../../../core/models/tercero.model';
import { EmpleadoHojaVidaService } from '../../../../core/services/empleado-hoja-vida.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';
import { edadEnAnios, etiquetasFamiliar } from './hoja-vida.util';

/**
 * Núcleo familiar del empleado: parentesco, datos básicos, si convive o depende
 * económicamente, beneficiario de caja o EPS y contacto de emergencia.
 */
@Component({
  selector: 'app-familiares-empleado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './familiares-empleado.component.html',
  styleUrls: ['../../tab-detalle.scss'],
})
export class FamiliaresEmpleadoComponent implements OnChanges {
  @Input({ required: true }) empleadoId!: number;

  readonly parentescos = OPCIONES_PARENTESCO;
  readonly tiposDocumento = TIPO_DOCUMENTO_OPTIONS;
  readonly generos = SEXO_OPTS;
  readonly opcionesSiNo = [
    { label: 'Sí', value: true },
    { label: 'No', value: false },
  ];
  readonly hoy = new Date();
  readonly edad = edadEnAnios;
  readonly etiquetas = etiquetasFamiliar;

  filas: Familiar[] = [];
  mostrarForm = false;
  editando: Familiar | null = null;
  guardando = false;
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: EmpleadoHojaVidaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {
    this.form = this.fb.group({
      parentesco: [null as string | null, Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(150)]],
      tipoDocumento: [null as string | null],
      numeroDocumento: ['', Validators.maxLength(30)],
      fechaNacimiento: [null as Date | null],
      genero: [null as string | null],
      telefono: ['', Validators.maxLength(30)],
      ocupacion: ['', Validators.maxLength(100)],
      convive: [false],
      dependeEconomicamente: [false],
      beneficiarioCaja: [false],
      beneficiarioSalud: [false],
      contactoEmergencia: [false],
    });
  }

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.familiares(this.empleadoId));
      this.filas = res.data ?? [];
    } catch {
      this.alert.showError('Familia', 'No se pudieron cargar los familiares.');
    }
  }

  textoParentesco(p: string): string {
    return this.parentescos.find((o) => o.value === p)?.label ?? p;
  }

  nuevo(): void {
    this.editando = null;
    this.form.reset({
      convive: false,
      dependeEconomicamente: false,
      beneficiarioCaja: false,
      beneficiarioSalud: false,
      contactoEmergencia: false,
    });
    this.mostrarForm = true;
  }

  editar(f: Familiar): void {
    this.editando = f;
    this.form.reset({ ...f, fechaNacimiento: aDate(f.fechaNacimiento) });
    this.mostrarForm = true;
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const texto = (s: string | null) => s?.trim() || null;
    const dto: CreateFamiliarDto = {
      parentesco: v.parentesco,
      nombre: v.nombre.trim(),
      tipoDocumento: v.tipoDocumento,
      numeroDocumento: texto(v.numeroDocumento),
      fechaNacimiento: aFechaLocal(v.fechaNacimiento),
      genero: v.genero,
      telefono: texto(v.telefono),
      ocupacion: texto(v.ocupacion),
      convive: !!v.convive,
      dependeEconomicamente: !!v.dependeEconomicamente,
      beneficiarioCaja: !!v.beneficiarioCaja,
      beneficiarioSalud: !!v.beneficiarioSalud,
      contactoEmergencia: !!v.contactoEmergencia,
    };
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.editando
          ? this.service.actualizarFamiliar(this.empleadoId, this.editando.id, dto)
          : this.service.crearFamiliar(this.empleadoId, dto),
      );
      this.filas = res.data ?? [];
      this.mostrarForm = false;
      this.alert.showSuccess('Familia', 'Familiar guardado.');
    } catch (err: any) {
      this.alert.showError('Familia', err?.error?.message ?? 'No se pudo guardar.');
    } finally {
      this.guardando = false;
    }
  }

  confirmarEliminar(f: Familiar): void {
    this.confirm.confirm({
      message: `¿Quitar a <b>${f.nombre}</b>?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(f),
    });
  }

  private async eliminar(f: Familiar): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.eliminarFamiliar(this.empleadoId, f.id));
      this.filas = res.data ?? [];
    } catch (err: any) {
      this.alert.showError('Familia', err?.error?.message ?? 'No se pudo quitar.');
    }
  }
}
