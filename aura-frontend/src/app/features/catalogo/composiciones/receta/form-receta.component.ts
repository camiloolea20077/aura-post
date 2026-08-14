import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import {
  GuardarRecetaDto,
  RecetaComponenteDto,
  RecetaCosteoModel,
  RecetaModel,
  TIPO_COMPOSICION_OPTIONS,
  TipoComposicion,
} from '../../../../core/models/producto-composicion.model';
import { ProductoComposicionService } from '../../../../core/services/producto-composicion.service';
import { ProductoService } from '../../../../core/services/producto.service';
import { ProductoPresentacionService } from '../../../../core/services/producto-presentacion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

/**
 * Opción de medida para una línea: o la unidad base del componente, o una de
 * sus presentaciones. `factor` son las unidades base que equivalen a 1 de esta.
 */
interface MedidaOpcion {
  label: string;
  value: string; // 'base' | 'pres:<id>'
  factor: number;
  presentacionId: number | null;
}

/** Fila editable de la grilla. Todo lo que empieza por `_` es de la UI. */
interface FilaReceta {
  id: number | null;
  productoHijoId: number | null;
  productoHijoNombre: string;
  cantidadReceta: number;
  medida: string;
  mermaPorcentaje: number;
  nota: string | null;

  _unidadBaseAbrev: string;
  _unidadBaseId: number | null;
  _medidaOpts: MedidaOpcion[];
  /**
   * Opciones del buscador PROPIAS de la fila. Compartir una sola lista entre
   * todas hacía que al filtrar en una fila las demás perdieran de vista su
   * valor seleccionado y mostraran el placeholder.
   */
  _hijoOpts: { label: string; value: number }[];
  _stock: number;
  _manejaInventario: boolean;
  _cargando: boolean;
}

@Component({
  selector: 'app-form-receta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TableModule,
    InputNumberModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './form-receta.component.html',
  styleUrls: ['./form-receta.component.scss'],
})
export class FormRecetaComponent implements OnChanges {
  @Input() displayModal = false;
  /** Producto cuya receta se edita. Null = hay que elegirlo primero. */
  @Input() productoPadreId: number | null = null;

  @Output() modalClosed = new EventEmitter<void>();
  @Output() recetaSaved = new EventEmitter<RecetaModel>();

  public tipoOptions = TIPO_COMPOSICION_OPTIONS;

  public padreId: number | null = null;
  public padreNombre = '';
  public padreUnidadAbrev = '';
  public tipo: TipoComposicion = 'RECETA';
  public rendimiento = 1;
  public filas: FilaReceta[] = [];

  public isLoading = false;
  public isSubmitting = false;

  // Selector de producto padre (solo cuando se abre sin preselección)
  public padreOpts: { label: string; value: number }[] = [];


  // Costeo
  public costeo: RecetaCosteoModel | null = null;
  public costeoVisible = false;
  public isCosteando = false;

  // Duplicar desde otra receta
  public duplicarVisible = false;
  public duplicarOrigenId: number | null = null;
  public duplicarOpts: { label: string; value: number }[] = [];

  constructor(
    private readonly composicionService: ProductoComposicionService,
    private readonly productoService: ProductoService,
    private readonly presentacionService: ProductoPresentacionService,
    private readonly alertService: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayModal'] && this.displayModal) {
      this.reset();
      if (this.productoPadreId) {
        this.padreId = this.productoPadreId;
        void this.cargarReceta(this.productoPadreId);
      }
    }
  }

  private reset(): void {
    this.padreId = null;
    this.padreNombre = '';
    this.padreUnidadAbrev = '';
    this.tipo = 'RECETA';
    this.rendimiento = 1;
    this.filas = [];
    this.costeo = null;
    this.costeoVisible = false;
    this.duplicarVisible = false;
    this.duplicarOrigenId = null;
    this.padreOpts = [];
  }

  // ── Carga ───────────────────────────────────────────────────

  private async cargarReceta(productoPadreId: number): Promise<void> {
    this.isLoading = true;
    try {
      const res = await lastValueFrom(
        this.composicionService.getReceta(productoPadreId),
      );
      const receta = res?.data;
      if (!receta) return;

      this.padreId = receta.productoPadreId;
      this.padreNombre = receta.productoPadreNombre;
      this.padreUnidadAbrev = receta.unidadBaseAbreviatura ?? 'u.';
      this.tipo = receta.tipo;
      this.rendimiento = receta.rendimiento ?? 1;

      this.filas = receta.componentes.map((c) => ({
        id: c.id,
        productoHijoId: c.productoHijoId,
        productoHijoNombre: c.productoHijoNombre,
        cantidadReceta: c.cantidadReceta,
        medida: c.productoPresentacionId
          ? `pres:${c.productoPresentacionId}`
          : 'base',
        mermaPorcentaje: c.mermaPorcentaje ?? 0,
        nota: c.nota,
        _unidadBaseAbrev: c.unidadBaseAbreviatura ?? 'u.',
        _unidadBaseId: c.unidadMedidaId,
        _medidaOpts: [],
        // Sembrada con el propio componente para que el dropdown muestre el
        // nombre sin necesidad de buscar.
        _hijoOpts: [{ label: c.productoHijoNombre, value: c.productoHijoId }],
        _stock: c.stockDisponible ?? 0,
        _manejaInventario: c.manejaInventario,
        _cargando: true,
      }));

      // Las opciones de medida no vienen en la receta: cada componente tiene
      // sus propias presentaciones. Se cargan en paralelo.
      await Promise.all(this.filas.map((f) => this.cargarMedidas(f)));
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la receta.');
      this.close();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Arma el selector de medida de una fila: la unidad base del componente más
   * cada presentación suya. El factor de una presentación es el inverso de su
   * `factorConversion`, igual que lo resuelve el backend.
   */
  private async cargarMedidas(fila: FilaReceta): Promise<void> {
    if (!fila.productoHijoId) return;
    fila._cargando = true;
    try {
      const [prod, pres] = await Promise.all([
        lastValueFrom(this.productoService.getById(fila.productoHijoId)),
        lastValueFrom(
          this.presentacionService.listByProducto(fila.productoHijoId),
        ),
      ]);

      const base = prod?.data;
      if (base) {
        fila._unidadBaseAbrev = base.unidadMedidaNombre ?? 'u.';
        fila._unidadBaseId = base.unidadMedidaBaseId;
      }

      const opts: MedidaOpcion[] = [
        {
          label: `${fila._unidadBaseAbrev} (unidad de stock)`,
          value: 'base',
          factor: 1,
          presentacionId: null,
        },
      ];

      for (const p of pres?.data ?? []) {
        if (!p.factorConversion || p.factorConversion <= 0) continue;
        opts.push({
          label: `${p.nombre} — 1 ${fila._unidadBaseAbrev} = ${p.factorConversion} ${p.nombre}`,
          value: `pres:${p.id}`,
          factor: 1 / p.factorConversion,
          presentacionId: p.id,
        });
      }

      fila._medidaOpts = opts;
      if (!opts.some((o) => o.value === fila.medida)) fila.medida = 'base';
    } catch {
      fila._medidaOpts = [
        {
          label: fila._unidadBaseAbrev,
          value: 'base',
          factor: 1,
          presentacionId: null,
        },
      ];
      fila.medida = 'base';
    } finally {
      fila._cargando = false;
    }
  }

  // ── Búsquedas ───────────────────────────────────────────────

  async onFiltroPadre(event: { filter: string }): Promise<void> {
    this.padreOpts = await this.buscarProductos(event.filter);
  }

  async onFiltroHijo(
    fila: FilaReceta,
    event: { filter: string },
  ): Promise<void> {
    const encontrados = await this.buscarProductos(event.filter);
    // Se conserva el seleccionado en la lista para que no desaparezca del
    // dropdown mientras el usuario escribe otra búsqueda.
    const actual = fila._hijoOpts.find((o) => o.value === fila.productoHijoId);
    fila._hijoOpts =
      actual && !encontrados.some((o) => o.value === actual.value)
        ? [actual, ...encontrados]
        : encontrados;
  }

  async onFiltroDuplicar(event: { filter: string }): Promise<void> {
    this.duplicarOpts = await this.buscarProductos(event.filter);
  }

  private async buscarProductos(
    filtro: string,
  ): Promise<{ label: string; value: number }[]> {
    const q = filtro?.trim();
    if (!q || q.length < 2) return [];
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      return (res?.data ?? []).map((p: any) => ({
        label: p.nombre + (p.sku ? ` [${p.sku}]` : ''),
        value: p.id,
      }));
    } catch {
      return [];
    }
  }

  async onPadreSeleccionado(): Promise<void> {
    if (this.padreId) await this.cargarReceta(this.padreId);
  }

  // ── Grilla ──────────────────────────────────────────────────

  agregarFila(): void {
    this.filas = [
      ...this.filas,
      {
        id: null,
        productoHijoId: null,
        productoHijoNombre: '',
        cantidadReceta: 1,
        medida: 'base',
        mermaPorcentaje: 0,
        nota: null,
        _unidadBaseAbrev: 'u.',
        _unidadBaseId: null,
        _medidaOpts: [],
        _hijoOpts: [],
        _stock: 0,
        _manejaInventario: true,
        _cargando: false,
      },
    ];
  }

  async onComponenteSeleccionado(fila: FilaReceta): Promise<void> {
    if (!fila.productoHijoId) return;

    if (fila.productoHijoId === this.padreId) {
      this.alertService.showWarn(
        'Componente inválido',
        'Un producto no puede ser ingrediente de sí mismo.',
      );
      fila.productoHijoId = null;
      return;
    }

    const repetido = this.filas.filter(
      (f) => f !== fila && f.productoHijoId === fila.productoHijoId,
    ).length;
    if (repetido > 0) {
      this.alertService.showWarn(
        'Componente repetido',
        'Ese ingrediente ya está en la receta. Súmalo en una sola línea.',
      );
      fila.productoHijoId = null;
      return;
    }

    const opt = fila._hijoOpts.find((o) => o.value === fila.productoHijoId);
    fila.productoHijoNombre = opt?.label ?? '';
    await this.cargarMedidas(fila);
  }

  quitarFila(fila: FilaReceta): void {
    this.filas = this.filas.filter((f) => f !== fila);
  }

  // ── Cálculo espejo del backend ──────────────────────────────

  /** Unidades base del componente que equivalen a 1 de la medida elegida. */
  factorDe(fila: FilaReceta): number {
    return fila._medidaOpts.find((o) => o.value === fila.medida)?.factor ?? 1;
  }

  /**
   * Consumo por 1 unidad del producto terminado, en la unidad de stock del
   * componente. Misma fórmula que aplica el backend al guardar.
   */
  consumoPorUnidad(fila: FilaReceta): number {
    const rendimiento = this.rendimiento > 0 ? this.rendimiento : 1;
    const merma = fila.mermaPorcentaje ?? 0;
    const aprovechado = merma > 0 && merma < 100 ? 1 - merma / 100 : 1;
    const cantidad = fila.cantidadReceta ?? 0;
    return (cantidad * this.factorDe(fila)) / aprovechado / rendimiento;
  }

  /** Consumo del lote entero, para contrastar contra el stock. */
  consumoLote(fila: FilaReceta): number {
    return (
      this.consumoPorUnidad(fila) *
      (this.rendimiento > 0 ? this.rendimiento : 1)
    );
  }

  /** El lote pide más de lo que hay en bodega. */
  stockInsuficiente(fila: FilaReceta): boolean {
    return fila._manejaInventario && this.consumoLote(fila) > fila._stock;
  }

  /**
   * Con scale 6 en base de datos, un consumo por debajo de 0.000001 se guarda
   * como cero y el ingrediente nunca descontaría inventario.
   */
  cantidadDemasiadoPequena(fila: FilaReceta): boolean {
    const c = this.consumoPorUnidad(fila);
    return c > 0 && c < 0.000001;
  }

  // ── Guardar ─────────────────────────────────────────────────

  get puedeGuardar(): boolean {
    return (
      !!this.padreId &&
      !this.isSubmitting &&
      this.filas.length > 0 &&
      this.filas.every(
        (f) =>
          !!f.productoHijoId &&
          f.cantidadReceta > 0 &&
          !this.cantidadDemasiadoPequena(f),
      )
    );
  }

  async guardar(): Promise<void> {
    if (!this.padreId) {
      this.alertService.showWarn(
        'Falta el producto',
        'Elige el producto al que le vas a definir la receta.',
      );
      return;
    }
    if (this.filas.length === 0) {
      this.alertService.showWarn(
        'Receta vacía',
        'Agrega al menos un ingrediente.',
      );
      return;
    }
    const incompleta = this.filas.find(
      (f) => !f.productoHijoId || !(f.cantidadReceta > 0),
    );
    if (incompleta) {
      this.alertService.showWarn(
        'Línea incompleta',
        'Cada línea necesita un componente y una cantidad mayor que cero.',
      );
      return;
    }
    const minuscula = this.filas.find((f) => this.cantidadDemasiadoPequena(f));
    if (minuscula) {
      this.alertService.showWarn(
        'Cantidad demasiado pequeña',
        `El consumo de "${minuscula.productoHijoNombre}" se redondea a cero y no descontaría inventario. Usa una medida más pequeña.`,
      );
      return;
    }

    this.isSubmitting = true;
    try {
      const componentes: RecetaComponenteDto[] = this.filas.map((f, i) => {
        const opt = f._medidaOpts.find((o) => o.value === f.medida);
        return {
          id: f.id,
          productoHijoId: f.productoHijoId!,
          cantidadReceta: f.cantidadReceta,
          // Con presentación el backend deriva el factor; sin ella manda la
          // unidad base y factor 1.
          productoPresentacionId: opt?.presentacionId ?? null,
          unidadMedidaId: opt?.presentacionId ? null : f._unidadBaseId,
          factorUnidad: opt?.presentacionId ? null : 1,
          mermaPorcentaje: f.mermaPorcentaje ?? 0,
          orden: i + 1,
          nota: f.nota,
        };
      });

      const dto: GuardarRecetaDto = {
        tipo: this.tipo,
        rendimiento: this.rendimiento,
        componentes,
      };

      const res = await lastValueFrom(
        this.composicionService.guardarReceta(this.padreId, dto),
      );
      if (res?.status === 200) {
        this.alertService.showSuccess('Receta guardada', res.message);
        this.recetaSaved.emit(res.data);
        this.close();
      }
    } catch (error: any) {
      this.alertService.showError(
        'No se pudo guardar',
        error?.message ?? 'Error inesperado al guardar la receta.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  // ── Costeo ──────────────────────────────────────────────────

  async verCosteo(): Promise<void> {
    if (!this.padreId) return;
    this.isCosteando = true;
    try {
      const res = await lastValueFrom(
        this.composicionService.costear(this.padreId),
      );
      this.costeo = res?.data ?? null;
      this.costeoVisible = true;
    } catch (error: any) {
      this.alertService.showError(
        'No se pudo costear',
        error?.message ?? 'Guarda la receta antes de costearla.',
      );
    } finally {
      this.isCosteando = false;
    }
  }

  async aplicarCosto(): Promise<void> {
    if (!this.padreId) return;
    this.isCosteando = true;
    try {
      const res = await lastValueFrom(
        this.composicionService.aplicarCosto(this.padreId),
      );
      this.costeo = res?.data ?? this.costeo;
      this.alertService.showSuccess('Costo aplicado', res.message);
    } catch (error: any) {
      this.alertService.showError(
        'No se pudo aplicar',
        error?.message ?? 'Error inesperado.',
      );
    } finally {
      this.isCosteando = false;
    }
  }

  // ── Duplicar ────────────────────────────────────────────────

  abrirDuplicar(): void {
    this.duplicarOrigenId = null;
    this.duplicarOpts = [];
    this.duplicarVisible = true;
  }

  async confirmarDuplicar(): Promise<void> {
    if (!this.padreId || !this.duplicarOrigenId) return;
    if (this.padreId === this.duplicarOrigenId) {
      this.alertService.showWarn(
        'Origen inválido',
        'Elige un producto distinto al que estás editando.',
      );
      return;
    }
    this.isSubmitting = true;
    try {
      const res = await lastValueFrom(
        this.composicionService.duplicarReceta(
          this.padreId,
          this.duplicarOrigenId,
        ),
      );
      if (res?.status === 200) {
        this.alertService.showSuccess('Receta copiada', res.message);
        this.duplicarVisible = false;
        await this.cargarReceta(this.padreId);
      }
    } catch (error: any) {
      this.alertService.showError(
        'No se pudo duplicar',
        error?.message ?? 'Error inesperado.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  // ── Cierre ──────────────────────────────────────────────────

  close(): void {
    this.reset();
    this.modalClosed.emit();
  }

  trackFila(index: number): number {
    return index;
  }
}
