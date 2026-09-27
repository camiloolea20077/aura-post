import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { lastValueFrom } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

import { AlertService } from '../../../shared/pipes/alert.service';
import { DeclaracionesService } from '../../../core/services/declaraciones.service';
import { BorradorDeclaracionModel } from '../../../core/models/declaraciones.model';

type Periodicidad = 'BIMESTRAL' | 'CUATRIMESTRAL';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Borradores de IVA (300) y retención en la fuente (350) leídos del mayor.
 *
 * <p>No reemplaza el formulario de la DIAN: agrupa cada valor por el documento
 * que lo originó, con el detalle por cuenta y las advertencias de lo que el
 * sistema no puede afirmar, para que el contador lo traslade y lo cuadre.
 */
@Component({
  selector: 'app-declaraciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, TabViewModule],
  templateUrl: './declaraciones.component.html',
  styleUrls: ['./declaraciones.component.scss'],
})
export class DeclaracionesComponent {
  readonly anios: { label: string; value: number }[];
  readonly meses = MESES.map((m, i) => ({ label: m, value: i + 1 }));
  readonly periodicidades = [
    { label: 'Bimestral', value: 'BIMESTRAL' as Periodicidad },
    { label: 'Cuatrimestral', value: 'CUATRIMESTRAL' as Periodicidad },
  ];

  // IVA
  periodicidad: Periodicidad = 'BIMESTRAL';
  anioIva: number;
  periodoIva: number;
  iva: BorradorDeclaracionModel | null = null;
  cargandoIva = false;
  verCuentasIva = false;

  // Retención
  anioRet: number;
  mesRet: number;
  ret: BorradorDeclaracionModel | null = null;
  cargandoRet = false;
  verCuentasRet = false;

  constructor(
    private readonly service: DeclaracionesService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    this.anios = [anio - 2, anio - 1, anio].map((a) => ({ label: `${a}`, value: a }));
    this.anioIva = anio;
    this.anioRet = anio;
    // Por defecto el período anterior: es el que toca declarar.
    const mesAnterior = hoy.getMonth() === 0 ? 12 : hoy.getMonth();
    this.mesRet = mesAnterior;
    if (hoy.getMonth() === 0) this.anioRet = anio - 1;
    this.periodoIva = Math.max(1, Math.ceil(hoy.getMonth() / 2));
  }

  get periodosIva(): { label: string; value: number }[] {
    const tam = this.periodicidad === 'BIMESTRAL' ? 2 : 4;
    const n = 12 / tam;
    return Array.from({ length: n }, (_, i) => ({
      label: `${i + 1}. ${MESES[i * tam]} – ${MESES[i * tam + tam - 1]}`,
      value: i + 1,
    }));
  }

  onPeriodicidad(): void {
    if (this.periodoIva > this.periodosIva.length) this.periodoIva = this.periodosIva.length;
  }

  private rangoIva(): [string, string] {
    const tam = this.periodicidad === 'BIMESTRAL' ? 2 : 4;
    const mesIni = (this.periodoIva - 1) * tam;
    return [this.iso(this.anioIva, mesIni, 1), this.iso(this.anioIva, mesIni + tam, 0)];
  }

  private rangoRet(): [string, string] {
    return [this.iso(this.anioRet, this.mesRet - 1, 1), this.iso(this.anioRet, this.mesRet, 0)];
  }

  /** Fecha local YYYY-MM-DD (día 0 = último día del mes anterior). */
  private iso(anio: number, mes: number, dia: number): string {
    const d = new Date(anio, mes, dia);
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
  }

  async generarIva(): Promise<void> {
    const [d, h] = this.rangoIva();
    this.cargandoIva = true;
    this.cdr.markForCheck();
    try {
      this.iva = (await lastValueFrom(this.service.iva(d, h)))?.data ?? null;
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo generar el borrador de IVA.');
    } finally {
      this.cargandoIva = false;
      this.cdr.markForCheck();
    }
  }

  async generarRet(): Promise<void> {
    const [d, h] = this.rangoRet();
    this.cargandoRet = true;
    this.cdr.markForCheck();
    try {
      this.ret = (await lastValueFrom(this.service.retencion(d, h)))?.data ?? null;
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo generar el borrador de retención.');
    } finally {
      this.cargandoRet = false;
      this.cdr.markForCheck();
    }
  }

  // Se pasan a la plantilla compartida: flechas para no perder el this.
  toggleCuentasIva = (): void => {
    this.verCuentasIva = !this.verCuentasIva;
    this.cdr.markForCheck();
  };

  toggleCuentasRet = (): void => {
    this.verCuentasRet = !this.verCuentasRet;
    this.cdr.markForCheck();
  };

  formatCOP = (v: number | null | undefined): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  async exportar(b: BorradorDeclaracionModel): Promise<void> {
    const wb = new Workbook();
    const ws = wb.addWorksheet(b.tipo === 'IVA' ? 'Borrador IVA' : 'Borrador retención');
    ws.columns = [{ width: 60 }, { width: 20 }, { width: 18 }, { width: 18 }];
    const titulo = b.tipo === 'IVA'
      ? 'BORRADOR DECLARACIÓN DE IVA (FORMULARIO 300)'
      : 'BORRADOR RETENCIÓN EN LA FUENTE (FORMULARIO 350)';
    [(b.empresaNombre ?? '').toUpperCase(), b.nit ? `NIT ${b.nit}` : '', titulo,
      `Del ${b.desde} al ${b.hasta}`].forEach((t, i) => {
      const r = ws.addRow([t]);
      ws.mergeCells(r.number, 1, r.number, 4);
      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(1).font = { bold: i !== 1 };
    });
    ws.addRow([]);
    for (const s of b.secciones) {
      const rs = ws.addRow([s.titulo + (s.informativa ? ' (informativo)' : ''), s.total]);
      rs.font = { bold: true };
      rs.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      s.renglones.forEach((r) => ws.addRow(['   ' + r.concepto, r.valor]));
    }
    const rr = ws.addRow([b.resultadoEtiqueta.toUpperCase(), Math.abs(b.resultado)]);
    rr.font = { bold: true };
    if (b.basesPorTarifa.length) {
      ws.addRow([]);
      const h = ws.addRow(['Bases por tarifa (documentos)', 'Base', 'Valor', 'Documentos']);
      h.font = { bold: true };
      b.basesPorTarifa.forEach((t) =>
        ws.addRow([`${t.origen} · ${t.tarifa}%`, t.base, t.valor, t.documentos]),
      );
    }
    if (b.advertencias.length) {
      ws.addRow([]);
      ws.addRow(['Advertencias']).font = { bold: true };
      b.advertencias.forEach((a) => ws.addRow([a]));
    }
    ws.getColumn(2).numFmt = '#,##0;[Red]-#,##0';
    ws.getColumn(3).numFmt = '#,##0;[Red]-#,##0';
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `borrador-${b.tipo.toLowerCase()}_${b.desde}_${b.hasta}.xlsx`);
  }
}
