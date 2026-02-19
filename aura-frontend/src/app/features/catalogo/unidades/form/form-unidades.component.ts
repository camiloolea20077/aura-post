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
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateUnidadMedidaDto,
  UnidadMedidaModel,
  UpdateUnidadMedidaDto,
} from '../../../../core/models/unidad-medida.model';
import { UnidadMedidaService } from '../../../../core/services/unidad-medida.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-unidades',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputSwitchModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-unidades.component.html',
  styleUrls: ['./form-unidades.component.scss'],
})
export class FormUnidadesComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() unidadId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() unidadSaved = new EventEmitter<UnidadMedidaModel>();

  public frmUnidad!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly unidadMedidaService: UnidadMedidaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.unidadId;
      this.isEditMode ? this.loadData(this.unidadId!) : this.resetForm();
    }
  }

  private initForm(): void {
    this.frmUnidad = this.fb.group({
      nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      abreviatura: [
        null,
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(10),
        ],
      ],
      permiteDecimales: [false, Validators.required],
      activo: [true, Validators.required],
    });
  }

  private resetForm(): void {
    this.frmUnidad?.reset({
      nombre: null,
      abreviatura: null,
      permiteDecimales: false,
      activo: true,
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmUnidad.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await lastValueFrom(
        this.unidadMedidaService.getById(id),
      );
      if (response?.status === 200 && response?.data) {
        const d = response.data;
        this.frmUnidad.patchValue({
          nombre: d.nombre,
          abreviatura: d.abreviatura,
          permiteDecimales: d.permiteDecimales,
          activo: d.activo,
        });
      }
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar la unidad de medida.',
      );
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  async saveUnidad(): Promise<void> {
    if (this.frmUnidad.invalid) {
      this.frmUnidad.markAllAsTouched();
      this.alertService.showWarn(
        'Formulario incompleto',
        'Completa los campos requeridos.',
      );
      return;
    }

    this.isSubmitting = true;
    try {
      const { nombre, abreviatura, permiteDecimales, activo } =
        this.frmUnidad.value;
      const dto: CreateUnidadMedidaDto | UpdateUnidadMedidaDto = {
        nombre: nombre?.trim(),
        abreviatura: abreviatura?.trim().toUpperCase(),
        permiteDecimales,
        activo,
      };

      const obs = this.isEditMode
        ? this.unidadMedidaService.update(this.unidadId!, dto)
        : this.unidadMedidaService.create(dto);

      const response = await lastValueFrom(obs);

      if (response?.status === 200 || response?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Unidad actualizada' : 'Unidad creada',
          response.message,
        );
        this.unidadSaved.emit(response.data);
        this.closeModal();
      }
    } catch (error: any) {
      this.alertService.showError(
        'Error al guardar',
        error?.message ?? 'No se pudo guardar la unidad.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.resetForm();
    this.modalClosed.emit();
  }
}
