import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { MarcaService } from '../../../core/services/marca.service';
import { AlertService } from '../../pipes/alert.service';
import {
  CLASIFICACION_OPTIONS,
  clasificacionOpcion,
  PageableDto,
  ProductoTableModel,
} from '../../../core/models/producto.model';

interface Criterios {
  categoriaId: number | null;
  marcaId: number | null;
  clasificacion: string | null;
  activo: boolean | null;
}

/**
 * Buscador avanzado de productos, igual al de terceros: texto o código de
 * barras arriba y un panel de criterios (categoría, marca, clase, estado).
 * Lo abre la lupa de <app-producto-autocomplete> y algunas pantallas sueltas.
 */
@Component({
  selector: 'app-buscador-producto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    TableModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './buscador-producto-dialog.component.html',
  styleUrls: ['./buscador-producto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorProductoDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() header = 'Buscar producto';
  /** Texto con que abre (lo que ya se escribió en el autocompletar). */
  @Input() busquedaInicial = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() productoSelected = new EventEmitter<ProductoTableModel>();

  public dialogSearch = '';
  public dialogItems: ProductoTableModel[] = [];
  public dialogTotal = 0;
  public dialogLoading = false;
  public barcodeQuery = '';
  public barcodeSearching = false;

  public panelAbierto = true;
  public criterios: Criterios = this.criteriosVacios();
  public categoriasOpts: { label: string; value: number }[] = [];
  public marcasOpts: { label: string; value: number }[] = [];
  public readonly clasificacionOpts = CLASIFICACION_OPTIONS.map((o) => ({ label: o.label, value: o.value }));
  public readonly estadoOpts = [
    { label: 'Activos', value: true },
    { label: 'Inactivos', value: false },
  ];
  private catalogosCargados = false;

  private dialogLastEvent: TableLazyLoadEvent = { first: 0, rows: 10 };

  constructor(
    private readonly productoService: ProductoService,
    private readonly categoriaService: CategoriaService,
    private readonly marcaService: MarcaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['visible'] && this.visible) {
      this.dialogSearch = this.busquedaInicial ?? '';
      this.cargarCatalogos();
    }
  }

  get criteriosActivos(): number {
    const c = this.criterios;
    return [c.categoriaId, c.marcaId, c.clasificacion].filter((v) => v != null).length + (c.activo === false ? 1 : 0);
  }

  clasificacionLabel(c?: string | null): string {
    return c && c !== 'PRODUCTO' ? clasificacionOpcion(c).label : '';
  }

  togglePanel(): void {
    this.panelAbierto = !this.panelAbierto;
  }

  limpiarCriterios(): void {
    this.criterios = this.criteriosVacios();
    this.buscar();
  }

  private criteriosVacios(): Criterios {
    return { categoriaId: null, marcaId: null, clasificacion: null, activo: true };
  }

  private async cargarCatalogos(): Promise<void> {
    if (this.catalogosCargados) return;
    try {
      const [cats, marcas] = await Promise.all([
        lastValueFrom(this.categoriaService.list()),
        lastValueFrom(this.marcaService.list()),
      ]);
      this.categoriasOpts = (cats?.data ?? []).map((c: any) => ({ label: c.nombre, value: c.id }));
      this.marcasOpts = (marcas?.data ?? []).map((m: any) => ({ label: m.nombre, value: m.id }));
      this.catalogosCargados = true;
      this.cdr.markForCheck();
    } catch {
      /* sin catálogos se busca solo por texto */
    }
  }

  async loadDialogTable(event: TableLazyLoadEvent): Promise<void> {
    this.dialogLastEvent = event;
    this.dialogLoading = true;
    this.cdr.markForCheck();

    const page = event.first != null && event.rows ? Math.floor(event.first / event.rows) : 0;
    const c = this.criterios;
    const dto: PageableDto = {
      page,
      rows: event.rows ?? 10,
      search: this.dialogSearch?.trim() || null,
      order_by: 'p.nombre',
      order: 'ASC',
      params: {
        categoriaId: c.categoriaId,
        marcaId: c.marcaId,
        clasificacion: c.clasificacion,
        activo: c.activo,
      },
    };

    try {
      const res = await lastValueFrom(this.productoService.page(dto));
      this.dialogItems = res?.data?.content ?? [];
      this.dialogTotal = res?.data?.totalElements ?? 0;
    } catch {
      this.dialogItems = [];
      this.dialogTotal = 0;
    } finally {
      this.dialogLoading = false;
      this.cdr.markForCheck();
    }
  }

  buscar(): void {
    this.loadDialogTable({ ...this.dialogLastEvent, first: 0 });
  }

  /** Alias usado por el template al escribir. */
  onDialogSearch(): void {
    this.buscar();
  }

  async buscarPorBarcode(): Promise<void> {
    const q = this.barcodeQuery.trim();
    if (!q) return;
    this.barcodeSearching = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      const productos = res?.data ?? [];
      if (productos.length === 0) {
        this.alertService.showWarn('Sin resultados', `No se encontró producto con código "${q}".`);
        return;
      }
      this.selectProduct(productos[0]);
      this.barcodeQuery = '';
    } catch {
      this.alertService.showError('Error', 'No se pudo buscar el producto.');
    } finally {
      this.barcodeSearching = false;
      this.cdr.markForCheck();
    }
  }

  selectProduct(item: ProductoTableModel): void {
    this.productoSelected.emit(item);
    this.close();
  }

  close(): void {
    this.dialogSearch = '';
    this.dialogItems = [];
    this.dialogTotal = 0;
    this.barcodeQuery = '';
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.markForCheck();
  }
}
