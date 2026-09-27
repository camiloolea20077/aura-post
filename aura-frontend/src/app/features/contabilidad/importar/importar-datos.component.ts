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
import { Workbook, CellValue } from 'exceljs';
import { saveAs } from 'file-saver';

import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import {
  ImportacionService,
  PasoImportacion,
  ResultadoImportacion,
} from '../../../core/services/importacion.service';
import { ColumnaPlantilla, PASOS, PasoPlantilla } from './plantillas-importacion';

type Fila = Record<string, unknown> & { fila: number };

interface EstadoPaso {
  archivo: string | null;
  filas: Fila[];
  columnasFaltantes: string[];
  resultado: ResultadoImportacion | null;
  validando: boolean;
  importando: boolean;
}

/**
 * Migrar una empresa desde otro software, en cuatro pasos y en ese orden:
 * plan de cuentas → terceros → saldos iniciales → cartera y proveedores.
 *
 * <p>El Excel se lee aquí mismo y se envía como filas. Primero se valida (no
 * se graba nada y se ve fila por fila qué pasaría); solo sin errores se puede
 * importar, y el backend vuelve a validar y graba todo o nada.
 */
@Component({
  selector: 'app-importar-datos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, CalendarModule, InputTextModule, TabViewModule, TagModule],
  templateUrl: './importar-datos.component.html',
  styleUrls: ['./importar-datos.component.scss'],
})
export class ImportarDatosComponent {
  readonly pasos = PASOS;
  estado: Record<PasoImportacion, EstadoPaso> = {
    'plan-cuentas': this.vacio(),
    terceros: this.vacio(),
    saldos: this.vacio(),
    documentos: this.vacio(),
  };

  // Saldos
  fechaApertura: Date | null = null;
  cuentaAjuste = '';
  // Documentos abiertos
  tipoDocumentos: 'COBRAR' | 'PAGAR' = 'COBRAR';

  constructor(
    private readonly service: ImportacionService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  private vacio(): EstadoPaso {
    return { archivo: null, filas: [], columnasFaltantes: [], resultado: null, validando: false, importando: false };
  }

  // ── Plantilla ───────────────────────────────────────────────────────────

  async descargarPlantilla(p: PasoPlantilla): Promise<void> {
    const wb = new Workbook();
    const ws = wb.addWorksheet('Datos');
    ws.columns = p.columnas.map((col) => ({ header: col.header, key: col.key, width: Math.max(16, col.header.length + 4) }));
    ws.getRow(1).eachCell((cell, i) => {
      const obligatoria = p.columnas[i - 1]?.obligatoria;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: obligatoria ? 'FF2563EB' : 'FF64748B' } };
    });
    // Documentos y códigos como texto: Excel les come los ceros del inicio.
    p.columnas.forEach((col, i) => {
      if (col.tipo === 'texto') ws.getColumn(i + 1).numFmt = '@';
    });
    p.ejemplo.forEach((fila) => ws.addRow(fila));

    const ins = wb.addWorksheet('Instrucciones');
    ins.columns = [{ width: 24 }, { width: 14 }, { width: 70 }];
    ins.addRow(['Columna', 'Obligatoria', 'Qué va']).font = { bold: true };
    p.columnas.forEach((col) => ins.addRow([col.header, col.obligatoria ? 'Sí' : 'No', col.ayuda]));
    ins.addRow([]);
    ins.addRow(['Borre las filas de ejemplo antes de cargar su información.']);

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `plantilla-${p.paso}.xlsx`);
  }

  // ── Lectura del archivo ─────────────────────────────────────────────────

  async onArchivo(p: PasoPlantilla, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const est = this.estado[p.paso];
    est.resultado = null;
    try {
      const wb = new Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      if (!ws) throw new Error('El archivo no tiene hojas');

      // Encabezados → columna de la plantilla (por nombre o alias, sin tildes).
      const mapa = new Map<number, ColumnaPlantilla>();
      ws.getRow(1).eachCell((cell, i) => {
        const h = this.normalizar(this.texto(cell.value));
        const col = p.columnas.find(
          (c) => this.normalizar(c.header) === h || c.alias.some((a) => this.normalizar(a) === h),
        );
        if (col) mapa.set(i, col);
      });
      const presentes = new Set([...mapa.values()].map((c) => c.key));
      est.columnasFaltantes = p.columnas.filter((c) => c.obligatoria && !presentes.has(c.key)).map((c) => c.header);

      const filas: Fila[] = [];
      ws.eachRow((row, n) => {
        if (n === 1) return;
        const f: Fila = { fila: n };
        let conDatos = false;
        mapa.forEach((col, i) => {
          const v = this.convertir(row.getCell(i).value, col);
          if (v !== null && v !== '') conDatos = true;
          f[col.key] = v;
        });
        if (conDatos) filas.push(f);
      });
      est.archivo = file.name;
      est.filas = filas;
      if (!filas.length) this.alertService.showWarn('Archivo vacío', 'No se encontraron filas con datos.');
    } catch (err: any) {
      est.archivo = null;
      est.filas = [];
      this.alertService.showError('No se pudo leer el archivo', err?.message ?? 'Use la plantilla en formato .xlsx');
    } finally {
      this.cdr.markForCheck();
    }
  }

  private convertir(v: CellValue, col: ColumnaPlantilla): unknown {
    if (v === null || v === undefined) return null;
    switch (col.tipo) {
      case 'numero': {
        if (typeof v === 'number') return v;
        const t = this.texto(v).replace(/[$\s]/g, '');
        if (!t) return null;
        // 1.234.567,89 (Colombia) o 1234567.89
        const n = t.includes(',') ? Number(t.replace(/\./g, '').replace(',', '.')) : Number(t);
        return isNaN(n) ? null : n;
      }
      case 'fecha': {
        if (v instanceof Date) {
          // exceljs entrega las fechas en UTC
          return `${v.getUTCFullYear()}-${`${v.getUTCMonth() + 1}`.padStart(2, '0')}-${`${v.getUTCDate()}`.padStart(2, '0')}`;
        }
        if (typeof v === 'number') {
          const d = new Date(Math.round((v - 25569) * 86400000));
          return `${d.getUTCFullYear()}-${`${d.getUTCMonth() + 1}`.padStart(2, '0')}-${`${d.getUTCDate()}`.padStart(2, '0')}`;
        }
        const t = this.texto(v);
        const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
      }
      case 'bool': {
        const t = this.normalizar(this.texto(v));
        if (!t) return null;
        return ['si', 's', 'x', '1', 'true', 'verdadero'].includes(t);
      }
      default: {
        const t = this.texto(v).trim();
        return t || null;
      }
    }
  }

  private texto(v: CellValue): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isInteger(v) ? `${v}` : `${v}`;
    if (typeof v === 'string') return v;
    if (typeof v === 'boolean') return v ? 'SI' : 'NO';
    if (v instanceof Date) return v.toISOString();
    const o = v as any;
    if (o.richText) return o.richText.map((r: any) => r.text).join('');
    if (o.text !== undefined) return `${o.text}`;
    if (o.result !== undefined) return `${o.result}`;
    return '';
  }

  private normalizar(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // ── Validar e importar ──────────────────────────────────────────────────

  private cuerpo(paso: PasoImportacion): unknown {
    const filas = this.estado[paso].filas;
    switch (paso) {
      case 'saldos':
        return {
          fechaApertura: this.fechaApertura ? aFechaLocal(this.fechaApertura) : null,
          codigoCuentaAjuste: this.cuentaAjuste.trim() || null,
          filas,
        };
      case 'documentos':
        return { tipo: this.tipoDocumentos, filas };
      default:
        return { filas };
    }
  }

  puedeValidar(p: PasoPlantilla): boolean {
    const est = this.estado[p.paso];
    if (!est.filas.length || est.columnasFaltantes.length) return false;
    return p.paso !== 'saldos' || !!this.fechaApertura;
  }

  puedeImportar(p: PasoPlantilla): boolean {
    const r = this.estado[p.paso].resultado;
    return !!r && !r.confirmado && r.errores === 0 && r.nuevos > 0;
  }

  async validar(p: PasoPlantilla): Promise<void> {
    const est = this.estado[p.paso];
    est.validando = true;
    this.cdr.markForCheck();
    try {
      est.resultado = (await lastValueFrom(this.service.validar(p.paso, this.cuerpo(p.paso))))?.data ?? null;
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo validar el archivo.');
    } finally {
      est.validando = false;
      this.cdr.markForCheck();
    }
  }

  async importar(p: PasoPlantilla): Promise<void> {
    const est = this.estado[p.paso];
    est.importando = true;
    this.cdr.markForCheck();
    try {
      est.resultado = (await lastValueFrom(this.service.confirmar(p.paso, this.cuerpo(p.paso))))?.data ?? null;
      this.alertService.showSuccess('Importado', est.resultado?.avisos?.slice(-1)[0] ?? 'Importación realizada.');
    } catch (err: any) {
      this.alertService.showError('No se importó nada', err?.error?.message ?? 'Revise el archivo y valide de nuevo.');
    } finally {
      est.importando = false;
      this.cdr.markForCheck();
    }
  }

  /** Si se cambian las opciones del paso, la validación anterior ya no vale. */
  invalidar(paso: PasoImportacion): void {
    this.estado[paso].resultado = null;
    this.cdr.markForCheck();
  }

  severidad(estado: string): 'success' | 'info' | 'warn' | 'danger' {
    return estado === 'NUEVO' ? 'success' : estado === 'EXISTE' ? 'info' : estado === 'ADVERTENCIA' ? 'warn' : 'danger';
  }

  etiqueta(estado: string): string {
    return { NUEVO: 'Nuevo', EXISTE: 'Ya existe', ADVERTENCIA: 'Revisar', ERROR: 'Error' }[estado] ?? estado;
  }

  formatCOP = (v: number | null | undefined): string =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);
}
