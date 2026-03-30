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
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { lastValueFrom } from 'rxjs';

import { ComisionService } from '../../../../core/services/comision.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionConfigModel,
  ModalidadComision,
  TecnicoDto,
  TipoComision,
} from '../../../../core/models/comision.model';
import { CategoriaDto } from '../../../../core/models/categoria.model';

interface OpcionSimple {
  label: string;
  value: number;
}

@Component({
  selector: 'app-form-comision-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    ToggleButtonModule,
    SelectButtonModule,
  ],
  templateUrl: './form-comision-config.component.html',
  styleUrls: ['./form-comision-config.component.scss'],
})
export class FormComisionConfigComponent implements OnChanges {
  @Input() visible = false;
  @Input() config: ComisionConfigModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  frm: FormGroup;
  loading = false;
  loadingTecnicos = false;
  loadingCategorias = false;

  productoOpts: OpcionSimple[] = [];
  tecnicos: TecnicoDto[] = [];
  categorias: CategoriaDto[] = [];

  readonly modalidadOptions: { label: string; value: ModalidadComision }[] = [
    { label: 'Servicio / Taller', value: 'SERVICIO' },
    { label: 'Venta (vendedor)', value: 'VENTA' },
  ];

  readonly tipoOptions: { label: string; value: TipoComision }[] = [
    { label: 'Porcentaje (%)', value: 'PORCENTAJE' },
    { label: 'Valor fijo ($)', value: 'VALOR_FIJO' },
  ];

  // Para VENTA: objetivo de la comisión
  readonly objetivoOptions = [
    { label: 'Por producto', value: 'producto' },
    { label: 'Por categoría', value: 'categoria' },
  ];

  get isEdit(): boolean { return !!this.config; }
  get modalidad(): ModalidadComision { return this.frm.get('modalidad')!.value; }
  get objetivo(): 'producto' | 'categoria' { return this.frm.get('objetivo')!.value; }
  get isServicio(): boolean { return this.modalidad === 'SERVICIO'; }
  get isVentaProducto(): boolean { return !this.isServicio && this.objetivo === 'producto'; }
  get isVentaCategoria(): boolean { return !this.isServicio && this.objetivo === 'categoria'; }

  constructor(
    private readonly fb: FormBuilder,
    private readonly comisionService: ComisionService,
    private readonly productoService: ProductoService,
    private readonly categoriaService: CategoriaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.frm = this.fb.group({
      modalidad:         ['SERVICIO', Validators.required],
      objetivo:          ['producto'],          // VENTA: producto | categoria
      productoId:        [null],
      categoriaId:       [null],
      tecnicoId:         [null],
      tipo:              ['PORCENTAJE', Validators.required],
      porcentajeTecnico: [50, [Validators.required, Validators.min(0.01), Validators.max(100)]],
      porcentajeNegocio: [{ value: 50, disabled: true }],
      activo:            [true],
    });

    // Auto-calcular % negocio solo para SERVICIO
    this.frm.get('porcentajeTecnico')!.valueChanges.subscribe((val) => {
      if (this.isServicio) {
        const neg = val != null ? Math.round((100 - val) * 100) / 100 : 0;
        this.frm.get('porcentajeNegocio')!.setValue(neg, { emitEvent: false });
      }
      this.cdr.markForCheck();
    });

    // Al cambiar modalidad, resetear campos irrelevantes
    this.frm.get('modalidad')!.valueChanges.subscribe(() => {
      this.frm.patchValue({ productoId: null, categoriaId: null, porcentajeTecnico: 50 }, { emitEvent: false });
      this.productoOpts = [];
      this.cdr.markForCheck();
    });
  }

  async ngOnChanges(): Promise<void> {
    if (!this.visible) return;

    this.productoOpts = [];
    this.frm.reset({
      modalidad: 'SERVICIO',
      objetivo: 'producto',
      productoId: null,
      categoriaId: null,
      tecnicoId: null,
      tipo: 'PORCENTAJE',
      porcentajeTecnico: 50,
      porcentajeNegocio: 50,
      activo: true,
    });

    await Promise.all([this.loadTecnicos(), this.loadCategorias()]);

    if (this.config) {
      const modalidad = this.config.modalidad ?? 'SERVICIO';
      const objetivo = this.config.categoriaId ? 'categoria' : 'producto';

      if (this.config.productoNombre && this.config.productoId) {
        this.productoOpts = [{ label: this.config.productoNombre, value: this.config.productoId }];
      }

      this.frm.patchValue({
        modalidad,
        objetivo,
        productoId:        this.config.productoId,
        categoriaId:       this.config.categoriaId,
        tecnicoId:         this.config.tecnicoId,
        tipo:              this.config.tipo,
        porcentajeTecnico: this.config.porcentajeTecnico,
        porcentajeNegocio: this.config.porcentajeNegocio,
        activo:            this.config.activo,
      });
    }

    this.cdr.markForCheck();
  }

  // ── Búsqueda server-side de productos ────────────────────────
  async onFiltroProducto(event: { filter: string }): Promise<void> {
    const q = event.filter?.trim();
    if (!q || q.length < 2) {
      if (this.isEdit && this.config?.productoId) {
        this.productoOpts = [{ label: this.config.productoNombre!, value: this.config.productoId }];
      } else {
        this.productoOpts = [];
      }
      this.cdr.markForCheck();
      return;
    }
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      let productos = res?.data ?? [];
      // Para SERVICIO: filtrar solo tipo SERVICIO
      if (this.isServicio) {
        productos = productos.filter((p: any) => p.tipoProducto === 'SERVICIO');
      }
      this.productoOpts = productos.map((p: any): OpcionSimple => ({
        label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
        value: p.id,
      }));
    } catch {
      this.productoOpts = [];
    }
    this.cdr.markForCheck();
  }

  private async loadTecnicos(): Promise<void> {
    this.loadingTecnicos = true;
    try {
      const res = await lastValueFrom(this.comisionService.listTecnicos());
      this.tecnicos = res?.data ?? [];
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar los usuarios');
    } finally {
      this.loadingTecnicos = false;
      this.cdr.markForCheck();
    }
  }

  private async loadCategorias(): Promise<void> {
    this.loadingCategorias = true;
    try {
      const res = await lastValueFrom(this.categoriaService.list());
      this.categorias = res?.data ?? [];
    } catch {
      this.categorias = [];
    } finally {
      this.loadingCategorias = false;
      this.cdr.markForCheck();
    }
  }

  async save(): Promise<void> {
    this.frm.markAllAsTouched();

    const raw = this.frm.getRawValue();
    const modalidad: ModalidadComision = raw.modalidad;

    // Validaciones extra
    if (modalidad === 'SERVICIO' && !raw.productoId) {
      this.alertService.showError('Campo requerido', 'Selecciona el servicio');
      return;
    }
    if (modalidad === 'VENTA' && raw.objetivo === 'producto' && !raw.productoId) {
      this.alertService.showError('Campo requerido', 'Selecciona el producto');
      return;
    }
    if (modalidad === 'VENTA' && raw.objetivo === 'categoria' && !raw.categoriaId) {
      this.alertService.showError('Campo requerido', 'Selecciona la categoría');
      return;
    }
    if (this.frm.invalid) return;

    const dto = {
      modalidad,
      productoId:        modalidad === 'SERVICIO' || raw.objetivo === 'producto' ? raw.productoId : null,
      categoriaId:       modalidad === 'VENTA' && raw.objetivo === 'categoria' ? raw.categoriaId : null,
      tecnicoId:         raw.tecnicoId ?? null,
      tipo:              raw.tipo as TipoComision,
      porcentajeTecnico: raw.porcentajeTecnico,
      porcentajeNegocio: modalidad === 'SERVICIO' ? raw.porcentajeNegocio : 0,
      ...(this.isEdit ? { activo: raw.activo } : {}),
    };

    this.loading = true;
    try {
      if (this.isEdit) {
        await lastValueFrom(this.comisionService.updateConfig(this.config!.id, dto));
        this.alertService.showSuccess('Actualizado', 'Configuración actualizada');
      } else {
        await lastValueFrom(this.comisionService.createConfig(dto));
        this.alertService.showSuccess('Creado', 'Configuración creada correctamente');
      }
      this.saved.emit();
      this.close();
    } catch (err: any) {
      this.alertService.showError('Error', err?.message ?? 'No se pudo guardar');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  isInvalid(field: string): boolean {
    const c = this.frm.get(field);
    return !!(c?.invalid && c?.touched);
  }
}
