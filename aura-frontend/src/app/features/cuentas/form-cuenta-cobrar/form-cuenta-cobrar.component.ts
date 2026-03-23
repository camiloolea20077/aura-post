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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../shared/pipes/alert.service';
import { CreateCuentaCobrarDto, UpdateCuentaCobrarDto, MetodoPago } from '../models/cuenta-cobrar.model';
import { CuentaCobrarService } from '../services/cuenta-cobrar.service';
import { TerceroService } from '../../../core/services/tercero.service';

@Component({
  selector: 'app-form-cuenta-cobrar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    InputTextarea,
    CalendarModule,
    DropdownModule,
  ],
  templateUrl: './form-cuenta-cobrar.component.html',
  styleUrls: ['./form-cuenta-cobrar.component.scss'],
})
export class FormCuentaCobrarComponent implements OnChanges {
  @Input() visible = false;
  @Input() cuenta: any = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  clientes: any[] = [];

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
    private readonly service: CuentaCobrarService,
    private readonly terceroService: TerceroService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      clienteId: [null, Validators.required],
      totalDeuda: [null, [Validators.required, Validators.min(1)]],
      fechaEmision: [new Date(), Validators.required],
      fechaVencimiento: [null],
      observaciones: [null],
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      if (this.cuenta) {
        this.form.patchValue({
          clienteId: this.cuenta.terceroId,
          totalDeuda: this.cuenta.totalDeuda,
          fechaEmision: new Date(this.cuenta.fechaEmision),
          fechaVencimiento: this.cuenta.fechaVencimiento ? new Date(this.cuenta.fechaVencimiento) : null,
          observaciones: this.cuenta.observaciones,
        });
      } else {
        this.form.reset({
          clienteId: null,
          totalDeuda: null,
          fechaEmision: new Date(),
          fechaVencimiento: null,
          observaciones: null,
        });
      }
      this.loadClientes();
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

    const dto: CreateCuentaCobrarDto = {
      clienteId: formValue.clienteId,
      totalDeuda: formValue.totalDeuda,
      fechaEmision: formValue.fechaEmision.toISOString(),
      fechaVencimiento: formValue.fechaVencimiento?.toISOString() || null,
      observaciones: formValue.observaciones || null,
    };

    try {
      if (this.isEdit) {
        const updateDto: UpdateCuentaCobrarDto = {
          fechaVencimiento: dto.fechaVencimiento,
          observaciones: dto.observaciones,
        };
        await lastValueFrom(this.service.update(this.cuenta.id, updateDto));
        this.alert.showSuccess('Actualizado', 'La cuenta por cobrar ha sido actualizada');
      } else {
        await lastValueFrom(this.service.create(dto));
        this.alert.showSuccess('Creado', 'La cuenta por cobrar ha sido creada');
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message || 'No se pudo guardar');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async loadClientes(): Promise<void> {
    try {
      const res = await lastValueFrom(this.terceroService.clientes());
      this.clientes = (res?.data ?? []).map((t) => ({
        label: t.nombreCompleto,
        value: t.id,
      }));
    } catch (err) {
      this.clientes = [];
    } finally {
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
