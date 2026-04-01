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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { lastValueFrom } from 'rxjs';
import { ModuloModel, CreateModuloDto, UpdateModuloDto } from '../models/modulo.model';
import { ModuloService } from '../services/modulo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-modulo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    ToggleButtonModule,
  ],
  templateUrl: './form-modulo.component.html',
  styleUrls: ['./form-modulo.component.scss'],
})
export class FormModuloComponent implements OnChanges {
  @Input() modulo: ModuloModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  frmModulo: FormGroup;
  loading = false;

  get isEdit(): boolean {
    return !!this.modulo;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ModuloService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmModulo = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(500)],
      orden: [0],
      activo: [true],
    });
  }

  ngOnChanges(): void {
    if (this.modulo) {
      this.frmModulo.patchValue({
        nombre: this.modulo.nombre,
        codigo: this.modulo.codigo,
        descripcion: this.modulo.descripcion,
        orden: this.modulo.orden,
        activo: this.modulo.activo,
      });
    } else {
      this.frmModulo.reset({
        nombre: '',
        codigo: '',
        descripcion: '',
        orden: 0,
        activo: true,
      });
    }
  }

  async save(): Promise<void> {
    if (this.frmModulo.invalid) {
      this.frmModulo.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      if (this.isEdit) {
        const dto: UpdateModuloDto = this.frmModulo.value;
        await lastValueFrom(this.service.updateModulo(this.modulo!.id, dto));
        this.alert.showSuccess('Actualizado', 'Módulo actualizado');
      } else {
        const dto: CreateModuloDto = this.frmModulo.value;
        await lastValueFrom(this.service.createModulo(dto));
        this.alert.showSuccess('Creado', 'Módulo creado');
      }
      this.saved.emit();
    } catch (err: any) {
      this.alert.showError('Error', err?.error?.message ?? 'No se pudo guardar');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }

  isInvalid(f: string): boolean {
    const c = this.frmModulo.get(f);
    return !!(c?.invalid && c?.touched);
  }
}
