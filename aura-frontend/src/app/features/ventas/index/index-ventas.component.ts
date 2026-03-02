import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import {
  EstadoVenta,
  VentaModel,
  VentaPageableDto,
  VentaTableModel,
} from '../../../core/models/venta.model';
import { VentaService } from '../../../core/services/venta.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { DetalleVentaComponent } from '../detalle/detalle-venta.component';
import { VentaResponse } from '../../../core/models/venta-response.model';
import { ModalTirillaComponent } from '../../pos/components/modal-tirilla/modal-tirilla.component';
import { ModalFacturaComponent } from '../../pos/components/modal-factuta/modal-factura.component';
import { FacturaViewerModalComponent } from '../../pos/components/factura-viewer-modal/factura-viewer-modal.component';
import { EmpresaService } from '../../../core/services/empresa.service';
import { IndexDBService } from '../../../core/services/index-db.service';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;
@Component({
  selector: 'app-index-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    TooltipModule,
    SkeletonModule,
    DetalleVentaComponent,
    ModalTirillaComponent,
    ModalFacturaComponent,
    FacturaViewerModalComponent,
  ],
  providers: [MessageService],
  templateUrl: './index-ventas.component.html',
  styleUrls: ['./index-ventas.component.scss'],
})
export class IndexVentasComponent implements OnInit {
  mostrarViewerFE = false;
  facturaSeleccionada: any = null;
  showTirilla = false;
  ventaImpresion: VentaModel | null = null;
  loadingTirilla = false;
  public showDetalle = false;
  public selectedId: number | null = null;
  showFactura = false;
  ventaFactura: VentaModel | null = null;

  public items: VentaTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly ventaService: VentaService,
    private readonly alertService: AlertService,
    private readonly empresaService: EmpresaService, // ← nuevo
    private readonly indexDBService: IndexDBService, // ← nuevo
  ) {}

  ngOnInit(): void {}

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;
    const dto: VentaPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'v.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
    };
    try {
      const res = await lastValueFrom(this.ventaService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudieron cargar las ventas.',
        );
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
    }
  }

  onSearch(): void {
    if (this.lastLazyEvent) this.loadTable({ ...this.lastLazyEvent, first: 0 });
  }
  clearSearch(): void {
    this.searchQuery = '';
    this.onSearch();
  }
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  openDetalle(item: VentaTableModel): void {
    this.selectedId = item.id;
    this.showDetalle = true;
  }
  onDetalleClosed(): void {
    this.showDetalle = false;
  }
  onAnulada(): void {
    this.showDetalle = false;
    this.reloadTable();
  }

  getEstadoSeverity(e: EstadoVenta): TagSeverity {
    const map: Record<EstadoVenta, TagSeverity> = {
      COMPLETADA: 'success',
      ANULADA: 'danger',
    };
    return map[e] ?? 'secondary';
  }
  getEstadoLabel(e: EstadoVenta): string {
    return e === 'COMPLETADA' ? 'Completada' : 'Anulada';
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);

  formatFecha(f: string): string {
    return new Date(f).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  // Método nuevo
  async reimprimir(item: VentaTableModel, event: Event): Promise<void> {
    event.stopPropagation();
    this.loadingTirilla = true;
    try {
      // Cargar venta + empresa + cajero en paralelo
      const [ventaRes, empresaRes, auth] = await Promise.all([
        lastValueFrom(this.ventaService.getById(item.id)),
        lastValueFrom(this.empresaService.getConfig()),
        this.indexDBService.loadDataAuthDB(),
      ]);

      const empresa = empresaRes?.data;

      this.ventaImpresion = {
        ...ventaRes?.data,
        // Datos empresa
        logoUrl: empresa?.logoUrl ?? '',
        razonSocial: empresa?.razonSocial ?? '',
        empresaNombre: empresa?.razonSocial ?? '',
        empresaNit: empresa?.nit ?? '',
        empresaDireccion: empresa?.direccion ?? '',
        empresaEmail: empresa?.correo ?? '',
        empresaTelefono: empresa?.telefono ?? '',
        empresaCiudad: empresa?.ciudad ?? '',
        // Cajero del usuario logueado
        cajeroNombre: auth?.nombreCompleto ?? '',
      } as unknown as VentaModel;
      console.log('Venta para impresión:', this.ventaImpresion);
      this.showTirilla = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la venta');
    } finally {
      this.loadingTirilla = false;
      this.cdr.markForCheck();
    }
  }

  onTirillaClose(): void {
    this.showTirilla = false;
    this.ventaImpresion = null;
  }
  async abrirFactura(item: VentaTableModel, event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const res = await lastValueFrom(this.ventaService.getById(item.id));
      this.ventaFactura = res?.data ?? null;
      this.showFactura = true;
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la venta');
    }
  }

  onFacturaClosed(): void {
    this.showFactura = false;
    this.ventaFactura = null;
  }
  verFactura(item: VentaTableModel, event: Event): void {
    event.stopPropagation();
    this.facturaSeleccionada = {
      id: item.id, // ← FALTABA, sin esto ventaId llega null
      factusUrl: (item as any).factusUrl ?? null,
      cufe: (item as any).cufe ?? null,
      facturaNumero: (item as any).factusNumero ?? item.numeroVenta ?? null,
    };
    this.mostrarViewerFE = true;
  }
}
