import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { lastValueFrom } from 'rxjs';

import { EstadoFacturaVenta, FacturaVentaFila } from '../../../core/models/factura-venta.model';
import { FacturaVentaService } from '../../../core/services/factura-venta.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../shared/directives/puede.directive';

type Severidad = 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined;

/** Ventas › Facturas: listado de facturas de Facturación (borradores y emitidas). */
@Component({
  selector: 'app-index-facturas-venta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    DropdownModule,
    PuedeDirective,
  ],
  templateUrl: './index-facturas-venta.component.html',
  styleUrls: ['./index-facturas-venta.component.scss'],
})
export class IndexFacturasVentaComponent {
  items: FacturaVentaFila[] = [];
  cargando = true;
  totalRecords = 0;
  readonly rowSize = 15;
  search = '';
  estado: EstadoFacturaVenta | null = null;
  readonly estados = [
    { label: 'Borradores', value: 'BORRADOR' },
    { label: 'Emitidas', value: 'EMITIDA' },
    { label: 'Anuladas', value: 'ANULADA' },
  ];
  private ultimo: TableLazyLoadEvent = { first: 0, rows: this.rowSize };
  private debounce: any = null;

  constructor(
    private readonly service: FacturaVentaService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async loadTable(ev: TableLazyLoadEvent): Promise<void> {
    this.ultimo = ev;
    this.cargando = true;
    this.cdr.markForCheck();
    const rows = ev.rows ?? this.rowSize;
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: Math.floor((ev.first ?? 0) / rows),
          rows,
          search: this.search.trim() || null,
          params: { estado: this.estado },
        }),
      );
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch (e: any) {
      if (e?.status !== 206) this.alert.showError('Error', e?.error?.message ?? 'No se pudieron cargar las facturas');
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onSearch(): void {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.loadTable({ ...this.ultimo, first: 0 }), 300);
  }

  limpiar(): void {
    this.search = '';
    this.onSearch();
  }

  condiciones(): void {
    this.router.navigate(['/ventas/facturas/condiciones-pago']);
  }

  nueva(): void {
    this.router.navigate(['/ventas/facturas/nueva']);
  }

  abrir(f: FacturaVentaFila): void {
    this.router.navigate(
      f.estado === 'BORRADOR' ? ['/ventas/facturas', f.id, 'editar'] : ['/ventas/facturas', f.id],
    );
  }

  etiqueta(e: EstadoFacturaVenta): string {
    return e === 'BORRADOR' ? 'Borrador' : e === 'EMITIDA' ? 'Emitida' : 'Anulada';
  }

  severidad(e: EstadoFacturaVenta): Severidad {
    return e === 'BORRADOR' ? 'secondary' : e === 'EMITIDA' ? 'success' : 'danger';
  }

  vencida(f: FacturaVentaFila): boolean {
    if (f.estado !== 'EMITIDA' || !f.fechaVencimiento || !f.saldoPendiente) return false;
    return new Date(f.fechaVencimiento + 'T23:59:59') < new Date();
  }

  cop(v: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
      v ?? 0,
    );
  }
}
