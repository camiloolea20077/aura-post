import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';
import { ProductoService } from '../../../core/services/producto.service';
import { AlertService } from '../../pipes/alert.service';
import {
  PageableDto,
  ProductoTableModel,
} from '../../../core/models/producto.model';

@Component({
  selector: 'app-buscador-producto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    TableModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './buscador-producto-dialog.component.html',
  styleUrls: ['./buscador-producto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorProductoDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() productoSelected = new EventEmitter<ProductoTableModel>();

  public dialogSearch = '';
  public dialogItems: ProductoTableModel[] = [];
  public dialogTotal = 0;
  public dialogLoading = false;
  public barcodeQuery = '';
  public barcodeSearching = false;

  private dialogLastEvent!: TableLazyLoadEvent;

  constructor(
    private readonly productoService: ProductoService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async loadDialogTable(event: TableLazyLoadEvent): Promise<void> {
    this.dialogLastEvent = event;
    this.dialogLoading = true;
    this.cdr.markForCheck();

    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    const dto: PageableDto = {
      page,
      rows: event.rows ?? 10,
      search: this.dialogSearch || null,
      order_by: 'p.nombre',
      order: 'ASC',
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

  onDialogSearch(): void {
    if (this.dialogLastEvent) {
      this.loadDialogTable({ ...this.dialogLastEvent, first: 0 });
    }
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
        this.alertService.showWarn(
          'Sin resultados',
          `No se encontró producto con código "${q}".`,
        );
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
