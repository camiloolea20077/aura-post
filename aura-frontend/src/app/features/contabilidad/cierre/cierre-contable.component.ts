import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

import { CierreContableService } from '../../../core/services/cierre-contable.service';
import { CierreContableDto } from '../../../core/models/cierre-contable.model';

@Component({
  selector: 'app-cierre-contable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './cierre-contable.component.html',
  styleUrls: ['./cierre-contable.component.scss'],
})
export class CierreContableComponent implements OnInit {
  data: CierreContableDto | null = null;
  loading = false;

  fechaDesde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  fechaHasta: Date = new Date();

  constructor(
    private readonly service: CierreContableService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.obtener(this.fmt(this.fechaDesde), this.fmt(this.fechaHasta)),
      );
      this.data = res?.data ?? null;
    } catch {
      this.data = null;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  formatCOP(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  pct(v: number | null | undefined): string {
    if (v == null) return '—';
    return v.toFixed(1) + '%';
  }

  utilClass(v: number | null | undefined): string {
    if (v == null || v === 0) return 'neutral';
    return v > 0 ? 'positivo' : 'negativo';
  }

  posNeta(v: number | null | undefined): 'success' | 'warn' | 'danger' {
    if (v == null || v === 0) return 'warn';
    return v > 0 ? 'success' : 'danger';
  }

  async exportarExcel(): Promise<void> {
    if (!this.data) return;
    const d = this.data;
    const n = (v: number | null | undefined) => v ?? 0;

    // ── Paleta ────────────────────────────────────────────────
    const C = {
      indigo:    '6366F1', indigoDark: '4F46E5',
      green:     '10B981', greenDark:  '059669',
      red:       'EF4444',
      blue:      '3B82F6',
      dark:      '1E293B',
      muted:     '64748B',
      border:    'E2E8F0',
      bgLight:   'F8FAFC',
      bgAlt:     'EEF2FF',
      white:     'FFFFFF',
    };

    const copFmt = '#,##0';

    const fill = (argb: string): any =>
      ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

    const border = (argb: string = C.border): any =>
      ({ style: 'thin', color: { argb } });

    const allBorders = (argb: string = C.border) => ({
      top: border(argb), left: border(argb),
      bottom: border(argb), right: border(argb),
    });

    const styleTitle = (row: any) => {
      row.height = 28;
      row.eachCell((cell: any) => {
        cell.fill = fill(C.indigo);
        cell.font = { bold: true, size: 16, color: { argb: C.white }, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    };

    const styleSubtitle = (row: any) => {
      row.height = 16;
      row.eachCell((cell: any) => {
        cell.fill = fill(C.bgLight);
        cell.font = { size: 9, color: { argb: C.muted }, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });
    };

    const styleSectionHeader = (row: any, color = C.indigoDark) => {
      row.height = 20;
      row.eachCell((cell: any) => {
        cell.fill = fill(color);
        cell.font = { bold: true, size: 10, color: { argb: C.white }, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = allBorders(color);
      });
    };

    const styleColHeader = (row: any) => {
      row.height = 16;
      row.eachCell((cell: any) => {
        cell.fill = fill(C.dark);
        cell.font = { bold: true, size: 9, color: { argb: C.white }, name: 'Calibri' };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = allBorders(C.dark);
      });
    };

    const styleDataRow = (row: any, alt = false) => {
      row.height = 15;
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.fill = fill(alt ? C.bgAlt : C.white);
        cell.font = { size: 9, name: 'Calibri' };
        cell.border = allBorders();
        cell.alignment = { vertical: 'middle' };
      });
    };

    const styleSubtotal = (row: any, color = C.bgLight) => {
      row.height = 16;
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.fill = fill(color);
        cell.font = { bold: true, size: 9, name: 'Calibri' };
        cell.border = allBorders(C.border);
        cell.alignment = { vertical: 'middle' };
      });
    };

    const styleTotal = (row: any, bgColor = C.indigo) => {
      row.height = 18;
      row.eachCell({ includeEmpty: true }, (cell: any) => {
        cell.fill = fill(bgColor);
        cell.font = { bold: true, size: 10, color: { argb: C.white }, name: 'Calibri' };
        cell.border = allBorders(bgColor);
        cell.alignment = { vertical: 'middle' };
      });
    };

    const addEmpty = (sheet: any) => {
      const r = sheet.addRow([]);
      r.height = 8;
    };

    // ── Workbook ──────────────────────────────────────────────
    const wb = new Workbook();
    wb.creator = 'Aura POS';
    wb.created = new Date();

    const ws = wb.addWorksheet('Cierre Contable', {
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 },
      properties: { tabColor: { argb: C.indigo } },
    });

    ws.columns = [
      { key: 'A', width: 34 },
      { key: 'B', width: 14 },
      { key: 'C', width: 20 },
      { key: 'D', width: 16 },
      { key: 'E', width: 12 },
    ];

    // ── Título ─────────────────────────────────────────────────
    const rowTitulo = ws.addRow(['CIERRE CONTABLE', '', '', '', '']);
    ws.mergeCells(`A${rowTitulo.number}:E${rowTitulo.number}`);
    styleTitle(rowTitulo);

    const rowSub = ws.addRow([
      `Período: ${d.fechaDesde}  →  ${d.fechaHasta}`,
      '', '',
      `Generado: ${new Date().toLocaleDateString('es-CO')}`, '',
    ]);
    ws.mergeCells(`A${rowSub.number}:C${rowSub.number}`);
    ws.mergeCells(`D${rowSub.number}:E${rowSub.number}`);
    styleSubtitle(rowSub);
    rowSub.getCell('D').alignment = { horizontal: 'right' };

    addEmpty(ws);

    // ── KPIs rápidos ───────────────────────────────────────────
    const rowKpiH = ws.addRow(['INDICADORES CLAVE', '', '', '', '']);
    ws.mergeCells(`A${rowKpiH.number}:E${rowKpiH.number}`);
    styleSectionHeader(rowKpiH, C.dark);

    const rowKpiCols = ws.addRow(['Ventas netas', 'Compras', 'Utilidad bruta', 'Utilidad neta', 'Margen neto']);
    styleColHeader(rowKpiCols);

    const rowKpiVals = ws.addRow([
      n(d.totalVentasNeto), n(d.totalComprasNeto),
      n(d.utilidadBruta),   n(d.utilidadNeta),
      (n(d.margenNeto) / 100),
    ]);
    rowKpiVals.height = 18;
    rowKpiVals.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill   = fill(C.bgAlt);
      cell.font   = { bold: true, size: 11, name: 'Calibri' };
      cell.border = allBorders();
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (col <= 4) cell.numFmt = `"$"#,##0`;
      if (col === 5) {
        cell.numFmt = '0.00"%"';
        cell.font.color = { argb: n(d.margenNeto) >= 0 ? C.green : C.red };
      }
      if (col === 3) cell.font.color = { argb: n(d.utilidadBruta) >= 0 ? C.greenDark : C.red };
      if (col === 4) cell.font.color = { argb: n(d.utilidadNeta)  >= 0 ? C.greenDark : C.red };
    });

    addEmpty(ws);

    // ── Estado de Resultados ───────────────────────────────────
    const rowPlH = ws.addRow(['ESTADO DE RESULTADOS (P&L)', '', '', '', '']);
    ws.mergeCells(`A${rowPlH.number}:E${rowPlH.number}`);
    styleSectionHeader(rowPlH, C.indigo);

    const rowPlCols = ws.addRow(['Concepto', '', 'Valor (COP)', 'Margen', '']);
    ws.mergeCells(`A${rowPlCols.number}:B${rowPlCols.number}`);
    styleColHeader(rowPlCols);

    const addPlRow = (label: string, value: number, margen?: string, isSubtotal = false, isTotal = false, isDebit = false, alt = false) => {
      const r = ws.addRow([label, '', value, margen ?? '', '']);
      ws.mergeCells(`A${r.number}:B${r.number}`);
      ws.mergeCells(`D${r.number}:E${r.number}`);
      if (isTotal)    styleTotal(r, value >= 0 ? C.indigoDark : C.red);
      else if (isSubtotal) styleSubtotal(r, C.bgLight);
      else            styleDataRow(r, alt);

      const cellA = r.getCell('A');
      const cellC = r.getCell('C');
      const cellD = r.getCell('D');

      cellA.alignment = { horizontal: 'left',   vertical: 'middle' };
      cellC.alignment = { horizontal: 'right',  vertical: 'middle' };
      cellD.alignment = { horizontal: 'center', vertical: 'middle' };
      cellC.numFmt = isDebit ? `"($"#,##0")"` : `"$"#,##0`;
      if (!isTotal) {
        if (isDebit) cellC.font = { ...cellC.font, color: { argb: C.red } };
        else if (value > 0) cellC.font = { ...cellC.font, color: { argb: isSubtotal || isTotal ? C.dark : C.green } };
      }
      if (margen) cellD.font = { ...cellD.font, size: 9, color: { argb: C.muted } };
    };

    addPlRow('Ventas brutas',             n(d.totalVentasBruto));
    if (n(d.totalDescuentos) > 0)
      addPlRow('(−) Descuentos',          n(d.totalDescuentos), '', false, false, true, true);
    addPlRow('Impuestos incluidos',       n(d.totalImpuestos), '', false, false, false, false);
    addPlRow('= Ventas netas',            n(d.totalVentasNeto), '', true);

    addEmpty(ws);
    addPlRow('(−) Costo de compras',      n(d.totalComprasNeto), '', false, false, true, true);
    addPlRow('= Utilidad bruta',          n(d.utilidadBruta),   `${this.pct(d.margenBruto)} sobre ventas`, true);

    if (n(d.totalComisionesTecnicos) > 0) {
      addEmpty(ws);
      addPlRow('(−) Comisiones técnicos', n(d.totalComisionesTecnicos), '', false, false, true, false);
    }
    if (n(d.totalMermas) > 0) {
      addPlRow('(−) Mermas aprobadas',    n(d.totalMermas), '', false, false, true, true);
    }
    addPlRow('= Utilidad neta aprox.',    n(d.utilidadNeta), `${this.pct(d.margenNeto)} sobre ventas`, false, true);

    addEmpty(ws);

    // ── Resumen de operaciones ─────────────────────────────────
    const rowOpH = ws.addRow(['RESUMEN DE OPERACIONES', '', '', '', '']);
    ws.mergeCells(`A${rowOpH.number}:E${rowOpH.number}`);
    styleSectionHeader(rowOpH, C.blue);

    const rowOpCols = ws.addRow(['Concepto', 'Cantidad', 'Total (COP)', 'Promedio', '']);
    styleColHeader(rowOpCols);

    const addOpRow = (label: string, qty: number, total: number, alt = false) => {
      const avg = qty > 0 ? total / qty : 0;
      const r = ws.addRow([label, qty, total, avg, '']);
      styleDataRow(r, alt);
      r.getCell('A').alignment = { horizontal: 'left',   vertical: 'middle' };
      r.getCell('B').alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell('C').numFmt = `"$"#,##0`;
      r.getCell('C').alignment = { horizontal: 'right',  vertical: 'middle' };
      r.getCell('D').numFmt = `"$"#,##0`;
      r.getCell('D').alignment = { horizontal: 'right',  vertical: 'middle' };
      r.getCell('D').font = { size: 9, color: { argb: C.muted }, name: 'Calibri' };
    };

    addOpRow('Ventas',              n(d.cantidadVentas),     n(d.totalVentasNeto));
    addOpRow('Compras',             n(d.cantidadCompras),    n(d.totalComprasNeto),          true);
    addOpRow('Comisiones técnicos', n(d.cantidadComisiones), n(d.totalComisionesTecnicos));
    addOpRow('Mermas aprobadas',    n(d.cantidadMermas),     n(d.totalMermas),               true);
    addOpRow('Ingresos de caja',    n(d.cantidadIngresos),   n(d.totalIngresos));
    addOpRow('Egresos de caja',     n(d.cantidadEgresos),    n(d.totalEgresos),              true);

    addEmpty(ws);

    // ── Posición de cartera ────────────────────────────────────
    const rowCarH = ws.addRow(['POSICIÓN DE CARTERA', '', '', '', '']);
    ws.mergeCells(`A${rowCarH.number}:E${rowCarH.number}`);
    styleSectionHeader(rowCarH, '7C3AED');   // purple

    const rowCarCols = ws.addRow(['Concepto', 'Total deuda', 'Saldo pendiente', 'Ctas. activas', 'Vencidas']);
    styleColHeader(rowCarCols);

    const addCarRow = (label: string, deuda: number, saldo: number, activas: number, vencidas: number, alt = false) => {
      const r = ws.addRow([label, deuda, saldo, activas, vencidas]);
      styleDataRow(r, alt);
      r.getCell('A').alignment = { horizontal: 'left',   vertical: 'middle' };
      r.getCell('B').numFmt = `"$"#,##0`;  r.getCell('B').alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell('C').numFmt = `"$"#,##0`;  r.getCell('C').alignment = { horizontal: 'right', vertical: 'middle' };
      r.getCell('D').alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell('E').alignment = { horizontal: 'center', vertical: 'middle' };
      if (vencidas > 0) r.getCell('E').font = { bold: true, size: 9, color: { argb: C.red }, name: 'Calibri' };
    };

    addCarRow('Cuentas por cobrar (CxC)',
      n(d.cxcTotalDeuda), n(d.cxcSaldoPendiente), n(d.cxcCantidadActivas), n(d.cxcCantidadVencidas));
    addCarRow('Cuentas por pagar (CxP)',
      n(d.cxpTotalDeuda), n(d.cxpSaldoPendiente), n(d.cxpCantidadActivas), n(d.cxpCantidadVencidas), true);

    // Posición neta
    const posNeta = n(d.posicionNeta);
    const rowPos = ws.addRow(['Posición neta (CxC − CxP)', '', posNeta, '', '']);
    ws.mergeCells(`A${rowPos.number}:B${rowPos.number}`);
    ws.mergeCells(`D${rowPos.number}:E${rowPos.number}`);
    styleTotal(rowPos, posNeta >= 0 ? C.greenDark : C.red);
    rowPos.getCell('A').alignment = { horizontal: 'left',  vertical: 'middle' };
    rowPos.getCell('C').numFmt   = `"$"#,##0`;
    rowPos.getCell('C').alignment = { horizontal: 'right', vertical: 'middle' };

    addEmpty(ws);

    // ── Pie de página ─────────────────────────────────────────
    const rowFoot = ws.addRow([`Generado por Aura POS · ${new Date().toLocaleString('es-CO')}`, '', '', '', '']);
    ws.mergeCells(`A${rowFoot.number}:E${rowFoot.number}`);
    rowFoot.height = 14;
    rowFoot.getCell('A').font      = { size: 8, italic: true, color: { argb: C.muted }, name: 'Calibri' };
    rowFoot.getCell('A').alignment = { horizontal: 'center', vertical: 'middle' };

    // ── Descargar ─────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `cierre-contable_${d.fechaDesde}_${d.fechaHasta}.xlsx`);
  }
}
