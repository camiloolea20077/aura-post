import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { lastValueFrom } from 'rxjs';

import { TerceroPickerComponent } from '../../../../shared/components/tercero-picker/tercero-picker.component';

import { NominaService } from '../../../../core/services/nomina.service';
import { TipoEmpleadoService } from '../../../configuracion/tipos-empleado/services/tipo-empleado.service';
import {
  CreateEmpleadoDto,
  EmpleadoModel,
} from '../../../../core/models/nomina.model';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    TerceroPickerComponent,
  ],
  templateUrl: './form-empleado.component.html',
  styleUrls: ['./form-empleado.component.scss'],
})
export class FormEmpleadoComponent implements OnChanges, OnInit {
  @Input() displayModal = false;
  @Input() empleadoEdit: EmpleadoModel | null = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() empleadoSaved = new EventEmitter<void>();

  public saving = false;

  public form: CreateEmpleadoDto = this.emptyForm();

  public tipoDocOpts = [
    { label: 'Cédula de Ciudadanía', value: 'CC' },
    { label: 'Cédula de Extranjería', value: 'CE' },
    { label: 'Pasaporte', value: 'PASAPORTE' },
    { label: 'NIT', value: 'NIT' },
  ];

  public tipoContratoOpts = [
    { label: 'Término indefinido', value: 'INDEFINIDO' },
    { label: 'Término fijo', value: 'FIJO' },
    { label: 'Obra o labor', value: 'OBRA_LABOR' },
    { label: 'Prestación de servicios', value: 'PRESTACION_SERVICIOS' },
  ];

  public tipoCuentaOpts = [
    { label: 'Ahorros', value: 'AHORROS' },
    { label: 'Corriente', value: 'CORRIENTE' },
  ];

  public arlOpts = [
    { label: 'Nivel I - 0.522%', value: 1 },
    { label: 'Nivel II - 1.044%', value: 2 },
    { label: 'Nivel III - 2.436%', value: 3 },
    { label: 'Nivel IV - 4.350%', value: 4 },
    { label: 'Nivel V - 6.960%', value: 5 },
  ];

  public tipoEmpleadoOpts: { label: string; value: number }[] = [];

  public fechaIngreso: Date | null = null;
  public fechaFinContrato: Date | null = null;

  public showNewTipoEmpleado = false;
  public newTipoEmpleado = { nombre: '', descripcion: '' };
  public savingTipoEmpleado = false;

  constructor(
    private readonly nominaService: NominaService,
    private readonly tipoEmpleadoService: TipoEmpleadoService,
    private readonly alertService: AlertService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadTipoEmpleados();
  }

  async loadTipoEmpleados(): Promise<void> {
    try {
      const res = await lastValueFrom(this.tipoEmpleadoService.getAll());
      this.tipoEmpleadoOpts =
        res?.data?.map((t) => ({ label: t.nombre, value: t.id })) ?? [];
    } catch {
      this.tipoEmpleadoOpts = [];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal']?.currentValue) {
      if (this.empleadoEdit) {
        this.form = {
          nombres: this.empleadoEdit.nombres,
          apellidos: this.empleadoEdit.apellidos,
          tipoDocumento: this.empleadoEdit.tipoDocumento,
          numeroDocumento: this.empleadoEdit.numeroDocumento,
          cargo: this.empleadoEdit.cargo,
          tipoEmpleadoId: this.empleadoEdit.tipoEmpleadoId,
          fechaIngreso: this.empleadoEdit.fechaIngreso,
          fechaFinContrato: this.empleadoEdit.fechaFinContrato,
          salarioBase: this.empleadoEdit.salarioBase,
          tipoContrato: this.empleadoEdit.tipoContrato,
          banco: this.empleadoEdit.banco,
          numeroCuenta: this.empleadoEdit.numeroCuenta,
          tipoCuenta: this.empleadoEdit.tipoCuenta as any,
          nivelRiesgoArl: this.empleadoEdit.nivelRiesgoArl,
          requiereControlAsistencia:
            this.empleadoEdit.requiereControlAsistencia ?? false,
        };
        this.fechaIngreso = this.empleadoEdit.fechaIngreso
          ? new Date(this.empleadoEdit.fechaIngreso)
          : null;
        this.fechaFinContrato = this.empleadoEdit.fechaFinContrato
          ? new Date(this.empleadoEdit.fechaFinContrato)
          : null;
      } else {
        this.form = this.emptyForm();
        this.fechaIngreso = null;
        this.fechaFinContrato = null;
      }
    }
  }

  async save(): Promise<void> {
    if (
      !this.form.nombres ||
      !this.form.apellidos ||
      !this.form.numeroDocumento ||
      !this.form.salarioBase
    ) {
      this.alertService.showWarn(
        'Campos requeridos',
        'Completa nombres, apellidos, documento y salario',
      );
      return;
    }

    if (this.fechaIngreso) {
      this.form.fechaIngreso = this.fechaIngreso.toISOString().split('T')[0];
    }

    if (this.form.tipoContrato === 'FIJO' && !this.fechaFinContrato) {
      this.alertService.showWarn(
        'Campo requerido',
        'En contrato a término fijo debes indicar la fecha fin de contrato',
      );
      return;
    }
    this.form.fechaFinContrato =
      this.form.tipoContrato === 'FIJO' && this.fechaFinContrato
        ? this.fechaFinContrato.toISOString().split('T')[0]
        : null;

    this.saving = true;
    try {
      if (this.empleadoEdit) {
        await lastValueFrom(
          this.nominaService.updateEmpleado(this.empleadoEdit.id, this.form),
        );
        this.alertService.showSuccess(
          'Actualizado',
          'Empleado actualizado correctamente',
        );
      } else {
        await lastValueFrom(this.nominaService.createEmpleado(this.form));
        this.alertService.showSuccess('Creado', 'Empleado creado exitosamente');
      }
      this.empleadoSaved.emit();
    } catch {
      this.alertService.showError('Error', 'No se pudo guardar el empleado');
    } finally {
      this.saving = false;
    }
  }

  async createTipoEmpleado(): Promise<void> {
    if (!this.newTipoEmpleado.nombre.trim()) {
      this.alertService.showWarn('Campo requerido', 'El nombre es obligatorio');
      return;
    }

    this.savingTipoEmpleado = true;
    try {
      const res = await lastValueFrom(
        this.tipoEmpleadoService.create({
          nombre: this.newTipoEmpleado.nombre.toUpperCase(),
          descripcion: this.newTipoEmpleado.descripcion || null,
        }),
      );
      this.alertService.showSuccess('Creado', 'Tipo de empleado creado');
      this.form.tipoEmpleadoId = res.data.id;
      await this.loadTipoEmpleados();
      this.showNewTipoEmpleado = false;
      this.newTipoEmpleado = { nombre: '', descripcion: '' };
    } catch (err: unknown) {
      const msg =
        (err as any)?.error?.message ?? 'No se pudo crear el tipo de empleado';
      this.alertService.showError('Error', msg);
    } finally {
      this.savingTipoEmpleado = false;
    }
  }

  onBancoSeleccionado(ev: { id: number; nombre: string } | null): void {
    this.form.banco = ev ? ev.nombre : null;
  }

  close(): void {
    this.modalClosed.emit();
  }

  private emptyForm(): CreateEmpleadoDto {
    return {
      nombres: '',
      apellidos: '',
      tipoDocumento: 'CC',
      numeroDocumento: '',
      cargo: null,
      tipoEmpleadoId: null,
      fechaIngreso: '',
      fechaFinContrato: null,
      salarioBase: 0,
      tipoContrato: 'INDEFINIDO',
      banco: null,
      numeroCuenta: null,
      tipoCuenta: null,
      nivelRiesgoArl: 1,
      requiereControlAsistencia: false,
    };
  }
}