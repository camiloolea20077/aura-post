import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { lastValueFrom } from 'rxjs';

import { TipoEmpleadoService } from '../services/tipo-empleado.service';
import {
  TipoEmpleadoModel,
  CreateTipoEmpleadoDto,
} from '../models/tipo-empleado.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-form-tipo-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
  ],
  templateUrl: './form-tipo-empleado.component.html',
  styleUrls: ['./form-tipo-empleado.component.scss'],
  providers: [MessageService, ConfirmationService],
})
export class FormTipoEmpleadoComponent implements OnChanges {
  @Input() visible = false;
  @Input() tipoEmpleado: TipoEmpleadoModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  saving = false;

  form: CreateTipoEmpleadoDto = { nombre: '', descripcion: null };

  get isEdit(): boolean {
    return !!this.tipoEmpleado;
  }

  constructor(
    private readonly service: TipoEmpleadoService,
    private readonly alertService: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue && this.visible) {
      if (this.tipoEmpleado) {
        this.form = {
          nombre: this.tipoEmpleado.nombre.trim().toUpperCase(),
          descripcion: this.tipoEmpleado.descripcion,
        };
      } else {
        this.form = { nombre: '', descripcion: null };
      }
    }
  }

  isInvalid(field: keyof CreateTipoEmpleadoDto): boolean {
    if (field === 'nombre') {
      if (
        this.form.nombre &&
        this.form.nombre.trim().toUpperCase().includes('ADMIN')
      ) {
        this.alertService.showWarn(
          'Campo requerido',
          'El nombre no puede contener la palabra "admin"',
        );
        this.form.nombre = '';
        return true;
      }
      return !this.form.nombre || this.form.nombre.trim().length === 0;
    }
    return false;
  }

  async save(): Promise<void> {
    if (this.isInvalid('nombre')) {
      this.alertService.showWarn('Campo requerido', 'El nombre es obligatorio');
      return;
    }

    this.saving = true;
    try {
      if (this.isEdit) {
        await lastValueFrom(
          this.service.update(this.tipoEmpleado!.id, {
            nombre: this.form.nombre,
            descripcion: this.form.descripcion,
          }),
        );
        this.alertService.showSuccess(
          'Actualizado',
          'Tipo de empleado actualizado',
        );
      } else {
        await lastValueFrom(this.service.create(this.form));
        this.alertService.showSuccess('Creado', 'Tipo de empleado creado');
      }
      this.saved.emit();
      this.close();
    } catch (err: unknown) {
      const msg =
        (err as any)?.error?.message ??
        'No se pudo guardar el tipo de empleado';
      this.alertService.showError('Error', msg);
    } finally {
      this.saving = false;
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
