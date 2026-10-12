import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  CreateCuentaBancariaDto,
  CuentaBancaria,
  OPCIONES_TIPO_CUENTA,
} from '../../../../core/models/empleado-hoja-vida.model';
import { EmpleadoHojaVidaService } from '../../../../core/services/empleado-hoja-vida.service';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { AlertService } from '../../../../shared/pipes/alert.service';

/**
 * Cuentas bancarias del empleado. La principal es donde se le paga la nómina:
 * se copia al tercero, que es de donde leen el pago y la nómina electrónica.
 */
@Component({
  selector: 'app-cuentas-bancarias-empleado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    TerceroAutocompleteComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './cuentas-bancarias-empleado.component.html',
  styleUrls: ['../../tab-detalle.scss'],
})
export class CuentasBancariasEmpleadoComponent implements OnChanges {
  @Input({ required: true }) empleadoId!: number;

  readonly tiposCuenta = OPCIONES_TIPO_CUENTA;
  readonly opcionesSiNo = [
    { label: 'Sí', value: true },
    { label: 'No', value: false },
  ];

  filas: CuentaBancaria[] = [];
  mostrarForm = false;
  editando: CuentaBancaria | null = null;
  bancoLabel: string | null = null;
  guardando = false;
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: EmpleadoHojaVidaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {
    this.form = this.fb.group({
      bancoTerceroId: [null as number | null, Validators.required],
      tipoCuenta: ['AHORROS', Validators.required],
      numeroCuenta: ['', [Validators.required, Validators.maxLength(50)]],
      principal: [false],
      activa: [true],
    });
  }

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.cuentas(this.empleadoId));
      this.filas = res.data ?? [];
    } catch {
      this.alert.showError('Cuentas bancarias', 'No se pudieron cargar.');
    }
  }

  textoTipo(t: string): string {
    return this.tiposCuenta.find((o) => o.value === t)?.label ?? t;
  }

  nueva(): void {
    this.editando = null;
    this.bancoLabel = null;
    // La primera cuenta queda como principal.
    this.form.reset({ tipoCuenta: 'AHORROS', numeroCuenta: '', principal: !this.filas.length, activa: true });
    this.mostrarForm = true;
  }

  editar(c: CuentaBancaria): void {
    this.editando = c;
    this.bancoLabel = c.bancoNombre;
    this.form.reset({ ...c });
    this.mostrarForm = true;
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateCuentaBancariaDto = {
      bancoTerceroId: v.bancoTerceroId,
      tipoCuenta: v.tipoCuenta,
      numeroCuenta: v.numeroCuenta.trim(),
      principal: !!v.principal,
      activa: v.activa !== false,
    };
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.editando
          ? this.service.actualizarCuenta(this.empleadoId, this.editando.id, dto)
          : this.service.crearCuenta(this.empleadoId, dto),
      );
      this.filas = res.data ?? [];
      this.mostrarForm = false;
      this.alert.showSuccess('Cuentas bancarias', 'Cuenta guardada.');
    } catch (err: any) {
      this.alert.showError('Cuentas bancarias', err?.error?.message ?? 'No se pudo guardar.');
    } finally {
      this.guardando = false;
    }
  }

  confirmarEliminar(c: CuentaBancaria): void {
    this.confirm.confirm({
      message: `¿Quitar la cuenta <b>${c.numeroCuenta}</b> de ${c.bancoNombre ?? 'el banco'}?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(c),
    });
  }

  private async eliminar(c: CuentaBancaria): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.eliminarCuenta(this.empleadoId, c.id));
      this.filas = res.data ?? [];
    } catch (err: any) {
      this.alert.showError('Cuentas bancarias', err?.error?.message ?? 'No se pudo quitar.');
    }
  }
}
