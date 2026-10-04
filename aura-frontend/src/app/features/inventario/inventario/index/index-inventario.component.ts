import { StockPresentacionPipe } from '../../../../shared/pipes/stock-presentacion.pipe';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { SidebarModule } from 'primeng/sidebar';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { FormInventarioComponent } from '../form/form-inventario.component';
import { HistorialProductoComponent } from '../historial/historial-producto.component';
import {
  InventarioPageableDto,
  InventarioTableModel,
} from '../../../../core/models/inventario.model';
import { InventarioService } from '../../../../core/services/inventario.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { SedeActualService } from '../../../../core/services/sede-actual.service';
import { BodegaService } from '../../../../core/services/bodega.service';

import { PuedeDirective } from '../../../../shared/directives/puede.directive';
@Component({
  selector: 'app-index-inventario',
  standalone: true,
  imports: [
    PuedeDirective,
    StockPresentacionPipe,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    SkeletonModule,
    SidebarModule,
    DropdownModule,
    FormInventarioComponent,
    HistorialProductoComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-inventario.component.html',
  styleUrls: ['./index-inventario.component.scss'],
})
export class IndexInventarioComponent implements OnInit {
  public showModal = false;
  public selectedId: number | null = null;
  public modalSlug = 'create';

  // Modal historial
  public showHistorial = false;
  public historialProductoId: number | null = null;
  public historialProductoNombre = '';
  public historialProductoSku: string | null = null;
  public historialSucursalId: number | null = null;

  public items: InventarioTableModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  public lastLazyEvent!: TableLazyLoadEvent;

  // Sede y bodega: por defecto la sede en la que se trabaja (un catálogo por
  // empresa, la existencia es de cada sede y bodega).
  public sedesOpts: { id: number | null; nombre: string }[] = [];
  public bodegasOpts: { id: number | null; nombre: string }[] = [];
  public sedeId: number | null = null;
  public bodegaId: number | null = null;
  private filtrosListos = false;

  // Panel alertas stock bajo
  public showAlertSidebar = false;
  public stockBajoItems: InventarioTableModel[] = [];
  public loadingAlerts = false;

  constructor(
    private readonly inventarioService: InventarioService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
    private readonly sedeActual: SedeActualService,
    private readonly bodegaService: BodegaService,
  ) {}

  async ngOnInit(): Promise<void> {
    const [{ sedes, todas }, actual] = await Promise.all([
      this.sedeActual.opciones(),
      this.sedeActual.id(),
    ]);
    this.sedesOpts = [
      ...(todas ? [{ id: null, nombre: 'Todas las sedes' }] : []),
      ...sedes.map((s) => ({ id: s.id, nombre: s.nombre })),
    ];
    this.sedeId = sedes.some((s) => s.id === actual) ? actual : (sedes[0]?.id ?? null);
    await this.cargarBodegas();
    this.filtrosListos = true;
    this.reloadTable();
  }

  async onSede(): Promise<void> {
    this.bodegaId = null;
    await this.cargarBodegas();
    this.onSearch();
  }

  onBodega(): void {
    this.onSearch();
  }

  private async cargarBodegas(): Promise<void> {
    if (!this.sedeId) {
      this.bodegasOpts = [];
      return;
    }
    try {
      const res = await lastValueFrom(this.bodegaService.list({ sucursalId: this.sedeId }));
      this.bodegasOpts = [
        { id: null, nombre: 'Todas las bodegas' },
        ...(res?.data ?? []).map((b) => ({ id: b.id, nombre: b.nombre })),
      ];
    } catch {
      this.bodegasOpts = [];
    }
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    // Primero la sede de trabajo; la tabla carga cuando ya se sabe cuál es.
    if (!this.filtrosListos) return;
    this.loadingTable = true;
    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;
    const sortField = Array.isArray(event.sortField)
      ? event.sortField[0]
      : event.sortField;

    const dto: InventarioPageableDto = {
      page,
      rows: event.rows ?? this.rowSize,
      search: this.searchQuery || null,
      order_by: sortField ?? 'i.id',
      order: event.sortOrder === 1 ? 'ASC' : 'DESC',
      params: { sucursalId: this.sedeId, bodegaId: this.bodegaId },
    };

    try {
      const res = await lastValueFrom(this.inventarioService.page(dto));
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (err: any) {
      if (err?.status !== 206)
        this.alertService.showError(
          'Error',
          'No se pudo cargar el inventario.',
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

  openCreate(): void {
    this.selectedId = null;
    this.modalSlug = 'create';
    this.showModal = true;
  }
  openEdit(item: InventarioTableModel): void {
    this.selectedId = item.id;
    this.modalSlug = 'edit';
    this.showModal = true;
  }
  openHistorial(item: InventarioTableModel): void {
    this.historialProductoId = item.productoId;
    this.historialProductoNombre = item.productoNombre;
    this.historialProductoSku = item.productoSku;
    this.historialSucursalId = item.sucursalId;
    this.showHistorial = true;
  }
  onModalClosed(): void {
    this.showModal = false;
  }
  onItemSaved(): void {
    this.showModal = false;
    this.reloadTable();
  }
  private reloadTable(): void {
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  // ─── Stock bajo ───────────────────────────────────────────
  async verStockBajo(): Promise<void> {
    this.showAlertSidebar = true;
    this.loadingAlerts = true;
    try {
      const res = await lastValueFrom(this.inventarioService.stockBajo());
      this.stockBajoItems = res?.data ?? [];
    } catch {
      this.stockBajoItems = [];
    } finally {
      this.loadingAlerts = false;
    }
  }

  // ─── Helpers UI ───────────────────────────────────────────
  getStockClass(item: InventarioTableModel): string {
    if (item.stockActual <= 0) return 'stock-cero';
    if (item.stockActual <= item.stockMinimo) return 'stock-bajo';
    if (item.stockActual <= item.stockMinimo * 1.5) return 'stock-warn';
    return 'stock-ok';
  }

  getStockTooltip(item: InventarioTableModel): string {
    if (item.stockActual <= 0) return 'Sin stock';
    if (item.stockActual <= item.stockMinimo) return 'Stock bajo el mínimo';
    return 'Stock normal';
  }
}
