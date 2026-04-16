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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateProductoPresentacionDto,
  ProductoPresentacionModel,
  UpdateProductoPresentacionDto,
} from '../../../../core/models/producto-presentacion.model';
import { ProductoPresentacionService } from '../../../../core/services/producto-presentacion.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { BuscadorProductoDialogComponent } from '../../../../shared/components/buscador-producto-dialog/buscador-producto-dialog.component';
import { ProductoTableModel } from '../../../../core/models/producto.model';

@Component({
  selector: 'app-form-presentaciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    InputSwitchModule,
    ButtonModule,
    ToastModule,
    BuscadorProductoDialogComponent,
  ],
  providers: [MessageService],
  templateUrl: './form-presentaciones.component.html',
  styleUrls: ['./form-presentaciones.component.scss'],
})
export class FormPresentacionesComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() presentacionId: number | null = null;
  @Input() preselProductoId: number | null = null; // Si se abre desde el contexto de un producto
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() presentacionSaved = new EventEmitter<ProductoPresentacionModel>();

  public frmPresentacion!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  // Buscador avanzado de producto
  public showBuscador = false;
  public productoSeleccionado: { id: number; nombre: string; sku: string | null } | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly presentacionService: ProductoPresentacionService,
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.presentacionId;
      if (this.isEditMode) {
        this.loadData(this.presentacionId!);
      } else {
        this.resetForm();
        // Preseleccionar producto si viene de contexto
        if (this.preselProductoId) {
          this.frmPresentacion.patchValue({ productoId: this.preselProductoId });
          this.precargarProducto(this.preselProductoId);
        }
      }
    }
  }

  private initForm(): void {
    this.frmPresentacion = this.fb.group({
      productoId: [null, Validators.required],
      nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      codigoBarras: [null, [Validators.maxLength(50)]],
      factorConversion: [1, [Validators.required, Validators.min(0.0001)]],
      precio: [null, [Validators.required, Validators.min(0.01)]],
      activo: [true, Validators.required],
    });
  }

  private resetForm(): void {
    this.productoSeleccionado = null;
    this.frmPresentacion?.reset({
      productoId: null,
      nombre: null,
      codigoBarras: null,
      factorConversion: 1,
      precio: null,
      activo: true,
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmPresentacion.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onProductoSelected(p: ProductoTableModel): void {
    this.productoSeleccionado = { id: p.id, nombre: p.nombre, sku: p.sku ?? null };
    this.frmPresentacion.patchValue({ productoId: p.id });
    this.frmPresentacion.get('productoId')?.markAsTouched();
  }

  private async precargarProducto(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.productoService.getById(id));
      if (res?.data) {
        const d = res.data;
        this.productoSeleccionado = { id: d.id, nombre: d.nombre, sku: d.sku ?? null };
      }
    } catch { /* silencioso */ }
  }

  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await lastValueFrom(
        this.presentacionService.getById(id),
      );
      if (response?.status === 200 && response?.data) {
        const d = response.data;
        await this.precargarProducto(d.productoId);
        setTimeout(() => {
          this.frmPresentacion.patchValue({
            productoId: d.productoId,
            nombre: d.nombre,
            codigoBarras: d.codigoBarras,
            factorConversion: d.factorConversion,
            precio: d.precio,
            activo: d.activo,
          });
        });
        // En modo edición el producto no se puede cambiar
        this.frmPresentacion.get('productoId')?.disable();
      }
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo cargar la presentación.',
      );
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  async savePresentacion(): Promise<void> {
    if (this.frmPresentacion.invalid) {
      this.frmPresentacion.markAllAsTouched();
      this.alertService.showWarn(
        'Formulario incompleto',
        'Completa los campos requeridos.',
      );
      return;
    }

    this.isSubmitting = true;
    try {
      const v = this.frmPresentacion.getRawValue(); // getRawValue incluye campos disabled

      let obs;
      if (this.isEditMode) {
        const dto: UpdateProductoPresentacionDto = {
          nombre: v.nombre?.trim(),
          codigoBarras: v.codigoBarras?.trim() || null,
          factorConversion: v.factorConversion,
          esDefaultCompra: false,
          esDefaultVenta: false,
          precio: v.precio,
          costo: 0,
          activo: v.activo,
        };
        obs = this.presentacionService.update(this.presentacionId!, dto);
      } else {
        const dto: CreateProductoPresentacionDto = {
          productoId: v.productoId,
          esDefaultCompra: false,
          esDefaultVenta: false,
          precio: v.precio,
          costo: 0,
          nombre: v.nombre?.trim(),
          codigoBarras: v.codigoBarras?.trim() || null,
          factorConversion: v.factorConversion,
          activo: v.activo,
        };
        obs = this.presentacionService.create(dto);
      }

      const response = await lastValueFrom(obs);
      if (response?.status === 200 || response?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Presentación actualizada' : 'Presentación creada',
          response.message,
        );
        this.presentacionSaved.emit(response.data);
        this.closeModal();
      }
    } catch (error: any) {
      this.alertService.showError(
        'Error al guardar',
        error?.message ?? 'No se pudo guardar la presentación.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    this.frmPresentacion.get('productoId')?.enable();
    this.productoSeleccionado = null;
    this.resetForm();
    this.modalClosed.emit();
  }
}
