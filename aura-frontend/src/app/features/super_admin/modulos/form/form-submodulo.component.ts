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
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { lastValueFrom } from 'rxjs';
import {
  ModuloModel,
  SubmoduloModel,
  CreateSubmoduloDto,
  UpdateSubmoduloDto,
} from '../models/modulo.model';
import { ModuloService } from '../services/modulo.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-submodulo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ToggleButtonModule,
  ],
  templateUrl: './form-submodulo.component.html',
  styleUrls: ['./form-submodulo.component.scss'],
})
export class FormSubmoduloComponent implements OnChanges {
  @Input() submodulo: SubmoduloModel | null = null;
  @Input() moduloId: number | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  frmSubmodulo: FormGroup;
  loading = false;
  modulos: ModuloModel[] = [];

  get isEdit(): boolean {
    return !!this.submodulo;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ModuloService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frmSubmodulo = this.fb.group({
      moduloId: [null, Validators.required],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      descripcion: ['', Validators.maxLength(500)],
      orden: [0],
      activo: [true],
    });
  }

  async ngOnChanges(): Promise<void> {
    await this.loadModulos();

    if (this.submodulo) {
      this.frmSubmodulo.patchValue({
        moduloId: this.submodulo.moduloId,
        nombre: this.submodulo.nombre,
        codigo: this.submodulo.codigo,
        descripcion: this.submodulo.descripcion,
        orden: this.submodulo.orden,
        activo: this.submodulo.activo,
      });
    } else {
      this.frmSubmodulo.patchValue({
        moduloId: this.moduloId,
        nombre: '',
        codigo: '',
        descripcion: '',
        orden: 0,
        activo: true,
      });
    }
  }

  private async loadModulos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.getAllModulos());
      this.modulos = res?.data ?? [];
    } catch {
      this.modulos = [];
    }
  }

  async save(): Promise<void> {
    if (this.frmSubmodulo.invalid) {
      this.frmSubmodulo.markAllAsTouched();
      return;
    }
    this.loading = true;
    try {
      if (this.isEdit) {
        const dto: UpdateSubmoduloDto = this.frmSubmodulo.value;
        await lastValueFrom(
          this.service.updateSubmodulo(this.submodulo!.id, dto),
        );
        this.alert.showSuccess('Actualizado', 'Submódulo actualizado');
      } else {
        const dto: CreateSubmoduloDto = this.frmSubmodulo.value;
        await lastValueFrom(this.service.createSubmodulo(dto));
        this.alert.showSuccess('Creado', 'Submódulo creado');
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
    const c = this.frmSubmodulo.get(f);
    return !!(c?.invalid && c?.touched);
  }
}
