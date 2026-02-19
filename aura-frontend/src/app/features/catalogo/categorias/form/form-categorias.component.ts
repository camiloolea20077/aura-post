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
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CategoriaDto,
  CategoriaModel,
  CategoriaTableModel,
  CreateCategoriaDto,
  UpdateCategoriaDto,
} from '../../../../core/models/categoria.model';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-categorias',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    InputSwitchModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-categorias.component.html',
  styleUrls: ['./form-categorias.component.scss'],
})
export class FormCategoriasComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() categoriaId: number | null = null;
  @Input() slug = 'create'; // 'create' | 'edit'

  @Output() modalClosed = new EventEmitter<void>();
  @Output() categoriaSaved = new EventEmitter<CategoriaModel>();

  public frmCategoria!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  // Opciones para el dropdown de categoría padre
  public categoriasPadre: { label: string; value: number | null }[] = [
    { label: 'Sin categoría padre (raíz)', value: null },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly categoriaService: CategoriaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategoriasPadre();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.categoriaId;
      if (this.isEditMode) {
        this.loadData(this.categoriaId!);
      } else {
        this.resetForm();
      }
    }
  }

  // ─── Form ────────────────────────────────────────────────
  private initForm(): void {
    this.frmCategoria = this.fb.group({
      nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(150),
        ],
      ],
      padreId: [null],
      impuestoDefecto: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      activo: [true, Validators.required],
    });
  }

  private resetForm(): void {
    this.frmCategoria?.reset({
      nombre: null,
      padreId: null,
      impuestoDefecto: 0,
      activo: true,
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmCategoria.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  // ─── Cargar lista de categorías padre para el dropdown ───
  private async loadCategoriasPadre(): Promise<void> {
    try {
      const response = await lastValueFrom(this.categoriaService.list());
      if (response?.status === 200 && response?.data) {
        const opciones = response.data.map((c: CategoriaDto) => ({
          label: c.nombre,
          value: c.id,
        }));
        this.categoriasPadre = [
          { label: 'Sin categoría padre (raíz)', value: null },
          ...opciones,
        ];
      }
    } catch {
      // No crítico, el dropdown tendrá solo la opción raíz
    }
  }

  // ─── Cargar datos en modo edición ────────────────────────
  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await lastValueFrom(this.categoriaService.getById(id));
      if (response?.status === 200 && response?.data) {
        this.patchForm(response.data);
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la categoría.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  private patchForm(data: CategoriaModel): void {
    this.frmCategoria.patchValue({
      nombre: data.nombre,
      padreId: data.padreId,
      impuestoDefecto: data.impuestoDefecto,
      activo: data.activo,
    });
  }

  // ─── DTO ─────────────────────────────────────────────────
  private buildDto(): CreateCategoriaDto | UpdateCategoriaDto {
    const { nombre, padreId, impuestoDefecto, activo } =
      this.frmCategoria.value;
    return {
      nombre: nombre?.trim(),
      padreId: padreId ?? null,
      impuestoDefecto: impuestoDefecto ?? 0,
      activo,
    };
  }

  // ─── Guardar ─────────────────────────────────────────────
  async saveCategoria(): Promise<void> {
    if (this.frmCategoria.invalid) {
      this.frmCategoria.markAllAsTouched();
      this.alertService.showWarn(
        'Formulario incompleto',
        'Completa los campos requeridos.',
      );
      return;
    }

    this.isSubmitting = true;
    try {
      const dto = this.buildDto();
      const obs = this.isEditMode
        ? this.categoriaService.update(
            this.categoriaId!,
            dto as UpdateCategoriaDto,
          )
        : this.categoriaService.create(dto as CreateCategoriaDto);

      const response = await lastValueFrom(obs);

      if (response?.status === 200 || response?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Categoría actualizada' : 'Categoría creada',
          response.message,
        );
        this.categoriaSaved.emit(response.data);
        this.closeModal();
      }
    } catch (error: any) {
      this.alertService.showError(
        'Error al guardar',
        error?.message ?? 'No se pudo guardar la categoría.',
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
