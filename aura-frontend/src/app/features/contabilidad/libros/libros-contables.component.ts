import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';
import { Workbook, Worksheet } from 'exceljs';
import { saveAs } from 'file-saver';

import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { LibrosContablesService } from '../../../core/services/libros-contables.service';
import {
  LibroAuxiliarModel,
  LibroDiarioModel,
} from '../../../core/models/libros-contables.model';

const FORMATO_PESOS = '#,##0;[Red]-#,##0';

/**
 * Libros oficiales: auxiliar por tercero y libro diario.
 *
 * <p>Son los dos reportes que un contador abre todos los días. El Libro Mayor
 * de Asientos Contables muestra una cuenta a la vez y sin tercero; aquí se ve
 * a quién se le debe y quién debe, y el diario completo con sus partidas.
 */
import { CuentaAutocompleteComponent } from '../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';

@Component({
  selector: 'app-libros-contables',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CuentaAutocompleteComponent,
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    InputTextModule,
    TabViewModule,
    TagModule,
    TerceroAutocompleteComponent,
  ],
  templateUrl: './libros-contables.component.html',
  styleUrls: ['./libros-contables.component.scss'],
})
export class LibrosContablesComponent {
  // ── Auxiliar por tercero ────────────────────────────────────────────────
  auxDesde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  auxHasta: Date = new Date();
  cuentaDesde = '';
  cuentaHasta = '';
  terceroId: number | null = null;
  /** Resumido: una fila por tercero. Detallado: además cada movimiento. */
  detallado = false;
  auxiliar: LibroAuxiliarModel | null = null;
  cargandoAux = false;

  // ── Libro diario ────────────────────────────────────────────────────────
  diaDesde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  diaHasta: Date = new Date();
  diario: LibroDiarioModel | null = null;
  cargandoDiario = false;

  constructor(
    private readonly librosService: LibrosContablesService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async generarAuxiliar(): Promise<void> {
    if (!this.auxDesde || !this.auxHasta) {
      this.alertService.showWarn('Fechas', 'Indica el rango de fechas.');
      return;
    }
    this.cargandoAux = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.librosService.auxiliarTercero({
          desde: aFechaLocal(this.auxDesde),
          hasta: aFechaLocal(this.auxHasta),
          cuentaDesde: this.cuentaDesde.trim() || null,
          cuentaHasta: this.cuentaHasta.trim() || this.cuentaDesde.trim() || null,
          terceroId: this.terceroId,
        }),
      );
      this.auxiliar = res?.data ?? null;
    } catch (err: any) {
      this.auxiliar = null;
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo generar el auxiliar.',
      );
    } finally {
      this.cargandoAux = false;
      this.cdr.markForCheck();
    }
  }

  async generarDiario(): Promise<void> {
    if (!this.diaDesde || !this.diaHasta) {
      this.alertService.showWarn('Fechas', 'Indica el rango de fechas.');
      return;
    }
    this.cargandoDiario = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.librosService.diario(aFechaLocal(this.diaDesde), aFechaLocal(this.diaHasta)),
      );
      this.diario = res?.data ?? null;
    } catch (err: any) {
      this.diario = null;
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo generar el libro diario.',
      );
    } finally {
      this.cargandoDiario = false;
      this.cdr.markForCheck();
    }
  }

  onTercero(t: { id: number } | null): void {
    this.terceroId = t?.id ?? null;
  }

  formatCOP = (v: number | null | undefined): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  // ── Excel ───────────────────────────────────────────────────────────────

  private encabezado(ws: Worksheet, titulo: string, empresa: string | null,
      nit: string | null, desde: string, hasta: string, columnas: number): void {
    const filas = [
      (empresa ?? '').toUpperCase(),
      nit ? `NIT ${nit}` : '',
      titulo,
      `Del ${desde} al ${hasta}`,
    ];
    filas.forEach((texto, i) => {
      const r = ws.addRow([texto]);
      ws.mergeCells(r.number, 1, r.number, columnas);
      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(1).font = { bold: i !== 1, size: i === 0 ? 13 : 11 };
    });
    ws.addRow([]);
  }

  private cabecera(ws: Worksheet, titulos: string[]): void {
    const r = ws.addRow(titulos);
    r.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    });
  }

  async exportarAuxiliar(): Promise<void> {
    const a = this.auxiliar;
    if (!a) return;
    const wb = new Workbook();
    const ws = wb.addWorksheet('Auxiliar por tercero');
    ws.columns = [
      { width: 12 }, { width: 16 }, { width: 44 }, { width: 16 },
      { width: 16 }, { width: 16 }, { width: 16 },
    ];
    this.encabezado(ws, 'LIBRO AUXILIAR POR TERCERO', a.empresaNombre, a.nit,
      a.desde, a.hasta, 7);
    this.cabecera(ws, ['Fecha', 'Comprobante', 'Detalle', 'Saldo anterior',
      'Débito', 'Crédito', 'Saldo']);

    for (const c of a.cuentas) {
      const rc = ws.addRow(['', c.codigo, c.nombre, c.saldoAnterior, c.debito,
        c.credito, c.saldoFinal]);
      rc.font = { bold: true };
      rc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      for (const t of c.terceros) {
        const rt = ws.addRow(['', t.documento ?? '', t.nombre ?? '', t.saldoAnterior,
          t.debito, t.credito, t.saldoFinal]);
        rt.font = { bold: this.detallado };
        if (this.detallado) {
          for (const l of t.lineas) {
            ws.addRow([l.fecha, l.numeroComprobante ?? '', l.descripcion ?? '', null,
              l.debito, l.credito, l.saldo]);
          }
        }
      }
    }
    const rTot = ws.addRow(['', '', 'TOTALES', null, a.totalDebito, a.totalCredito, null]);
    rTot.font = { bold: true };
    [4, 5, 6, 7].forEach((col) => (ws.getColumn(col).numFmt = FORMATO_PESOS));

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `auxiliar-tercero_${a.desde}_${a.hasta}.xlsx`);
  }

  async exportarDiario(): Promise<void> {
    const d = this.diario;
    if (!d) return;
    const wb = new Workbook();
    const ws = wb.addWorksheet('Libro diario');
    ws.columns = [
      { width: 12 }, { width: 14 }, { width: 12 }, { width: 34 },
      { width: 34 }, { width: 36 }, { width: 16 }, { width: 16 },
    ];
    this.encabezado(ws, 'LIBRO DIARIO', d.empresaNombre, d.nit, d.desde, d.hasta, 8);
    this.cabecera(ws, ['Fecha', 'Comprobante', 'Cuenta', 'Nombre cuenta', 'Tercero',
      'Detalle', 'Débito', 'Crédito']);

    for (const c of d.comprobantes) {
      const rc = ws.addRow([c.fecha, c.numeroComprobante ?? '', '', c.descripcion ?? '']);
      rc.font = { bold: true };
      rc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      for (const l of c.lineas) {
        const tercero = [l.terceroDocumento, l.terceroNombre].filter(Boolean).join(' — ');
        ws.addRow(['', '', l.cuentaCodigo, l.cuentaNombre, tercero, l.descripcion ?? '',
          l.debito, l.credito]);
      }
    }
    const rTot = ws.addRow(['', '', '', '', '', 'TOTALES', d.totalDebito, d.totalCredito]);
    rTot.font = { bold: true };
    [7, 8].forEach((col) => (ws.getColumn(col).numFmt = FORMATO_PESOS));

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `libro-diario_${d.desde}_${d.hasta}.xlsx`);
  }
}
