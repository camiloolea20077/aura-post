import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { CellValue, Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { lastValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ResponseModel } from '../../utils/responde.models';
import { AlertService } from '../../pipes/alert.service';
import { ColumnaImportar, PlantillaImportar } from './plantillas-catalogo';

export interface ResultadoFilaImportar {
  fila: number;
  estado: 'NUEVO' | 'ACTUALIZA' | 'EXISTE' | 'ERROR' | 'ADVERTENCIA';
  detalle: string;
  mensaje: string;
}

export interface ResultadoImportar {
  confirmado: boolean;
  nuevos: number;
  actualizados: number;
  existentes: number;
  errores: number;
  filas: ResultadoFilaImportar[];
  avisos: string[];
}

type Fila = Record<string, unknown> & { fila: number };

/**
 * Botón "Importar" de catálogo e inventario (docs/PLAN_EXCEL_IMPORTADORES_MODULOS.md §2):
 * descargar plantilla → subir el Excel → validar (el back dice qué entra y qué no) →
 * importar (todo o nada). El archivo se lee aquí y viaja como filas.
 */
@Component({
  selector: 'app-importar-excel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, DialogModule, TagModule],
  templateUrl: './importar-excel.component.html',
  styleUrls: ['./importar-excel.component.scss'],
})
export class ImportarExcelComponent {
  private readonly http = inject(HttpClient);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input({ required: true }) plantilla!: PlantillaImportar;
  /** Campos que se agregan al cuerpo (p. ej. el reconteo al que se carga el conteo). */
  @Input() extra: Record<string, unknown> = {};
  @Output() visibleChange = new EventEmitter<boolean>();
  /** Se importó algo: la pantalla recarga su lista. */
  @Output() importado = new EventEmitter<void>();

  archivo: string | null = null;
  filas: Fila[] = [];
  faltantes: string[] = [];
  resultado: ResultadoImportar | null = null;
  validando = false;
  importando = false;
  soloErrores = true;

  get puedeImportar(): boolean {
    const r = this.resultado;
    return !!r && !r.confirmado && r.errores === 0 && r.nuevos + (r.actualizados ?? 0) > 0;
  }

  get filasVisibles(): ResultadoFilaImportar[] {
    const f = this.resultado?.filas ?? [];
    return (this.soloErrores && (this.resultado?.errores ?? 0) > 0 ? f.filter((x) => x.estado === 'ERROR') : f).slice(0, 300);
  }

  cerrar(): void {
    this.visibleChange.emit(false);
    this.reiniciar();
  }

  private reiniciar(): void {
    this.archivo = null;
    this.filas = [];
    this.faltantes = [];
    this.resultado = null;
  }

  // ── Plantilla ───────────────────────────────────────────────────────────

  async descargarPlantilla(): Promise<void> {
    const p = this.plantilla;
    const wb = new Workbook();
    const ws = wb.addWorksheet('Datos');
    ws.columns = p.columnas.map((col) => ({ header: col.header, key: col.key, width: Math.max(14, col.header.length + 4) }));
    ws.getRow(1).eachCell((cell, i) => {
      const obligatoria = p.columnas[i - 1]?.obligatoria;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: obligatoria ? 'FF2563EB' : 'FF64748B' } };
    });
    // Códigos como texto: Excel les come los ceros del inicio.
    p.columnas.forEach((col, i) => {
      if (col.tipo === 'texto') ws.getColumn(i + 1).numFmt = '@';
    });
    p.ejemplo.forEach((fila) => ws.addRow(fila));

    const ins = wb.addWorksheet('Instrucciones');
    ins.columns = [{ width: 24 }, { width: 13 }, { width: 80 }];
    ins.addRow(['Columna', 'Obligatoria', 'Qué va']).font = { bold: true };
    p.columnas.forEach((col) => ins.addRow([col.header, col.obligatoria ? 'Sí' : 'No', col.ayuda]));
    ins.addRow([]);
    ins.addRow([p.descripcion]);
    ins.addRow(['Las columnas azules son obligatorias. Borre las filas de ejemplo antes de cargar su información.']);

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `plantilla-${p.recurso}.xlsx`);
  }

  // ── Lectura ─────────────────────────────────────────────────────────────

  async onArchivo(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.resultado = null;
    try {
      const wb = new Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      const ws = wb.worksheets[0];
      if (!ws) throw new Error('El archivo no tiene hojas');

      const mapa = new Map<number, ColumnaImportar>();
      ws.getRow(1).eachCell((cell, i) => {
        const h = this.normalizar(this.texto(cell.value));
        const col = this.plantilla.columnas.find(
          (c) => this.normalizar(c.header) === h || c.alias.some((a) => this.normalizar(a) === h),
        );
        if (col) mapa.set(i, col);
      });
      const presentes = new Set([...mapa.values()].map((c) => c.key));
      this.faltantes = this.plantilla.columnas.filter((c) => c.obligatoria && !presentes.has(c.key)).map((c) => c.header);

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
      this.archivo = file.name;
      this.filas = filas;
      if (!filas.length) this.alert.showWarn('Archivo vacío', 'No se encontraron filas con datos.');
      else if (!this.faltantes.length) await this.validar();
    } catch (err: any) {
      this.reiniciar();
      this.alert.showError('No se pudo leer el archivo', err?.message ?? 'Use la plantilla en formato .xlsx');
    } finally {
      this.cdr.markForCheck();
    }
  }

  // ── Validar e importar ──────────────────────────────────────────────────

  async validar(): Promise<void> {
    this.validando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.enviar('validar'));
      this.resultado = res?.data ?? null;
    } catch (err: any) {
      this.alert.showError('No se pudo validar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.validando = false;
      this.cdr.markForCheck();
    }
  }

  async importar(): Promise<void> {
    this.importando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.enviar('confirmar'));
      const r = res?.data ?? null;
      this.resultado = r;
      if (r?.confirmado) {
        const partes = [
          r.nuevos ? `${r.nuevos} nuevo(s)` : '',
          r.actualizados ? `${r.actualizados} actualizado(s)` : '',
        ].filter(Boolean);
        this.alert.showSuccess('Importación realizada', partes.join(' y ') || 'Sin cambios');
        this.importado.emit();
      } else if (r?.avisos?.length) {
        this.alert.showError('No se importó nada', r.avisos.join(' '));
      }
    } catch (err: any) {
      this.alert.showError('No se pudo importar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.importando = false;
      this.cdr.markForCheck();
    }
  }

  private enviar(accion: 'validar' | 'confirmar') {
    return this.http.post<ResponseModel<ResultadoImportar>>(
      `${environment.apiUrl}${this.plantilla.base ?? 'importacion-catalogo'}/${this.plantilla.recurso}/${accion}`,
      { ...this.extra, filas: this.filas },
    );
  }

  severidad(estado: string): 'success' | 'info' | 'secondary' | 'danger' | 'warn' {
    switch (estado) {
      case 'NUEVO':
        return 'success';
      case 'ACTUALIZA':
        return 'info';
      case 'ERROR':
        return 'danger';
      case 'ADVERTENCIA':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  etiqueta(estado: string): string {
    return { NUEVO: 'Nuevo', ACTUALIZA: 'Se actualiza', EXISTE: 'Ya existe', ERROR: 'Error', ADVERTENCIA: 'Aviso' }[estado] ?? estado;
  }

  // ── Conversión de celdas ────────────────────────────────────────────────

  private convertir(v: CellValue, col: ColumnaImportar): unknown {
    if (v === null || v === undefined) return null;
    switch (col.tipo) {
      case 'numero': {
        if (typeof v === 'number') return v;
        const t = this.texto(v).replace(/[$%\s]/g, '');
        if (!t) return null;
        // 1.234.567,89 (Colombia) o 1234567.89
        const n = t.includes(',') ? Number(t.replace(/\./g, '').replace(',', '.')) : Number(t);
        return isNaN(n) ? null : n;
      }
      case 'bool': {
        const t = this.normalizar(this.texto(v));
        if (!t) return null;
        return ['si', 's', 'x', '1', 'true', 'verdadero', 'yes'].includes(t);
      }
      case 'fecha': {
        const iso = (d: Date) =>
          `${d.getUTCFullYear()}-${`${d.getUTCMonth() + 1}`.padStart(2, '0')}-${`${d.getUTCDate()}`.padStart(2, '0')}`;
        // exceljs entrega las fechas en UTC; un número es el serial de Excel.
        if (v instanceof Date) return iso(v);
        if (typeof v === 'number') return iso(new Date(Math.round((v - 25569) * 86400000)));
        const t = this.texto(v).trim();
        const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
        if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
        return t || null;
      }
      default: {
        const t = this.texto(v).trim();
        return t || null;
      }
    }
  }

  private texto(v: CellValue): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return `${v}`;
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
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
