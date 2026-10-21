import { Injectable, inject } from '@angular/core';
import { Workbook, Worksheet } from 'exceljs';
import { saveAs } from 'file-saver';
import { lastValueFrom } from 'rxjs';

import { EmpresaService } from '../../core/services/empresa.service';

/** Cómo se formatea una columna. */
export type TipoColumnaExcel = 'texto' | 'pesos' | 'numero' | 'porcentaje' | 'fecha';

export interface ColumnaExcel {
  titulo: string;
  /** Ancho en caracteres; por defecto según el tipo. */
  ancho?: number;
  tipo?: TipoColumnaExcel;
}

/** Fila normal, de grupo (resaltada) o de total (negrita). */
export interface FilaExcel {
  valores: (string | number | Date | null | undefined)[];
  estilo?: 'grupo' | 'total';
}

export interface HojaExcel {
  nombre: string;
  columnas: ColumnaExcel[];
  /** Filas sueltas (arreglos) o con estilo. */
  filas: (FilaExcel | (string | number | Date | null | undefined)[])[];
}

export interface ReporteExcel {
  titulo: string;
  /** Rango o filtro que se muestra debajo del título ("Del 2026-01-01 al 2026-01-31"). */
  subtitulo?: string | null;
  hojas: HojaExcel[];
  /** Nombre del archivo sin extensión. */
  archivo: string;
}

const FORMATO: Record<TipoColumnaExcel, string | undefined> = {
  texto: undefined,
  pesos: '#,##0;[Red]-#,##0',
  numero: '#,##0.##;[Red]-#,##0.##',
  porcentaje: '0.00%',
  fecha: 'yyyy-mm-dd',
};

const ANCHO: Record<TipoColumnaExcel, number> = {
  texto: 28,
  pesos: 16,
  numero: 12,
  porcentaje: 10,
  fecha: 12,
};

/**
 * Excel de los reportes (docs/PLAN_EXCEL_IMPORTADORES_MODULOS.md §1): mismo formato
 * en todos — empresa y NIT arriba, título, rango, cabecera azul, pesos sin
 * decimales y filas de grupo y total. Los documentos (factura, recibo) no van aquí:
 * siguen solo en PDF.
 */
@Injectable({ providedIn: 'root' })
export class ExcelReporteService {
  private readonly empresaService = inject(EmpresaService);
  private empresa: { nombre: string; nit: string } | null = null;

  async descargar(reporte: ReporteExcel): Promise<void> {
    const empresa = await this.datosEmpresa();
    const wb = new Workbook();
    wb.creator = 'Aura';
    for (const hoja of reporte.hojas) {
      const ws = wb.addWorksheet(this.nombreHoja(hoja.nombre));
      ws.columns = hoja.columnas.map((c) => ({ width: c.ancho ?? ANCHO[c.tipo ?? 'texto'] }));
      this.encabezado(ws, reporte, empresa, Math.max(hoja.columnas.length, 1));
      const cab = ws.addRow(hoja.columnas.map((c) => c.titulo));
      cab.eachCell((c) => {
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        c.alignment = { vertical: 'middle', wrapText: true };
      });
      const primeraFila = cab.number + 1;

      for (const f of hoja.filas) {
        const fila: FilaExcel = Array.isArray(f) ? { valores: f } : f;
        const r = ws.addRow(fila.valores.map((v) => (v === undefined ? null : v)));
        if (fila.estilo === 'grupo') {
          r.font = { bold: true };
          r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
        } else if (fila.estilo === 'total') {
          r.font = { bold: true };
          r.eachCell((c) => (c.border = { top: { style: 'thin' } }));
        }
      }

      hoja.columnas.forEach((c, i) => {
        const formato = FORMATO[c.tipo ?? 'texto'];
        if (!formato) return;
        const col = ws.getColumn(i + 1);
        col.eachCell({ includeEmpty: false }, (cell, fila) => {
          if (fila >= primeraFila) cell.numFmt = formato;
        });
      });
      ws.views = [{ state: 'frozen', ySplit: cab.number }];
    }
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${this.limpiarArchivo(reporte.archivo)}.xlsx`);
  }

  private encabezado(ws: Worksheet, r: ReporteExcel, empresa: { nombre: string; nit: string } | null, columnas: number): void {
    const filas = [
      (empresa?.nombre ?? '').toUpperCase(),
      empresa?.nit ? `NIT ${empresa.nit}` : '',
      r.titulo.toUpperCase(),
      r.subtitulo ?? '',
    ].filter((t, i) => i === 2 || !!t);
    filas.forEach((texto, i) => {
      const row = ws.addRow([texto]);
      if (columnas > 1) ws.mergeCells(row.number, 1, row.number, columnas);
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(1).font = { bold: i === 0 || texto === r.titulo.toUpperCase(), size: i === 0 ? 13 : 11 };
    });
    ws.addRow([]);
  }

  /** Nombre y NIT de la empresa de la sesión; se piden una vez. */
  private async datosEmpresa(): Promise<{ nombre: string; nit: string } | null> {
    if (this.empresa) return this.empresa;
    try {
      const res = await lastValueFrom(this.empresaService.getConfig());
      const e = res?.data;
      if (!e) return null;
      this.empresa = { nombre: e.razonSocial ?? '', nit: e.nit ? (e.dv ? `${e.nit}-${e.dv}` : e.nit) : '' };
      return this.empresa;
    } catch {
      return null;
    }
  }

  /** Excel no acepta en el nombre de la hoja : \ / ? * [ ] y máximo 31 caracteres. */
  private nombreHoja(n: string): string {
    return (n || 'Hoja').replace(/[:\\/?*[\]]/g, ' ').slice(0, 31);
  }

  private limpiarArchivo(n: string): string {
    return (n || 'reporte').normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\w.-]+/g, '_');
  }
}
