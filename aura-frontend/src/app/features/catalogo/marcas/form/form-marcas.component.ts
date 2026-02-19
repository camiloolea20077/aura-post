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
  CreateMarcaDto,
  MarcaModel,
  UpdateMarcaDto,
} from '../../../../core/models/marca.model';
import { MarcaService } from '../../../../core/services/marca.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-marcas',
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
  templateUrl: './form-marcas.component.html',
  styleUrls: ['./form-marcas.component.scss'],
})
export class FormMarcasComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() marcaId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() marcaSaved = new EventEmitter<MarcaModel>();

  public frmMarca!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly marcaService: MarcaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.marcaId;
      this.isEditMode ? this.loadData(this.marcaId!) : this.resetForm();
    }
  }

  private initForm(): void {
    this.frmMarca = this.fb.group({
      nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(150),
        ],
      ],
      activo: [true, Validators.required],
    });
  }

  private resetForm(): void {
    this.frmMarca?.reset({ nombre: null, activo: true });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmMarca.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await lastValueFrom(this.marcaService.getById(id));
      if (response?.status === 200 && response?.data) {
        this.frmMarca.patchValue({
          nombre: response.data.nombre,
          activo: response.data.activo,
        });
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la marca.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  async saveMarca(): Promise<void> {
    if (this.frmMarca.invalid) {
      this.frmMarca.markAllAsTouched();
      this.alertService.showWarn(
        'Formulario incompleto',
        'Completa los campos requeridos.',
      );
      return;
    }

    this.isSubmitting = true;
    try {
      const dto: CreateMarcaDto | UpdateMarcaDto = {
        nombre: this.frmMarca.value.nombre?.trim(),
        activo: this.frmMarca.value.activo,
      };

      const obs = this.isEditMode
        ? this.marcaService.update(this.marcaId!, dto)
        : this.marcaService.create(dto);

      const response = await lastValueFrom(obs);

      if (response?.status === 200 || response?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Marca actualizada' : 'Marca creada',
          response.message,
        );
        this.marcaSaved.emit(response.data);
        this.closeModal();
      }
    } catch (error: any) {
      this.alertService.showError(
        'Error al guardar',
        error?.message ?? 'No se pudo guardar la marca.',
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
