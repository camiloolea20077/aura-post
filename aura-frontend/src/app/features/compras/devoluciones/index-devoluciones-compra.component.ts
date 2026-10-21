import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { lastValueFrom } from 'rxjs';

import {
  DestinoNotaCredito,
  DevolucionCompraFiltroDto,
  DevolucionCompraModel,
} from '../../../core/models/compra.model';
import { CompraService } from '../../../core/services/compra.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { ExcelReporteService } from '../../../shared/services/excel-reporte.service';
import { DetalleCompraComponent } from '../detail/detalle-compra.component';

/**
 * Devoluciones en compras (docs/PLAN_EXCEL_IMPORTADORES_MODULOS.md §3).
 *
 * Una devolución es la nota crédito de compra de siempre: este listado solo la
 * muestra por lo que es para el usuario. Se crea en el formulario de compras en
 * modo nota crédito, que ya valida el tope por producto, saca la mercancía de
 * la bodega donde entró y resuelve qué pasa con la plata.
 */
@Component({
  selector: 'app-index-devoluciones-compra',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    DropdownModule,
    CalendarModule,
    PuedeDirective,
    DetalleCompraComponent,
  ],
  templateUrl: './index-devoluciones-compra.component.html',
  styleUrls: ['./index-devoluciones-compra.component.scss'],
})
export class IndexDevolucionesCompraComponent {
  private readonly compraService = inject(CompraService);
  private readonly alertService = inject(AlertService);
  private readonly excel = inject(ExcelReporteService);
  private readonly router = inject(Router);

  public items: DevolucionCompraModel[] = [];
  public loadingTable = true;
  public totalRecords = 0;
  public rowSize = 15;
  public searchQuery = '';
  private lastLazyEvent: TableLazyLoadEvent | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // Filtros
  public estado: 'VIGENTE' | 'ANULADA' | null = 'VIGENTE';
  public readonly estadoOpts = [
    { label: 'Vigentes', value: 'VIGENTE' },
    { label: 'Anuladas', value: 'ANULADA' },
    { label: 'Todas', value: null },
  ];
  public desde: Date | null = null;
  public hasta: Date | null = null;

  public exportando = false;

  // Detalle (el mismo de compras: una NC es una compra en negativo)
  public showDetalle = false;
  public selectedId: number | null = null;

  private get filtros(): DevolucionCompraFiltroDto {
    return { estado: this.estado, desde: this.iso(this.desde), hasta: this.iso(this.hasta) };
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastLazyEvent = event;
    this.loadingTable = true;
    const rows = event.rows ?? this.rowSize;
    const page = event.first != null && rows ? Math.floor(event.first / rows) : 0;
    try {
      const res = await lastValueFrom(
        this.compraService.devolucionesPage({
          page,
          rows,
          search: this.searchQuery || null,
          params: this.filtros,
        }),
      );
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch {
      this.alertService.showError('Error', 'No se pudieron cargar las devoluciones.');
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loadingTable = false;
    }
  }

  recargar(): void {
    this.loadTable({ ...(this.lastLazyEvent ?? { rows: this.rowSize }), first: 0 });
  }

  onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.recargar(), 350);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.recargar();
  }

  nuevaDevolucion(): void {
    this.router.navigate(['/compras/nueva'], { queryParams: { tipo: 'NOTA_CREDITO' } });
  }

  verDetalle(item: DevolucionCompraModel): void {
    this.selectedId = item.id;
    this.showDetalle = true;
  }

  verCompraOrigen(item: DevolucionCompraModel): void {
    this.selectedId = item.compraOrigenId;
    this.showDetalle = true;
  }

  onDetalleClosed(): void {
    this.showDetalle = false;
    this.selectedId = null;
  }

  onAnulada(): void {
    this.onDetalleClosed();
    if (this.lastLazyEvent) this.loadTable(this.lastLazyEvent);
  }

  // ─── Excel: todas las páginas con los filtros actuales ──────────────
  async exportarExcel(): Promise<void> {
    this.exportando = true;
    try {
      const filas: DevolucionCompraModel[] = [];
      for (let page = 0; page < 200; page++) {
        const res = await lastValueFrom(
          this.compraService.devolucionesPage({
            page,
            rows: 500,
            search: this.searchQuery || null,
            params: this.filtros,
          }),
        );
        const content = res?.data?.content ?? [];
        filas.push(...content);
        if (content.length < 500) break;
      }
      if (!filas.length) {
        this.alertService.showWarn('Sin datos', 'No hay devoluciones con esos filtros.');
        return;
      }
      const rango =
        this.desde || this.hasta
          ? `Del ${this.iso(this.desde) ?? 'inicio'} al ${this.iso(this.hasta) ?? 'hoy'}`
          : 'Todas las fechas';
      await this.excel.descargar({
        titulo: 'Devoluciones en compras',
        subtitulo: rango,
        archivo: `devoluciones-compras-${new Date().toISOString().slice(0, 10)}`,
        hojas: [
          {
            nombre: 'Devoluciones',
            columnas: [
              { titulo: '#', tipo: 'numero', ancho: 8 },
              { titulo: 'N° nota crédito', tipo: 'texto', ancho: 16 },
              { titulo: 'Fecha', tipo: 'fecha' },
              { titulo: 'Proveedor', tipo: 'texto' },
              { titulo: 'Compra', tipo: 'texto', ancho: 16 },
              { titulo: 'Sede', tipo: 'texto', ancho: 18 },
              { titulo: 'Bodega', tipo: 'texto', ancho: 18 },
              { titulo: 'Qué pasa con la plata', tipo: 'texto', ancho: 24 },
              { titulo: 'Motivo', tipo: 'texto', ancho: 36 },
              { titulo: 'Unidades', tipo: 'numero' },
              { titulo: 'Valor', tipo: 'pesos' },
              { titulo: 'Estado', tipo: 'texto', ancho: 10 },
            ],
            filas: [
              ...filas.map((d) => [
                d.id,
                d.numeroCompra ?? '',
                new Date(d.fecha),
                d.proveedorNombre,
                d.compraOrigenNumero,
                d.sucursalNombre,
                d.bodegaNombre ?? '',
                this.destinoLabel(d.destinoNotaCredito),
                d.observaciones ?? '',
                Number(d.unidades) || 0,
                Number(d.total) || 0,
                d.estado === 'ANULADA' ? 'Anulada' : 'Vigente',
              ]),
              {
                estilo: 'total' as const,
                valores: [
                  'Total vigentes', '', null, '', '', '', '', '', '',
                  filas.filter((d) => d.estado !== 'ANULADA').reduce((s, d) => s + (Number(d.unidades) || 0), 0),
                  filas.filter((d) => d.estado !== 'ANULADA').reduce((s, d) => s + (Number(d.total) || 0), 0),
                  '',
                ],
              },
            ],
          },
        ],
      });
    } catch {
      this.alertService.showError('Error', 'No se pudo generar el Excel.');
    } finally {
      this.exportando = false;
    }
  }

  // ─── UI helpers ──────────────────────────────────────────────────────
  destinoLabel(d: DestinoNotaCredito | null): string {
    switch (d) {
      case 'CRUCE_CXP':
        return 'Descuenta de la deuda';
      case 'DEVOLUCION_DINERO':
        return 'El proveedor devolvió la plata';
      case 'SALDO_A_FAVOR':
        return 'Saldo a favor con el proveedor';
      default:
        return '—';
    }
  }

  destinoSeverity(d: DestinoNotaCredito | null): 'info' | 'success' | 'warn' | 'secondary' {
    switch (d) {
      case 'CRUCE_CXP':
        return 'info';
      case 'DEVOLUCION_DINERO':
        return 'success';
      case 'SALDO_A_FAVOR':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  private iso(d: Date | null): string | null {
    if (!d) return null;
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }
}
