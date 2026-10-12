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
  CausacionFila,
  CausacionFiltro,
  EstadoCausacion,
  etiquetaSoporte,
} from '../../../../core/models/causacion-gasto.model';
import { CausacionGastoService } from '../../../../core/services/causacion-gasto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { ExcelReporteService } from '../../../../shared/services/excel-reporte.service';

/**
 * Causaciones de gastos y servicios: facturas de arriendo, honorarios, servicios
 * públicos… con varias líneas, IVA y retenciones. Cada una deja una cuenta por
 * pagar por el neto y su asiento.
 */
@Component({
  selector: 'app-index-causaciones',
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
  ],
  templateUrl: './index-causaciones.component.html',
  styleUrls: ['./index-causaciones.component.scss'],
})
export class IndexCausacionesComponent {
  private readonly service = inject(CausacionGastoService);
  private readonly alert = inject(AlertService);
  private readonly excel = inject(ExcelReporteService);
  private readonly router = inject(Router);

  readonly etiquetaSoporte = etiquetaSoporte;

  items: CausacionFila[] = [];
  loading = true;
  totalRecords = 0;
  rowSize = 15;
  searchQuery = '';
  exportando = false;
  private lastEvent: TableLazyLoadEvent | null = null;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  estado: EstadoCausacion | null = 'CAUSADA';
  readonly estadoOpts = [
    { label: 'Causadas', value: 'CAUSADA' },
    { label: 'Anuladas', value: 'ANULADA' },
    { label: 'Todas', value: null },
  ];
  desde: Date | null = null;
  hasta: Date | null = null;

  private get filtros(): CausacionFiltro {
    return { estado: this.estado, desde: this.iso(this.desde), hasta: this.iso(this.hasta) };
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.lastEvent = event;
    this.loading = true;
    const rows = event.rows ?? this.rowSize;
    const page = event.first != null && rows ? Math.floor(event.first / rows) : 0;
    try {
      const res = await lastValueFrom(
        this.service.page({ page, rows, search: this.searchQuery || null, params: this.filtros }),
      );
      this.items = res?.data?.content ?? [];
      this.totalRecords = res?.data?.totalElements ?? 0;
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las causaciones.');
      this.items = [];
      this.totalRecords = 0;
    } finally {
      this.loading = false;
    }
  }

  recargar(): void {
    this.loadTable({ ...(this.lastEvent ?? { rows: this.rowSize }), first: 0 });
  }

  onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.recargar(), 350);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.recargar();
  }

  nueva(): void {
    this.router.navigate(['/compras/causaciones/nueva']);
  }

  ver(item: CausacionFila): void {
    this.router.navigate(['/compras/causaciones', item.id]);
  }

  async exportarExcel(): Promise<void> {
    this.exportando = true;
    try {
      const filas: CausacionFila[] = [];
      for (let page = 0; page < 200; page++) {
        const res = await lastValueFrom(
          this.service.page({ page, rows: 500, search: this.searchQuery || null, params: this.filtros }),
        );
        const content = res?.data?.content ?? [];
        filas.push(...content);
        if (content.length < 500) break;
      }
      if (!filas.length) {
        this.alert.showWarn('Sin datos', 'No hay causaciones con esos filtros.');
        return;
      }
      const vigentes = filas.filter((f) => f.estado !== 'ANULADA');
      const suma = (k: keyof CausacionFila) => vigentes.reduce((s, f) => s + (Number(f[k]) || 0), 0);
      await this.excel.descargar({
        titulo: 'Causaciones de gastos y servicios',
        subtitulo:
          this.desde || this.hasta
            ? `Del ${this.iso(this.desde) ?? 'inicio'} al ${this.iso(this.hasta) ?? 'hoy'}`
            : 'Todas las fechas',
        archivo: `causaciones-${new Date().toISOString().slice(0, 10)}`,
        hojas: [
          {
            nombre: 'Causaciones',
            columnas: [
              { titulo: 'Número', tipo: 'texto', ancho: 10 },
              { titulo: 'Fecha', tipo: 'fecha' },
              { titulo: 'Vence', tipo: 'fecha' },
              { titulo: 'Proveedor', tipo: 'texto' },
              { titulo: 'Soporte', tipo: 'texto', ancho: 18 },
              { titulo: 'N° soporte', tipo: 'texto', ancho: 14 },
              { titulo: 'Descripción', tipo: 'texto', ancho: 32 },
              { titulo: 'Subtotal', tipo: 'pesos' },
              { titulo: 'IVA', tipo: 'pesos' },
              { titulo: 'Retenciones', tipo: 'pesos' },
              { titulo: 'Total a pagar', tipo: 'pesos' },
              { titulo: 'Saldo', tipo: 'pesos' },
              { titulo: 'Estado', tipo: 'texto', ancho: 10 },
            ],
            filas: [
              ...filas.map((f) => [
                `CG-${f.consecutivo}`,
                new Date(f.fecha + 'T00:00:00'),
                f.fechaVencimiento ? new Date(f.fechaVencimiento + 'T00:00:00') : null,
                f.terceroNombre,
                etiquetaSoporte(f.tipoSoporte),
                f.numeroSoporte ?? '',
                f.descripcion ?? '',
                Number(f.subtotal) || 0,
                Number(f.iva) || 0,
                Number(f.retenciones) || 0,
                Number(f.totalPagar) || 0,
                Number(f.saldoPendiente) || 0,
                f.estado === 'ANULADA' ? 'Anulada' : 'Causada',
              ]),
              {
                estilo: 'total' as const,
                valores: [
                  'Total causadas', null, null, '', '', '', '',
                  suma('subtotal'), suma('iva'), suma('retenciones'), suma('totalPagar'), suma('saldoPendiente'), '',
                ],
              },
            ],
          },
        ],
      });
    } catch {
      this.alert.showError('Error', 'No se pudo generar el Excel.');
    } finally {
      this.exportando = false;
    }
  }

  private iso(d: Date | null): string | null {
    if (!d) return null;
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
  }
}
