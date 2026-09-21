import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { StorageService } from '../../../../core/services/storage.service';
import {
  CambioUnidadPreviewModel,
  CategoriaContableProductoModel,
  CreateProductoDto,
  ProductoModel,
  TIPO_PRODUCTO_OPTIONS,
  TipoProducto,
  USO_PRODUCTO_OPTIONS,
  UpdateProductoDto,
  UsoProducto,
} from '../../../../core/models/producto.model';
import { ProductoService } from '../../../../core/services/producto.service';
import { CategoriaService } from '../../../../core/services/categoria.service';
import { MarcaService } from '../../../../core/services/marca.service';
import { UnidadMedidaService } from '../../../../core/services/unidad-medida.service';
import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { ProductoPresentacionService } from '../../../../core/services/producto-presentacion.service';
import {
  CreateProductoPresentacionDto,
  ProductoPresentacionModel,
  UpdateProductoPresentacionDto,
} from '../../../../core/models/producto-presentacion.model';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

// ─── Interfaz local para manejar presentaciones en el form ────────
export interface PresentacionFormItem {
  id?: number;
  nombre: string;
  factorConversion: number;
  codigoBarras: string | null;
  precio: number;
  costo: number;
  esDefaultCompra: boolean;
  esDefaultVenta: boolean;
  /** false = solo para comprar: el POS no la ofrece. */
  seVende: boolean;
  activo: boolean;
  _editando: boolean;
  _esNueva: boolean;
}

/** Nombres de empaque más comunes; el usuario puede escribir otro. */
const EMPAQUES_COMUNES = [
  'Caja',
  'Paca',
  'Bulto',
  'Display',
  'Sixpack',
  'Docena',
  'Cubeta',
  'Blíster',
  'Fardo',
  'Bolsa',
];

@Component({
  selector: 'app-form-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CheckboxModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    TabViewModule,
    TextareaModule,
    ButtonModule,
    DividerModule,
    ToastModule,
    ToggleSwitchModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './form-productos.component.html',
  styleUrls: ['./form-productos.component.scss'],
})
export class FormProductosComponent implements OnInit {
  /** Sale de la ruta: /catalogo/productos/editar/:id. Null al crear. */
  public productoId: number | null = null;

  // ─── Presentaciones ──────────────────────────────────────────────
  public presentaciones: PresentacionFormItem[] = [];
  public presentacionEnEdicion: PresentacionFormItem | null = null;
  public frmPresentacion!: FormGroup;
  public savingPresentacion = false;

  // ─── Pasar a unidad ──────────────────────────────────────────────
  public cambioUnidad: CambioUnidadPreviewModel | null = null;
  public cargandoCambioUnidad = false;
  public aplicandoCambioUnidad = false;
  public frmCambioUnidad!: FormGroup;

  // ─── Empaque de compra (la caja que trae N unidades) ─────────────
  public frmEmpaque!: FormGroup;
  /** Lo que tenía guardado el producto: si no se vende por unidad, el POS solo ofrece el empaque. */
  private vendePorUnidadGuardado = true;
  /** Presentación ya guardada que representa el empaque; null si aún no hay. */
  public empaqueItem: PresentacionFormItem | null = null;
  public readonly empaquesComunes = EMPAQUES_COMUNES.map((e) => ({
    label: e,
    value: e,
  }));

  // ─── Producto ────────────────────────────────────────────────────
  public frmProducto!: FormGroup;
  public isEditMode = false;
  public isSubmitting = false;
  public isLoading = false;
  public activeTab = 0;
  public imageError = false;
  public uploadingImage = false;
  public ivaValue = 0;
  // ─── Opciones de dropdowns ───────────────────────────────────────
  public tipoOptions = TIPO_PRODUCTO_OPTIONS;
  public usoOptions = USO_PRODUCTO_OPTIONS;
  public categoriasOpts: { label: string; value: number | null }[] = [
    { label: 'Sin categoría', value: null },
  ];
  public marcasOpts: { label: string; value: number | null }[] = [
    { label: 'Sin marca', value: null },
  ];
  public unidadesOpts: { label: string; value: number }[] = [];

  // ─── Contabilidad ────────────────────────────────────────────────
  public categoriasContables: CategoriaContableProductoModel[] = [];
  public categoriasContablesOpts: { label: string; value: number | null }[] = [
    { label: 'General (por defecto)', value: null },
  ];
  public cuentasIngresoOpts: { label: string; value: number }[] = [];
  public cuentasCostoOpts: { label: string; value: number }[] = [];
  public cuentasInventarioOpts: { label: string; value: number }[] = [];
  public mostrarCuentasAvanzadas = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly presentacionService: ProductoPresentacionService,
    private readonly confirmService: ConfirmationService,
    private readonly productoService: ProductoService,
    private readonly categoriaService: CategoriaService,
    private readonly marcaService: MarcaService,
    private readonly unidadMedidaService: UnidadMedidaService,
    private readonly contabilidadService: ContabilidadService,
    private readonly alertService: AlertService,
    private readonly storageService: StorageService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initFrmPresentacion();
    this.initFrmEmpaque();
    this.frmCambioUnidad = this.fb.group({
      unidadMedidaId: [null, Validators.required],
      nombrePresentacion: ['', [Validators.required, Validators.maxLength(100)]],
    });
    this.loadDropdowns();
    this.loadContabilidad();

    const id = Number(this.route.snapshot.params['id']);
    this.productoId = id > 0 ? id : null;
    this.isEditMode = !!this.productoId;
    if (this.isEditMode) {
      this.loadData(this.productoId!);
      this.loadPresentaciones(this.productoId!);
    }
  }

  // ─── Form producto ───────────────────────────────────────────────
  private initForm(): void {
    this.frmProducto = this.fb.group({
      nombre: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
        ],
      ],
      sku: [null, [Validators.maxLength(50)]],
      codigoBarras: [null, [Validators.maxLength(50)]],
      descripcion: [null, [Validators.maxLength(500)]],
      categoriaId: [null],
      marcaId: [null],
      unidadMedidaBaseId: [null, Validators.required],
      tipoProducto: ['ESTANDAR', Validators.required],
      usoProducto: ['VENTA', Validators.required],
      imagenUrl: [null, [Validators.maxLength(500)]],
      activo: [true, Validators.required],
      // precio y costo se derivan de la presentación de compra (Tab 4)
      precio: [0, [Validators.min(0)]],
      costo: [0, [Validators.min(0)]],
      precio2: [null, [Validators.min(0)]],
      precio3: [null, [Validators.min(0)]],
      ivaPorcentaje: [
        0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      ivaIncluido: [false],
      impoconsumo: [0, [Validators.required, Validators.min(0)]],
      manejaInventario: [true, Validators.required],
      manejaLotes: [false, Validators.required],
      manejaSerial: [false, Validators.required],
      /** Meses de garantía al cliente; se anotan en el serial al vender. */
      mesesGarantia: [null as number | null, [Validators.min(0), Validators.max(120)]],
      permitirStockNegativo: [false, Validators.required],
      visibleEnPos: [true, Validators.required],
      categoriaContableId: [null],
      cuentaIngresoId: [null],
      cuentaCostoId: [null],
      cuentaInventarioId: [null],
    });

    this.frmProducto.get('manejaInventario')?.valueChanges.subscribe((val) => {
      const subControls = [
        'manejaLotes',
        'manejaSerial',
        'permitirStockNegativo',
      ];
      if (!val) {
        this.frmProducto.patchValue({
          manejaLotes: false,
          manejaSerial: false,
          permitirStockNegativo: false,
        });
        subControls.forEach((c) =>
          this.frmProducto.get(c)?.disable({ emitEvent: false }),
        );
      } else {
        subControls.forEach((c) =>
          this.frmProducto.get(c)?.enable({ emitEvent: false }),
        );
      }
    });
    this.frmProducto.get('ivaPorcentaje')?.valueChanges.subscribe((val) => {
      if (!val || val <= 0) {
        this.frmProducto.patchValue(
          { ivaIncluido: false },
          { emitEvent: false },
        );
      }
    });
    this.frmProducto
      .get('usoProducto')
      ?.valueChanges.subscribe((uso: UsoProducto) =>
        this.sincronizarUso(uso, !this.isEditMode),
      );
  }

  /**
   * Un insumo nunca se vende en el POS: se apaga y bloquea "Visible en POS".
   * Al crear, si no hay categoría contable elegida, se propone la de insumos.
   */
  private sincronizarUso(uso: UsoProducto, proponerCategoria: boolean): void {
    const visible = this.frmProducto.get('visibleEnPos');
    if (uso !== 'INSUMO') {
      visible?.enable({ emitEvent: false });
      return;
    }

    visible?.setValue(false, { emitEvent: false });
    visible?.disable({ emitEvent: false });

    if (
      proponerCategoria &&
      !this.frmProducto.get('categoriaContableId')?.value
    ) {
      const insumos = this.categoriasContables.find(
        (c) => c.tipo === 'INSUMO' && c.activo,
      );
      if (insumos)
        this.frmProducto.patchValue(
          { categoriaContableId: insumos.id },
          { emitEvent: false },
        );
    }
  }

  private resetForm(): void {
    this.frmProducto?.reset({
      nombre: null,
      sku: null,
      codigoBarras: null,
      descripcion: null,
      categoriaId: null,
      marcaId: null,
      unidadMedidaBaseId: null,
      tipoProducto: 'ESTANDAR',
      usoProducto: 'VENTA',
      imagenUrl: null,
      activo: true,
      precio: 0,
      costo: 0,
      precio2: null,
      precio3: null,
      ivaPorcentaje: 0,
      ivaIncluido: false,
      impoconsumo: 0,
      // precio y costo se recalculan desde la presentación de compra
      manejaInventario: true,
      manejaLotes: false,
      manejaSerial: false,
      permitirStockNegativo: false,
      visibleEnPos: true,
      categoriaContableId: null,
      cuentaIngresoId: null,
      cuentaCostoId: null,
      cuentaInventarioId: null,
    });
    this.frmProducto?.get('visibleEnPos')?.enable({ emitEvent: false });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.frmProducto.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
  get ivaActivo(): boolean {
    // Del form y no de ivaValue: al editar, el IVA llega por patchValue sin input.
    return (this.frmProducto.get('ivaPorcentaje')?.value ?? 0) > 0;
  }

  /**
   * Tarifas de IVA del selector. Es propiedad y no getter: un arreglo nuevo en
   * cada ciclo de detección de cambios re-renderiza el dropdown sin parar.
   */
  public ivaOptions = this.tarifasIva();

  private tarifasIva(extra?: number): { label: string; value: number }[] {
    const tarifas = [0, 5, 19];
    if (extra != null && !isNaN(extra) && !tarifas.includes(extra))
      tarifas.push(extra);
    return tarifas
      .sort((a, b) => a - b)
      .map((t) => ({ label: `${t} %`, value: t }));
  }

  /** Si el producto guardado tiene una tarifa distinta, se agrega a la lista. */
  private actualizarTarifasIva(): void {
    this.ivaOptions = this.tarifasIva(
      Number(this.frmProducto.get('ivaPorcentaje')?.value ?? 0),
    );
  }

  /** La unidad de inventario también se elige en la frase del empaque. */
  get unidadControl(): FormControl {
    return this.frmProducto.get('unidadMedidaBaseId') as FormControl;
  }
  onIvaInput(event: any): void {
    this.ivaValue = event.value ?? 0;
  }

  get esInsumo(): boolean {
    return this.frmProducto.get('usoProducto')?.value === 'INSUMO';
  }

  get usoDescripcion(): string {
    const uso = this.frmProducto.get('usoProducto')?.value;
    return this.usoOptions.find((o) => o.value === uso)?.desc ?? '';
  }

  /** La categoría que realmente aplica: la elegida o, sin elegir, "General". */
  get categoriaEfectiva(): CategoriaContableProductoModel | null {
    const id = this.frmProducto.get('categoriaContableId')?.value;
    return (
      this.categoriasContables.find((c) =>
        id ? c.id === id : c.nombre === 'General',
      ) ?? null
    );
  }

  // ─── Form presentaciones ─────────────────────────────────────────
  private initFrmPresentacion(): void {
    this.frmPresentacion = this.fb.group({
      nombre: [null, [Validators.required, Validators.maxLength(100)]],
      factorConversion: [1, [Validators.required, Validators.min(0.0001)]],
      codigoBarras: [null, [Validators.maxLength(50)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      costo: [0, [Validators.required, Validators.min(0)]],
      esDefaultCompra: [false],
      esDefaultVenta: [false],
    });

    // Cuando cambia el factor → recalcular precio y costo sugeridos
    this.frmPresentacion
      .get('factorConversion')
      ?.valueChanges.subscribe((factor) => {
        if (!factor || factor <= 0) return;
        const precioBase = this.frmProducto.get('precio')?.value ?? 0;
        const costoBase = this.frmProducto.get('costo')?.value ?? 0;
        // Solo sugerir si ya hay un precio base calculado (de una presentación de compra previa)
        if (precioBase > 0 || costoBase > 0) {
          this.frmPresentacion.patchValue(
            {
              precio: Math.round(precioBase * factor),
              costo: Math.round(costoBase * factor),
            },
            { emitEvent: false },
          );
        }
      });
  }

  // ─── Cargar presentaciones existentes ────────────────────────────
  private async loadPresentaciones(productoId: number): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.presentacionService.listByProducto(productoId),
      );
      if (res?.data) {
        this.presentaciones = (res.data as ProductoPresentacionModel[]).map(
          (p) => ({
            id: p.id,
            nombre: p.nombre,
            factorConversion: p.factorConversion,
            codigoBarras: p.codigoBarras,
            precio: p.precio,
            costo: p.costo,
            esDefaultCompra: p.esDefaultCompra ?? false,
            esDefaultVenta: p.esDefaultVenta ?? false,
            seVende: p.seVende ?? true,
            activo: p.activo,
            _editando: false,
            _esNueva: false,
          }),
        );
        this.cargarEmpaque();
      }
    } catch {
      /* no bloquear */
    }
  }

  // ─── Agregar nueva presentación (fila en edición) ─────────────────
  agregarPresentacion(): void {
    this.presentaciones.forEach((p) => (p._editando = false));

    // Precargar precio/costo base si ya están calculados de una presentación de compra previa
    const precioBase = this.frmProducto.get('precio')?.value ?? 0;
    const costoBase = this.frmProducto.get('costo')?.value ?? 0;

    const nueva: PresentacionFormItem = {
      nombre: '',
      factorConversion: 1,
      codigoBarras: null,
      precio: precioBase,
      costo: costoBase,
      esDefaultCompra: false,
      esDefaultVenta: false,
      seVende: true,
      activo: true,
      _editando: true,
      _esNueva: true,
    };
    this.presentaciones = [...this.presentaciones, nueva];
    this.presentacionEnEdicion = nueva;
    this.frmPresentacion.reset({
      nombre: null,
      factorConversion: 1,
      codigoBarras: null,
      precio: precioBase,
      costo: costoBase,
      esDefaultCompra: false,
      esDefaultVenta: false,
    });
  }

  // ─── Abrir edición de una presentación existente ──────────────────
  editarPresentacion(item: PresentacionFormItem): void {
    this.presentaciones.forEach((p) => (p._editando = false));
    item._editando = true;
    this.presentacionEnEdicion = item;
    this.frmPresentacion.patchValue({
      nombre: item.nombre,
      factorConversion: item.factorConversion,
      codigoBarras: item.codigoBarras,
      precio: item.precio,
      costo: item.costo,
      esDefaultCompra: item.esDefaultCompra,
      esDefaultVenta: item.esDefaultVenta,
    });
  }

  // ─── Cancelar edición ────────────────────────────────────────────
  cancelarEdicion(item: PresentacionFormItem): void {
    if (item._esNueva) {
      this.presentaciones = this.presentaciones.filter((p) => p !== item);
    } else {
      item._editando = false;
    }
    this.presentacionEnEdicion = null;
  }

  // ─── Guardar presentación (en memoria o en API) ───────────────────
  async guardarPresentacion(item: PresentacionFormItem): Promise<void> {
    if (this.frmPresentacion.invalid) {
      this.frmPresentacion.markAllAsTouched();
      return;
    }

    const v = this.frmPresentacion.value;

    // Validar factor duplicado en memoria
    const factorDuplicado = this.presentaciones.some(
      (p) => p !== item && p.factorConversion === v.factorConversion,
    );
    if (factorDuplicado) {
      this.alertService.showWarn(
        'Factor duplicado',
        'Ya existe una presentación con ese factor de conversión.',
      );
      return;
    }

    // Si se marca como default → desmarcar las demás en memoria
    if (v.esDefaultCompra) {
      this.presentaciones.forEach((p) => {
        if (p !== item) p.esDefaultCompra = false;
      });
    }
    if (v.esDefaultVenta) {
      this.presentaciones.forEach((p) => {
        if (p !== item) p.esDefaultVenta = false;
      });
    }

    // Modo crear — solo guardar en memoria hasta que se guarde el producto
    if (!this.isEditMode || !this.productoId) {
      item.nombre = v.nombre;
      item.factorConversion = v.factorConversion;
      item.codigoBarras = v.codigoBarras || null;
      item.precio = v.precio;
      item.costo = v.costo;
      item.esDefaultCompra = v.esDefaultCompra;
      item.esDefaultVenta = v.esDefaultVenta;
      item._editando = false;
      item._esNueva = true;
      this.presentacionEnEdicion = null;
      return;
    }

    // Modo edición — persistir en API
    this.savingPresentacion = true;
    try {
      let res: any;

      if (item._esNueva) {
        const dto: CreateProductoPresentacionDto = {
          productoId: this.productoId!,
          nombre: v.nombre,
          factorConversion: v.factorConversion,
          codigoBarras: v.codigoBarras || null,
          precio: v.precio,
          costo: v.costo,
          esDefaultCompra: v.esDefaultCompra,
          esDefaultVenta: v.esDefaultVenta,
          activo: true,
        };
        res = await lastValueFrom(this.presentacionService.create(dto));
        if (res?.data) item.id = res.data.id;
      } else {
        const dto: UpdateProductoPresentacionDto = {
          nombre: v.nombre,
          factorConversion: v.factorConversion,
          codigoBarras: v.codigoBarras || null,
          precio: v.precio,
          costo: v.costo,
          esDefaultCompra: v.esDefaultCompra,
          esDefaultVenta: v.esDefaultVenta,
          activo: item.activo,
        };
        res = await lastValueFrom(
          this.presentacionService.update(item.id!, dto),
        );
      }

      // Sincronizar item local con valores guardados
      item.nombre = v.nombre;
      item.factorConversion = v.factorConversion;
      item.codigoBarras = v.codigoBarras || null;
      item.precio = v.precio;
      item.costo = v.costo;
      item.esDefaultCompra = v.esDefaultCompra;
      item.esDefaultVenta = v.esDefaultVenta;
      item._editando = false;
      item._esNueva = false;
      this.presentacionEnEdicion = null;

      this.alertService.showSuccess(
        'Presentación guardada',
        res?.message ?? 'OK',
      );
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.message ?? 'No se pudo guardar la presentación.',
      );
    } finally {
      this.savingPresentacion = false;
    }
  }

  // ─── Confirmar eliminación ────────────────────────────────────────
  confirmarEliminarPresentacion(item: PresentacionFormItem): void {
    if (item._esNueva) {
      this.presentaciones = this.presentaciones.filter((p) => p !== item);
      return;
    }
    this.confirmService.confirm({
      message: `¿Eliminar la presentación "${item.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminarPresentacion(item),
    });
  }

  private async eliminarPresentacion(
    item: PresentacionFormItem,
  ): Promise<void> {
    try {
      await lastValueFrom(this.presentacionService.delete(item.id!));
      this.presentaciones = this.presentaciones.filter((p) => p !== item);
      this.alertService.showSuccess(
        'Eliminada',
        'Presentación eliminada correctamente.',
      );
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.message ?? 'No se pudo eliminar.',
      );
    }
  }

  // ─── Pasar a unidad ──────────────────────────────────────────────
  /**
   * Una presentación que contiene menos de 1 unidad base es más pequeña que la
   * base (la UNIDAD de una paca): el inventario se puede pasar a contar en ella.
   */
  puedePasarAUnidad(item: PresentacionFormItem): boolean {
    return (
      this.isEditMode &&
      !item._esNueva &&
      !!item.id &&
      item.activo &&
      item.factorConversion > 0 &&
      item.factorConversion < 1
    );
  }

  get unidadCambioNombre(): string {
    const id = this.frmCambioUnidad?.get('unidadMedidaId')?.value;
    return this.unidadesOpts.find((u) => u.value === id)?.label ?? '';
  }

  async verCambioUnidad(item: PresentacionFormItem): Promise<void> {
    if (!this.productoId || !item.id) return;
    this.cargandoCambioUnidad = true;
    try {
      const res = await lastValueFrom(
        this.productoService.previewCambioUnidad(this.productoId, item.id),
      );
      this.cambioUnidad = res?.data ?? null;
      if (this.cambioUnidad) {
        this.frmCambioUnidad.reset({
          unidadMedidaId: this.cambioUnidad.unidadSugeridaId,
          nombrePresentacion: this.cambioUnidad.nombrePresentacionSugerido,
        });
      }
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? e?.message ?? 'No se pudo preparar el cambio.',
      );
    } finally {
      this.cargandoCambioUnidad = false;
    }
  }

  cancelarCambioUnidad(): void {
    this.cambioUnidad = null;
  }

  confirmarCambioUnidad(): void {
    const preview = this.cambioUnidad;
    if (!preview?.puedeAplicar) return;
    if (this.frmCambioUnidad.invalid) {
      this.frmCambioUnidad.markAllAsTouched();
      return;
    }
    this.confirmService.confirm({
      message:
        `El inventario de "${preview.productoNombre}" pasará a contarse en ` +
        `${this.unidadCambioNombre || preview.presentacionNombre} (1 ${preview.unidadActualNombre} = ${preview.factor}). ` +
        'No se deshace desde la pantalla. ¿Continuar?',
      header: 'Pasar a unidad',
      icon: 'pi pi-sync',
      acceptLabel: 'Pasar a unidad',
      rejectLabel: 'Cancelar',
      accept: () => this.aplicarCambioUnidad(preview),
    });
  }

  private async aplicarCambioUnidad(
    preview: CambioUnidadPreviewModel,
  ): Promise<void> {
    this.aplicandoCambioUnidad = true;
    try {
      const v = this.frmCambioUnidad.value;
      await lastValueFrom(
        this.productoService.aplicarCambioUnidad(preview.productoId, {
          presentacionId: preview.presentacionId,
          unidadMedidaId: v.unidadMedidaId,
          nombrePresentacion: (v.nombrePresentacion ?? '').trim(),
        }),
      );
      this.cambioUnidad = null;
      await Promise.all([
        this.loadData(preview.productoId),
        this.loadPresentaciones(preview.productoId),
      ]);
      this.alertService.showSuccess(
        'Listo',
        'El inventario ahora se cuenta en la unidad nueva.',
      );
    } catch (e: any) {
      this.alertService.showError(
        'No se pudo',
        e?.error?.message ?? e?.message ?? 'No se pudo pasar a unidad.',
      );
    } finally {
      this.aplicandoCambioUnidad = false;
    }
  }

  // ─── Empaque de compra ───────────────────────────────────────────
  private initFrmEmpaque(): void {
    this.frmEmpaque = this.fb.group({
      usaEmpaque: [false],
      nombre: ['Caja', [Validators.maxLength(100)]],
      trae: [null as number | null, [Validators.min(1)]],
      costoEmpaque: [null as number | null, [Validators.min(0)]],
      precioEmpaque: [null as number | null, [Validators.min(0)]],
      codigoBarras: [null as string | null, [Validators.maxLength(50)]],
      vendeSuelto: [true],
      vendeEmpaque: [true],
    });

    // El costo por unidad sale del empaque: nadie tiene que dividir a mano.
    const recalcularCosto = () => {
      const costo = this.costoUnidadEmpaque;
      if (this.usaEmpaque && costo != null)
        this.frmProducto.patchValue({ costo }, { emitEvent: false });
    };
    this.frmEmpaque.get('trae')?.valueChanges.subscribe(recalcularCosto);
    this.frmEmpaque.get('costoEmpaque')?.valueChanges.subscribe(recalcularCosto);
    this.frmEmpaque.get('usaEmpaque')?.valueChanges.subscribe(recalcularCosto);
  }

  get usaEmpaque(): boolean {
    return !!this.frmEmpaque?.get('usaEmpaque')?.value;
  }

  get vendeSuelto(): boolean {
    return !!this.frmEmpaque?.get('vendeSuelto')?.value;
  }

  get vendeEmpaque(): boolean {
    return !!this.frmEmpaque?.get('vendeEmpaque')?.value;
  }

  get costoEmpaqueValor(): number {
    return Number(this.frmEmpaque?.get('costoEmpaque')?.value) || 0;
  }

  setUsaEmpaque(valor: boolean): void {
    this.frmEmpaque.get('usaEmpaque')?.setValue(valor);
    // Sin empaque solo se puede vender por unidad.
    if (!valor) this.frmEmpaque.get('vendeSuelto')?.setValue(true);
  }

  setVendeSuelto(valor: boolean): void {
    this.frmEmpaque.get('vendeSuelto')?.setValue(valor);
  }

  get traeEmpaque(): number {
    return Number(this.frmEmpaque?.get('trae')?.value) || 0;
  }

  get nombreEmpaque(): string {
    const nombre = `${this.frmEmpaque?.get('nombre')?.value ?? ''}`.trim();
    return nombre || 'el empaque';
  }

  /** Abreviatura de la unidad de inventario para las frases ("trae 10 und"). */
  get unidadBaseCorta(): string {
    const label = this.unidadBaseNombre;
    const abreviatura = /\(([^)]+)\)\s*$/.exec(label)?.[1];
    return (abreviatura ?? label).toLowerCase();
  }

  /** Costo de una unidad de inventario: costo del empaque ÷ lo que trae. */
  get costoUnidadEmpaque(): number | null {
    const costo = Number(this.frmEmpaque?.get('costoEmpaque')?.value);
    const trae = this.traeEmpaque;
    if (!trae || isNaN(costo) || costo < 0) return null;
    return Math.round((costo / trae) * 100) / 100;
  }

  /** Precio del empaque completo si se deja vacío: precio suelto × lo que trae. */
  get precioEmpaqueSugerido(): number {
    return Math.round(this.precioFinalTotal * this.traeEmpaque);
  }

  /** Las presentaciones que no son el empaque principal (sección avanzada). */
  get presentacionesAdicionales(): PresentacionFormItem[] {
    return this.presentaciones.filter((p) => p !== this.empaqueItem);
  }

  private get errorEmpaque(): string | null {
    if (!this.usaEmpaque) return null;
    const v = this.frmEmpaque.value;
    if (!`${v.nombre ?? ''}`.trim())
      return 'Escribe cómo se llama el empaque (caja, paca, bulto…).';
    if (!v.trae || v.trae <= 1)
      return 'Indica cuántas unidades trae el empaque (más de 1).';
    if (v.costoEmpaque === null || v.costoEmpaque === undefined || v.costoEmpaque === '')
      return 'Escribe el costo del empaque.';
    if (!v.vendeSuelto && !v.vendeEmpaque)
      return 'Elige al menos una forma de venta: por unidad o empaque completo.';
    return null;
  }

  /** Toma como empaque la presentación de compra que contiene más de 1 unidad. */
  private cargarEmpaque(): void {
    const empaque =
      this.presentaciones.find(
        (p) => p.activo && p.esDefaultCompra && p.factorConversion > 1,
      ) ??
      this.presentaciones.find((p) => p.activo && p.factorConversion > 1) ??
      null;
    this.empaqueItem = empaque;
    this.frmEmpaque.reset(
      {
        usaEmpaque: !!empaque,
        nombre: empaque?.nombre ?? 'Caja',
        trae: empaque?.factorConversion ?? null,
        costoEmpaque: empaque?.costo ?? null,
        precioEmpaque: empaque?.precio || null,
        codigoBarras: empaque?.codigoBarras ?? null,
        vendeSuelto: empaque ? this.vendePorUnidadGuardado : true,
        vendeEmpaque: empaque ? empaque.seVende !== false : true,
      },
      { emitEvent: false },
    );
  }

  /** Crea, actualiza o retira la presentación del empaque. Devuelve el error, si hubo. */
  private async guardarEmpaque(productoId: number): Promise<string | null> {
    const v = this.frmEmpaque.getRawValue();
    try {
      if (!v.usaEmpaque) {
        if (this.empaqueItem?.id) {
          const e = this.empaqueItem;
          await lastValueFrom(
            this.presentacionService.update(e.id!, {
              nombre: e.nombre,
              codigoBarras: e.codigoBarras,
              factorConversion: e.factorConversion,
              precio: e.precio,
              costo: e.costo,
              esDefaultCompra: false,
              esDefaultVenta: false,
              activo: false,
            }),
          );
        }
        return null;
      }

      const dto: UpdateProductoPresentacionDto = {
        nombre: `${v.nombre}`.trim(),
        codigoBarras: v.codigoBarras?.trim() || null,
        factorConversion: Number(v.trae),
        precio: v.vendeEmpaque
          ? Number(v.precioEmpaque) || this.precioEmpaqueSugerido
          : Number(v.precioEmpaque) || 0,
        costo: Number(v.costoEmpaque) || 0,
        esDefaultCompra: true,
        esDefaultVenta: !!v.vendeEmpaque && !v.vendeSuelto,
        seVende: !!v.vendeEmpaque,
        activo: true,
      };
      if (this.empaqueItem?.id) {
        await lastValueFrom(
          this.presentacionService.update(this.empaqueItem.id, dto),
        );
      } else {
        await lastValueFrom(
          this.presentacionService.create({ productoId, ...dto }),
        );
      }
      return null;
    } catch (e: any) {
      return (
        e?.error?.message ?? e?.message ?? 'No se pudo guardar el empaque.'
      );
    }
  }

  // ─── Guardar presentaciones pendientes al crear el producto ───────
  private async guardarPresentacionesPendientes(
    productoId: number,
  ): Promise<void> {
    const pendientes = this.presentaciones.filter((p) => p._esNueva);
    for (const p of pendientes) {
      try {
        await lastValueFrom(
          this.presentacionService.create({
            productoId,
            nombre: p.nombre,
            factorConversion: p.factorConversion,
            codigoBarras: p.codigoBarras,
            precio: p.precio,
            costo: p.costo,
            esDefaultCompra: p.esDefaultCompra,
            esDefaultVenta: p.esDefaultVenta,
            activo: true,
          }),
        );
      } catch {
        /* no bloquear flujo principal */
      }
    }
  }

  // ─── Cargar dropdowns ────────────────────────────────────────────
  private async loadDropdowns(): Promise<void> {
    try {
      const [cats, marcas, unidades] = await Promise.all([
        lastValueFrom(this.categoriaService.list()),
        lastValueFrom(this.marcaService.list()),
        lastValueFrom(this.unidadMedidaService.list()),
      ]);

      if (cats?.data)
        this.categoriasOpts = [
          { label: 'Sin categoría', value: null },
          ...cats.data.map((c) => ({ label: c.nombre, value: c.id })),
        ];

      if (marcas?.data)
        this.marcasOpts = [
          { label: 'Sin marca', value: null },
          ...marcas.data.map((m) => ({ label: m.nombre, value: m.id })),
        ];

      if (unidades?.data)
        this.unidadesOpts = unidades.data.map((u) => ({
          label: `${u.nombre} (${u.abreviatura})`,
          value: u.id,
        }));
    } catch {
      /* no bloquear el form */
    }
  }

  /**
   * Categorías contables y cuentas auxiliares para la pestaña Contabilidad.
   * Va aparte de los demás dropdowns: un usuario sin acceso a contabilidad
   * debe poder seguir creando productos (heredan la categoría General).
   */
  private async loadContabilidad(): Promise<void> {
    try {
      const [categorias, plan] = await Promise.all([
        lastValueFrom(this.contabilidadService.listarCategoriasProducto()),
        lastValueFrom(this.contabilidadService.listarPlan()),
      ]);

      this.categoriasContables = categorias?.data ?? [];
      this.categoriasContablesOpts = [
        { label: 'General (por defecto)', value: null },
        ...this.categoriasContables
          .filter((c) => c.activo && c.nombre !== 'General')
          .map((c) => ({ label: c.nombre, value: c.id })),
      ];

      // Mismas reglas de clase que valida el backend.
      const auxiliares = (plan?.data ?? []).filter(
        (c) => c.auxiliar && c.activa,
      );
      const opciones = (...prefijos: string[]) =>
        auxiliares
          .filter((c) => prefijos.some((p) => c.codigo?.startsWith(p)))
          .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));

      this.cuentasIngresoOpts = opciones('4');
      this.cuentasCostoOpts = opciones('5', '6', '7');
      this.cuentasInventarioOpts = opciones('14');
    } catch {
      /* sin permisos de contabilidad: el producto hereda la categoría General */
    }
  }

  // ─── Cargar datos en modo edición ────────────────────────────────
  private async loadData(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await lastValueFrom(this.productoService.getById(id));
      if (response?.status === 200 && response?.data) {
        this.patchForm(response.data);
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el producto.');
      this.volver();
    } finally {
      this.isLoading = false;
    }
  }

  private patchForm(d: ProductoModel): void {
    setTimeout(() => {
      this.frmProducto.patchValue(
        {
          nombre: d.nombre,
          sku: d.sku,
          codigoBarras: d.codigoBarras,
          descripcion: d.descripcion,
          categoriaId: d.categoriaId,
          marcaId: d.marcaId,
          unidadMedidaBaseId: d.unidadMedidaBaseId,
          tipoProducto: d.tipoProducto,
          usoProducto: d.usoProducto ?? 'VENTA',
          imagenUrl: d.imagenUrl,
          activo: d.activo,
          precio: d.precio,
          costo: d.costo,
          precio2: d.precio2 ?? null,
          precio3: d.precio3 ?? null,
          ivaPorcentaje: d.ivaPorcentaje,
          ivaIncluido: d.ivaIncluido,
          impoconsumo: d.impoconsumo,
          manejaInventario: d.manejaInventario,
          manejaLotes: d.manejaLotes,
          manejaSerial: d.manejaSerial,
          mesesGarantia: d.mesesGarantia ?? null,
          permitirStockNegativo: d.permitirStockNegativo,
          visibleEnPos: d.visibleEnPos,
          categoriaContableId: d.categoriaContableId ?? null,
          cuentaIngresoId: d.cuentaIngresoId ?? null,
          cuentaCostoId: d.cuentaCostoId ?? null,
          cuentaInventarioId: d.cuentaInventarioId ?? null,
        },
        { emitEvent: false },
      );
      this.actualizarTarifasIva();
      this.vendePorUnidadGuardado = d.vendePorUnidad ?? true;
      if (this.empaqueItem)
        this.frmEmpaque.patchValue(
          { vendeSuelto: this.vendePorUnidadGuardado },
          { emitEvent: false },
        );
      this.sincronizarUso(d.usoProducto ?? 'VENTA', false);
      // Si el producto ya tiene cuentas propias, se muestran de una vez.
      this.mostrarCuentasAvanzadas = !!(
        d.cuentaIngresoId ||
        d.cuentaCostoId ||
        d.cuentaInventarioId
      );
      // Sync enable/disable state for inventory sub-controls
      const subControls = [
        'manejaLotes',
        'manejaSerial',
        'permitirStockNegativo',
      ];
      if (!d.manejaInventario) {
        subControls.forEach((c) =>
          this.frmProducto.get(c)?.disable({ emitEvent: false }),
        );
      } else {
        subControls.forEach((c) =>
          this.frmProducto.get(c)?.enable({ emitEvent: false }),
        );
      }
    }, 0.5);
  }

  // ─── Guardar producto ────────────────────────────────────────────
  async saveProducto(): Promise<void> {
    const errorEmpaque = this.errorEmpaque;
    if (this.frmProducto.invalid || errorEmpaque) {
      this.frmProducto.markAllAsTouched();
      // Llevar a la pestaña donde está el error.
      const basico = ['nombre', 'unidadMedidaBaseId', 'tipoProducto', 'usoProducto'];
      const precios = ['ivaPorcentaje', 'impoconsumo', 'precio', 'costo'];
      if (basico.some((f) => this.frmProducto.get(f)?.invalid)) this.activeTab = 0;
      else if (errorEmpaque || precios.some((f) => this.frmProducto.get(f)?.invalid))
        this.activeTab = 1;
      this.alertService.showWarn(
        'Formulario incompleto',
        errorEmpaque ?? 'Revisa los campos marcados en rojo.',
      );
      return;
    }

    this.isSubmitting = true;
    try {
      const dto = this.buildDto();
      const obs = this.isEditMode
        ? this.productoService.update(
            this.productoId!,
            dto as UpdateProductoDto,
          )
        : this.productoService.create(dto);

      const response = await lastValueFrom(obs);

      if (response?.status === 200 || response?.status === 201) {
        const productoId = this.isEditMode
          ? this.productoId!
          : (response?.data?.id ?? null);

        // Si es nuevo y hay presentaciones pendientes, guardarlas ahora
        if (!this.isEditMode && productoId && this.presentaciones.length > 0) {
          await this.guardarPresentacionesPendientes(productoId);
        }

        const errorGuardandoEmpaque = productoId
          ? await this.guardarEmpaque(productoId)
          : null;
        if (errorGuardandoEmpaque) {
          this.alertService.showWarn(
            'El producto se guardó, el empaque no',
            errorGuardandoEmpaque,
          );
          // Queda en la edición del producto para corregir el empaque.
          if (!this.isEditMode && productoId)
            this.router.navigate(['/catalogo/productos/editar', productoId]);
          return;
        }

        this.alertService.showSuccess(
          this.isEditMode ? 'Producto actualizado' : 'Producto creado',
          response.message,
        );
        this.volver();
      }
    } catch (error: any) {
      this.alertService.showError(
        'Error al guardar',
        error?.message ?? 'No se pudo guardar el producto.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  volver(): void {
    this.router.navigate(['/catalogo/productos']);
  }

  // ─── Helpers ─────────────────────────────────────────────────────
  private buildDto(): CreateProductoDto {
    const v = this.frmProducto.getRawValue();
    const uso = (v.usoProducto ?? 'VENTA') as UsoProducto;
    return {
      nombre: v.nombre?.trim(),
      sku: v.sku?.trim() || null,
      codigoBarras: v.codigoBarras?.trim() || null,
      descripcion: v.descripcion?.trim() || null,
      imagenUrl: v.imagenUrl?.trim() || null,
      categoriaId: v.categoriaId ?? null,
      marcaId: v.marcaId ?? null,
      unidadMedidaBaseId: v.unidadMedidaBaseId,
      tipoProducto: v.tipoProducto as TipoProducto,
      usoProducto: uso,
      activo: v.activo,
      precio: v.precio ?? 0,
      costo: v.costo ?? 0,
      precio2: v.precio2 ?? null,
      precio3: v.precio3 ?? null,
      ivaPorcentaje: v.ivaPorcentaje ?? 0,
      ivaIncluido: v.ivaIncluido ?? false,
      impoconsumo: v.impoconsumo ?? 0,
      manejaInventario: v.manejaInventario,
      manejaLotes: v.manejaLotes,
      manejaSerial: v.manejaSerial,
      // 0 = sin garantía (null lo dejaría como estaba en el back).
      mesesGarantia: v.mesesGarantia ?? 0,
      permitirStockNegativo: v.permitirStockNegativo ?? false,
      visibleEnPos: uso === 'INSUMO' ? false : (v.visibleEnPos ?? true),
      // Sin empaque siempre se vende por unidad; con empaque, lo que diga "Por unidad".
      vendePorUnidad:
        !this.usaEmpaque || !!this.frmEmpaque.getRawValue().vendeSuelto,
      categoriaContableId: v.categoriaContableId ?? null,
      cuentaIngresoId: v.cuentaIngresoId ?? null,
      cuentaCostoId: v.cuentaCostoId ?? null,
      cuentaInventarioId: v.cuentaInventarioId ?? null,
    };
  }

  get margenUtilidad(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const costo = this.frmProducto.get('costo')?.value ?? 0;
    if (!costo || !precio) return 0;
    return Math.round(((precio - costo) / precio) * 100 * 10) / 10;
  }

  get ivaIncluidoValue(): boolean {
    return this.frmProducto.get('ivaIncluido')?.value ?? false;
  }

  /** Precio base sin IVA: si ivaIncluido=true, extrae la base; si no, es el mismo precio */
  get precioBaseSinIva(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const iva = this.frmProducto.get('ivaPorcentaje')?.value ?? 0;
    if (!this.ivaIncluidoValue || !iva) return precio;
    return Math.round(precio / (1 + iva / 100));
  }

  /** Monto del IVA calculado */
  get ivaCalculado(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const iva = this.frmProducto.get('ivaPorcentaje')?.value ?? 0;
    if (!iva) return 0;
    if (this.ivaIncluidoValue) {
      return precio - this.precioBaseSinIva;
    }
    return Math.round((precio * iva) / 100);
  }

  /** Precio final que paga el cliente */
  get precioFinalTotal(): number {
    const precio = this.frmProducto.get('precio')?.value ?? 0;
    const impoconsumo = this.frmProducto.get('impoconsumo')?.value ?? 0;
    if (this.ivaIncluidoValue) {
      return precio + impoconsumo;
    }
    return precio + this.ivaCalculado + impoconsumo;
  }

  get manejaInventarioValue(): boolean {
    return this.frmProducto.get('manejaInventario')?.value ?? true;
  }

  get unidadBaseNombre(): string {
    const id = this.frmProducto.get('unidadMedidaBaseId')?.value;
    return (
      this.unidadesOpts.find((u) => u.value === id)?.label ?? 'unidad base'
    );
  }

  // ─── Preview de imagen ────────────────────────────────────────────
  onImageUrlChange(): void {
    this.imageError = false;
  }
  onImageError(_event: Event): void {
    this.imageError = true;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!input.files) return;
    input.value = ''; // reset para permitir seleccionar el mismo archivo

    if (!file) return;

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ];
    if (!tiposPermitidos.includes(file.type)) {
      this.alertService.showError(
        'Formato inválido',
        'Solo se permiten imágenes JPG, PNG, WebP, GIF o AVIF.',
      );
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.alertService.showError(
        'Archivo muy grande',
        'La imagen no puede superar los 10 MB.',
      );
      return;
    }

    this.uploadingImage = true;
    this.imageError = false;
    this.storageService.uploadImagen(file, 'productos').subscribe({
      next: (res) => {
        this.frmProducto.patchValue({ imagenUrl: res.url });
        this.uploadingImage = false;
      },
      error: () => {
        this.alertService.showError(
          'Error',
          'No se pudo subir la imagen. Intenta de nuevo.',
        );
        this.uploadingImage = false;
      },
    });
  }

  quitarImagen(): void {
    this.frmProducto.patchValue({ imagenUrl: null });
    this.imageError = false;
  }
  onImageLoad(_event: Event): void {
    this.imageError = false;
  }
}
