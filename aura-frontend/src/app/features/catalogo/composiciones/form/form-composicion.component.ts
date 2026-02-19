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
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateProductoComposicionDto,
  ProductoComposicionModel,
  TIPO_COMPOSICION_OPTIONS,
  TipoComposicion,
  UpdateProductoComposicionDto,
} from '../../../../core/models/producto-composicion.model';
import { ProductoComposicionService } from '../../../../core/services/producto-composicion.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

@Component({
  selector: 'app-form-composicion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputNumberModule,
    DropdownModule,
    ButtonModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-composicion.component.html',
  styleUrls: ['./form-composicion.component.scss'],
})
export class FormComposicionComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() composicionId: number | null = null;
  @Input() preselPadreId: number | null = null; // preseleccionar padre
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() composicionSaved = new EventEmitter<ProductoComposicionModel>();

  public frmComposicion!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  public tipoOptions = TIPO_COMPOSICION_OPTIONS;
  public productosOpts: { label: string; value: number }[] = [];

  // Selección actual para validación padre ≠ hijo
  get padreIdValue(): number | null {
    return this.frmComposicion?.get('productoPadreId')?.value ?? null;
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly composicionService: ProductoComposicionService,
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProductos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.composicionId;
      if (this.isEditMode) {
        this.loadData(this.composicionId!);
      } else {
        this.resetForm();
        if (this.preselPadreId) {
          this.frmComposicion.patchValue({
            productoPadreId: this.preselPadreId,
          });
        }
      }
    }
  }

  private initForm(): void {
    this.frmComposicion = this.fb.group(
      {
        productoPadreId: [null, Validators.required],
        productoHijoId: [null, Validators.required],
        cantidad: [1, [Validators.required, Validators.min(0.0001)]],
        tipo: ['KIT', Validators.required],
      },
      { validators: this.padreHijoDistintos },
    );
  }

  private padreHijoDistintos(g: FormGroup): { mismoProducto: true } | null {
    const padre = g.get('productoPadreId')?.value;
    const hijo = g.get('productoHijoId')?.value;
    return padre && hijo && padre === hijo ? { mismoProducto: true } : null;
  }

  private resetForm(): void {
    this.frmComposicion?.reset({
      productoPadreId: null,
      productoHijoId: null,
      cantidad: 1,
      tipo: 'KIT',
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmComposicion.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  get hijoOptions(): { label: string; value: number }[] {
    // Excluir el producto padre de las opciones del hijo
    return this.productosOpts.filter((p) => p.value !== this.padreIdValue);
  }

  get tipoSeleccionado() {
    const val = this.frmComposicion?.get('tipo')?.value;
    return this.tipoOptions.find((t) => t.value === val);
  }

  private async loadProductos(): Promise<void> {
    try {
      const response = await lastValueFrom(this.productoService.list());
      if (response?.data) {
        this.productosOpts = response.data.map((p) => ({
          label: p.nombre,
          value: p.id,
        }));
      }
    } catch {
      /* no bloquear */
    }
  }

  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await lastValueFrom(this.composicionService.getById(id));
      if (response?.status === 200 && response?.data) {
        const d = response.data;
        this.frmComposicion.patchValue({
          productoPadreId: d.productoPadreId,
          productoHijoId: d.productoHijoId,
          cantidad: d.cantidad,
          tipo: d.tipo,
        });
        // En edición no se pueden cambiar los productos
        this.frmComposicion.get('productoPadreId')?.disable();
        this.frmComposicion.get('productoHijoId')?.disable();
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la composición.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  async saveComposicion(): Promise<void> {
    if (this.frmComposicion.invalid) {
      this.frmComposicion.markAllAsTouched();
      if (this.frmComposicion.hasError('mismoProducto')) {
        this.alertService.showWarn(
          'Composición inválida',
          'El producto padre y el hijo no pueden ser el mismo.',
        );
      } else {
        this.alertService.showWarn(
          'Formulario incompleto',
          'Completa los campos requeridos.',
        );
      }
      return;
    }

    this.isSubmitting = true;
    try {
      const v = this.frmComposicion.getRawValue();
      let obs;

      if (this.isEditMode) {
        const dto: UpdateProductoComposicionDto = {
          cantidad: v.cantidad,
          tipo: v.tipo,
        };
        obs = this.composicionService.update(this.composicionId!, dto);
      } else {
        const dto: CreateProductoComposicionDto = {
          productoPadreId: v.productoPadreId,
          productoHijoId: v.productoHijoId,
          cantidad: v.cantidad,
          tipo: v.tipo as TipoComposicion,
        };
        obs = this.composicionService.create(dto);
      }

      const response = await lastValueFrom(obs);
      if (response?.status === 200 || response?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Composición actualizada' : 'Composición creada',
          response.message,
        );
        this.composicionSaved.emit(response.data);
        this.closeModal();
      }
    } catch (error: any) {
      this.alertService.showError(
        'Error al guardar',
        error?.message ?? 'No se pudo guardar la composición.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.frmComposicion.get('productoPadreId')?.enable();
    this.frmComposicion.get('productoHijoId')?.enable();
    this.resetForm();
    this.modalClosed.emit();
  }
}
