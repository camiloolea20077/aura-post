import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CreateCuentaPagarDto,
  UpdateCuentaPagarDto,
} from '../models/cuenta-pagar.model';
import { CuentaPagarService } from '../services/cuenta-pagar.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { OnInit } from '@angular/core';

import { aFechaHoraLocal } from '../../../shared/utils/fecha.util';
@Component({
  selector: 'app-form-cuenta-pagar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    TextareaModule,
    CalendarModule,
    DropdownModule,
  ],
  templateUrl: './form-cuenta-pagar.component.html',
  styleUrls: ['./form-cuenta-pagar.component.scss'],
})
export class FormCuentaPagarComponent implements OnChanges, OnInit {
  @Input() visible = false;
  @Input() cuenta: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  proveedores: any[] = [];

  metodosPago = [
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia', value: 'transferencia' },
    { label: 'Consignación', value: 'consignacion' },
    { label: 'Cheque', value: 'cheque' },
  ];

  get isEdit(): boolean {
    return !!this.cuenta;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: CuentaPagarService,
    private readonly terceroService: TerceroService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      proveedorId: [null, Validators.required],
      numeroFacturaExterno: [null],
      totalDeuda: [null, [Validators.required, Validators.min(1)]],
      fechaEmision: [new Date(), Validators.required],
      fechaVencimiento: [null],
      observaciones: [null],
    });
  }

  ngOnInit(): void {
    this.cargarProveedores();
  }

  async cargarProveedores(): Promise<void> {
    try {
      const resp = await lastValueFrom(this.terceroService.proveedores());
      this.proveedores = resp.data || [];
      this.cdr.markForCheck();
    } catch (err: any) {
      console.error('Error cargando proveedores', err);
    }
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.cuenta) {
        this.form.patchValue({
          proveedorId: this.cuenta.terceroId,
          numeroFacturaExterno: this.cuenta.numeroFacturaExterno,
          totalDeuda: this.cuenta.totalDeuda,
          fechaEmision: new Date(this.cuenta.fechaEmision),
          fechaVencimiento: this.cuenta.fechaVencimiento
            ? new Date(this.cuenta.fechaVencimiento)
            : null,
          observaciones: this.cuenta.observaciones,
        });
      } else {
        this.form.reset({
          proveedorId: null,
          numeroFacturaExterno: null,
          totalDeuda: null,
          fechaEmision: new Date(),
          fechaVencimiento: null,
          observaciones: null,
        });
      }
      this.cdr.markForCheck();
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    const dto: CreateCuentaPagarDto = {
      proveedorId: formValue.proveedorId,
      numeroFacturaExterno: formValue.numeroFacturaExterno,
      totalDeuda: formValue.totalDeuda,
      fechaEmision: aFechaHoraLocal(formValue.fechaEmision),
      fechaVencimiento: aFechaHoraLocal(formValue.fechaVencimiento) || null,
      observaciones: formValue.observaciones || null,
    };

    try {
      if (this.isEdit) {
        const updateDto: UpdateCuentaPagarDto = {
          fechaVencimiento: dto.fechaVencimiento,
          observaciones: dto.observaciones,
        };
        await lastValueFrom(this.service.update(this.cuenta.id, updateDto));
        this.alert.showSuccess(
          'Actualizado',
          'La cuenta por pagar ha sido actualizada',
        );
      } else {
        await lastValueFrom(this.service.create(dto));
        this.alert.showSuccess('Creado', 'La cuenta por pagar ha sido creada');
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message || 'No se pudo guardar',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }
}
