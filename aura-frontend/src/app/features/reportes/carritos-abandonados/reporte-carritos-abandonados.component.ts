import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import {
  CarritoAbandonadoService,
  ReporteCarritosAbandonados,
} from '../../../core/services/carrito-abandonado.service';

type Rango = 'HOY' | 'SEMANA' | 'MES' | 'MES_ANTERIOR' | null;

/**
 * Carritos del POS que se vaciaron sin vender: cuánto duraron armados y qué
 * productos tenían. Solo cuentan los que duraron el mínimo de minutos (5 por
 * defecto): armar y corregir en un minuto no es abandonar.
 */
@Component({
  selector: 'app-reporte-carritos-abandonados',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, CalendarModule, InputNumberModule, TooltipModule],
  templateUrl: './reporte-carritos-abandonados.component.html',
  styleUrls: ['./reporte-carritos-abandonados.component.scss'],
})
export class ReporteCarritosAbandonadosComponent implements OnInit {
  desde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  hasta: Date = new Date();
  minutosMinimos = 5;
  rango: Rango = 'MES';
  reporte: ReporteCarritosAbandonados | null = null;
  cargando = false;
  abierto = new Set<number>();

  readonly rangos: { value: Exclude<Rango, null>; label: string }[] = [
    { value: 'HOY', label: 'Hoy' },
    { value: 'SEMANA', label: 'Últimos 7 días' },
    { value: 'MES', label: 'Este mes' },
    { value: 'MES_ANTERIOR', label: 'Mes anterior' },
  ];

  constructor(
    private readonly service: CarritoAbandonadoService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.buscar();
  }

  // ── Filtros ─────────────────────────────────────────────────────────────

  elegirRango(r: Exclude<Rango, null>): void {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();
    this.rango = r;
    switch (r) {
      case 'HOY':
        this.desde = new Date(y, m, hoy.getDate());
        this.hasta = new Date(y, m, hoy.getDate());
        break;
      case 'SEMANA':
        this.desde = new Date(y, m, hoy.getDate() - 6);
        this.hasta = new Date(y, m, hoy.getDate());
        break;
      case 'MES':
        this.desde = new Date(y, m, 1);
        this.hasta = new Date(y, m, hoy.getDate());
        break;
      case 'MES_ANTERIOR':
        this.desde = new Date(y, m - 1, 1);
        this.hasta = new Date(y, m, 0);
        break;
    }
    void this.buscar();
  }

  /** Al tocar una fecha a mano el rango rápido deja de ser cierto. */
  fechaManual(): void {
    this.rango = null;
  }

  async buscar(): Promise<void> {
    if (!this.desde || !this.hasta) return;
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.reporte(aFechaLocal(this.desde), aFechaLocal(this.hasta), this.minutosMinimos ?? 0),
      );
      this.reporte = res?.data ?? null;
      this.abierto.clear();
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo generar el reporte.');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Presentación ────────────────────────────────────────────────────────

  toggle(id: number): void {
    if (this.abierto.has(id)) this.abierto.delete(id);
    else this.abierto.add(id);
    this.cdr.markForCheck();
  }

  get maxValorProducto(): number {
    return Math.max(1, ...(this.reporte?.topProductos ?? []).map((p) => p.valor));
  }

  get maxValorCajero(): number {
    return Math.max(1, ...(this.reporte?.porCajero ?? []).map((c) => c.valor));
  }

  /** Porcentaje del total abandonado que representa un valor. */
  participacion(v: number): number {
    const total = this.reporte?.valor ?? 0;
    return total > 0 ? Math.round((v / total) * 100) : 0;
  }

  /** Qué tan largo fue: sirve para distinguir de un vistazo los que se quedaron olvidados. */
  duracionClase(min: number): string {
    if (min >= 30) return 'dur dur--larga';
    if (min >= 10) return 'dur dur--media';
    return 'dur dur--corta';
  }

  formatoDuracion(min: number): string {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  motivo(m: string): string {
    return m === 'VACIADO' ? 'Vació el carrito' : 'Cerró la orden';
  }

  iniciales(nombre: string | null): string {
    const n = (nombre ?? '?').split('@')[0].replace(/[._-]+/g, ' ').trim();
    const partes = n.split(/\s+/).filter(Boolean);
    return ((partes[0]?.[0] ?? '?') + (partes[1]?.[0] ?? '')).toUpperCase();
  }

  formatCOP = (v: number | null | undefined): string =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v ?? 0);

  // ── Excel ───────────────────────────────────────────────────────────────

  async exportar(): Promise<void> {
    const r = this.reporte;
    if (!r) return;
    const wb = new Workbook();

    const res = wb.addWorksheet('Productos');
    res.columns = [{ width: 44 }, { width: 12 }, { width: 14 }, { width: 16 }];
    res.addRow([`Carritos abandonados del ${r.desde} al ${r.hasta} (mínimo ${r.minutosMinimos} min)`]).font = { bold: true };
    res.addRow([`${r.carritos} carritos · ${this.formatCOP(r.valor)} sin vender · ${r.minutosPromedio} min en promedio`]);
    res.addRow([]);
    res.addRow(['Producto', 'Carritos', 'Cantidad', 'Valor']).font = { bold: true };
    r.topProductos.forEach((p) => res.addRow([p.nombre, p.carritos, p.cantidad, p.valor]));
    res.getColumn(4).numFmt = '#,##0';

    const det = wb.addWorksheet('Carritos');
    det.columns = [{ width: 18 }, { width: 18 }, { width: 10 }, { width: 18 }, { width: 26 }, { width: 40 }, { width: 10 }, { width: 14 }];
    det.addRow(['Inició', 'Se vació', 'Minutos', 'Cómo', 'Cajero', 'Producto', 'Cantidad', 'Subtotal']).font = { bold: true };
    for (const c of r.lista) {
      for (const it of c.detalle) {
        det.addRow([c.iniciadoAt.replace('T', ' '), c.vaciadoAt.replace('T', ' '), c.minutos,
          this.motivo(c.motivo), c.usuario ?? '', it.nombre, it.cantidad, it.subtotal]);
      }
    }
    det.getColumn(8).numFmt = '#,##0';
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `carritos-abandonados_${r.desde}_${r.hasta}.xlsx`);
  }
}
