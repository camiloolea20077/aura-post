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
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  CreateInventarioDto,
  InventarioModel,
  UpdateInventarioDto,
} from '../../../../core/models/inventario.model';
import { InventarioService } from '../../../../core/services/inventario.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { IndexDBService } from '../../../../core/services/index-db.service';
import { BuscadorProductoDialogComponent } from '../../../../shared/components/buscador-producto-dialog/buscador-producto-dialog.component';
import { ProductoTableModel } from '../../../../core/models/producto.model';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-form-inventario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DividerModule,
    ButtonModule,
    ToastModule,
    SelectModule,
    BuscadorProductoDialogComponent,
  ],
  providers: [MessageService],
  templateUrl: './form-inventario.component.html',
  styleUrls: ['./form-inventario.component.scss'],
})
export class FormInventarioComponent implements OnInit, OnChanges {
  @Input() displayModal = false;
  @Input() inventarioId: number | null = null;
  @Input() slug = 'create';

  @Output() modalClosed = new EventEmitter<void>();
  @Output() itemSaved = new EventEmitter<InventarioModel>();

  public frmInv!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;

  public sucursalesOpts: { label: string; value: number }[] = [];
  private defaultSucursalId: number | null = null;

  // Buscador avanzado de producto
  public showBuscador = false;
  public productoSeleccionado: {
    id: number;
    nombre: string;
    sku: string | null;
    tipo: string;
  } | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly inventarioService: InventarioService,
    private readonly productoService: ProductoService,
    private readonly indexDBService: IndexDBService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.isEditMode = this.slug === 'edit' && !!this.inventarioId;
      this.isEditMode ? this.loadData(this.inventarioId!) : this.resetForm();
    }
  }

  private initForm(): void {
    this.frmInv = this.fb.group({
      productoId: [null, Validators.required],
      sucursalId: [null, Validators.required],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      ubicacion: [null, Validators.maxLength(100)],
    });
  }

  private resetForm(): void {
    this.productoSeleccionado = null;
    this.frmInv?.reset({
      productoId: null,
      sucursalId: this.isEditMode ? null : this.defaultSucursalId,
      stockMinimo: 0,
      stockActual: 0,
      ubicacion: null,
    });
    if (this.isEditMode) {
      this.frmInv.get('productoId')?.disable();
      this.frmInv.get('sucursalId')?.disable();
    }
  }

  isInvalid(f: string): boolean {
    const c = this.frmInv.get(f);
    return !!(c?.invalid && c?.touched);
  }

  private async loadDropdowns(): Promise<void> {
    try {
      const auth = await this.indexDBService.loadDataAuthDB();
      if (auth?.sucursales) {
        this.sucursalesOpts = auth.sucursales.map((s) => ({
          label: s.nombre,
          value: s.id,
        }));
        const def =
          auth.sucursales.find((s) => s.esDefault) ?? auth.sucursales[0];
        if (def) {
          this.defaultSucursalId = def.id;
          this.frmInv.patchValue({ sucursalId: def.id });
        }
      }
    } catch {
      /* no bloquear */
    }
  }

  onProductoSelected(p: ProductoTableModel): void {
    this.productoSeleccionado = {
      id: p.id,
      nombre: p.nombre,
      sku: p.sku ?? null,
      tipo: p.tipoProducto ?? '',
    };
    this.frmInv.patchValue({ productoId: p.id });
    this.frmInv.get('productoId')?.markAsTouched();
  }

  private async precargarProducto(id: number): Promise<void> {
    try {
      const res = await lastValueFrom(this.productoService.getById(id));
      if (res?.data) {
        const d = res.data;
        this.productoSeleccionado = {
          id: d.id,
          nombre: d.nombre,
          sku: d.sku ?? null,
          tipo: d.tipoProducto ?? '',
        };
      }
    } catch {
      /* silencioso */
    }
  }

  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(this.inventarioService.getById(id));
      if (res?.data) {
        const d = res.data;
        await this.precargarProducto(d.productoId);
        this.frmInv.patchValue({
          productoId: d.productoId,
          sucursalId: d.sucursalId,
          stockMinimo: d.stockMinimo,
          stockActual: d.stockActual,
          ubicacion: d.ubicacion,
        });
        this.frmInv.get('productoId')?.disable();
        this.frmInv.get('sucursalId')?.disable();
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el registro.');
      this.closeModal();
    } finally {
      this.isLoading = false;
    }
  }

  async saveItem(): Promise<void> {
    if (this.frmInv.invalid) {
      this.frmInv.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    try {
      const v = this.frmInv.getRawValue();
      const obs = this.isEditMode
        ? this.inventarioService.update(this.inventarioId!, {
            stockMinimo: v.stockMinimo,
            stockActual: v.stockActual,
            ubicacion: v.ubicacion?.trim() || null,
          } as UpdateInventarioDto)
        : this.inventarioService.create({
            productoId: v.productoId,
            sucursalId: v.sucursalId,
            stockMinimo: v.stockMinimo,
            stockActual: v.stockActual,
            ubicacion: v.ubicacion?.trim() || null,
          } as CreateInventarioDto);

      const res = await lastValueFrom(obs);
      if (res?.status === 200 || res?.status === 201) {
        this.alertService.showSuccess(
          this.isEditMode ? 'Inventario actualizado' : 'Inventario registrado',
          res.message,
        );
        this.itemSaved.emit(res.data);
        this.closeModal();
      }
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.message ?? 'No se pudo guardar.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  closeModal(): void {
    ['productoId', 'sucursalId'].forEach((f) => this.frmInv.get(f)?.enable());
    this.resetForm();
    this.modalClosed.emit();
  }
}
