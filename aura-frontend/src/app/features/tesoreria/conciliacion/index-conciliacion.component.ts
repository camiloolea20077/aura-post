import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { TesoreriaService } from '../../../core/services/tesoreria.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TesoreriaMovimientoModel } from '../../../core/models/tesoreria.model';
import { CuentaBancariaModel } from '../../../core/models/cuenta-bancaria.model';

import { aFechaLocal } from '../../../shared/utils/fecha.util';
export interface ExtractoLinea {
  fecha: string;
  concepto: string;
  monto: number;
  matched: boolean;
  movimientoId?: number;
}

@Component({
  selector: 'app-index-conciliacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DropdownModule, CalendarModule, InputNumberModule,
    TableModule, TagModule, ToastModule, TooltipModule, CheckboxModule, BadgeModule,
  ],
  providers: [MessageService],
  templateUrl: './index-conciliacion.component.html',
  styleUrls: ['./index-conciliacion.component.scss'],
})
export class IndexConciliacionComponent implements OnInit {
  cuentas: CuentaBancariaModel[] = [];
  movimientos: TesoreriaMovimientoModel[] = [];
  loading = false;
  toggling: Set<number> = new Set();

  // ── Filtros ───────────────────────────────────────────────────────
  cuentaId: number | null = null;
  rangoFechas: Date[] = [
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    new Date(),
  ];

  // ── Extracto bancario ─────────────────────────────────────────────
  saldoExtracto: number | null = null;
  extractoLineas: ExtractoLinea[] = [];
  importando = false;

  get cuentaActual(): CuentaBancariaModel | null {
    return this.cuentas.find((c) => c.id === this.cuentaId) ?? null;
  }

  // ── Totales calculados ────────────────────────────────────────────
  get totalRecaudosConciliados(): number {
    return this.movimientos
      .filter((m) => m.conciliado && (m.tipo === 'RECAUDO' || m.tipo === 'TRANSFERENCIA_ENTRADA'))
      .reduce((s, m) => s + m.monto, 0);
  }

  get totalEgresosConciliados(): number {
    return this.movimientos
      .filter((m) => m.conciliado && (m.tipo === 'EGRESO' || m.tipo === 'TRANSFERENCIA_SALIDA'))
      .reduce((s, m) => s + m.monto, 0);
  }

  get totalRecaudosPendientes(): number {
    return this.movimientos
      .filter((m) => !m.conciliado && (m.tipo === 'RECAUDO' || m.tipo === 'TRANSFERENCIA_ENTRADA'))
      .reduce((s, m) => s + m.monto, 0);
  }

  get totalEgresosPendientes(): number {
    return this.movimientos
      .filter((m) => !m.conciliado && (m.tipo === 'EGRESO' || m.tipo === 'TRANSFERENCIA_SALIDA'))
      .reduce((s, m) => s + m.monto, 0);
  }

  get saldoSistemaConciliado(): number {
    const saldoInicial = this.cuentaActual?.saldoInicial ?? 0;
    return saldoInicial + this.totalRecaudosConciliados - this.totalEgresosConciliados;
  }

  get diferencia(): number | null {
    if (this.saldoExtracto == null) return null;
    return this.saldoExtracto - this.saldoSistemaConciliado;
  }

  get conciliadosCount(): number {
    return this.movimientos.filter((m) => m.conciliado).length;
  }

  get pendientesCount(): number {
    return this.movimientos.filter((m) => !m.conciliado).length;
  }

  get extractoMatchedCount(): number {
    return this.extractoLineas.filter((l) => l.matched).length;
  }

  get extractoTotal(): number {
    return this.extractoLineas.reduce((s, l) => s + l.monto, 0);
  }

  constructor(
    private readonly service: TesoreriaService,
    private readonly cuentaService: CuentaBancariaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarCuentas();
  }

  async cargarCuentas(): Promise<void> {
    const res = await lastValueFrom(this.cuentaService.list()).catch(() => null);
    this.cuentas = (res?.data ?? []).filter((c) => c.activa);
    this.cdr.markForCheck();
  }

  async cargar(): Promise<void> {
    if (!this.cuentaId || !this.rangoFechas[0] || !this.rangoFechas[1]) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const desde = this.toISO(this.rangoFechas[0]);
      const hasta = this.toISO(this.rangoFechas[1]);
      const res = await lastValueFrom(
        this.service.listarConciliacion(this.cuentaId, desde, hasta),
      );
      this.movimientos = res?.data ?? [];
      // Re-match si hay extracto importado
      if (this.extractoLineas.length) {
        this.matchExtracto();
      }
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar la conciliación');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // Llamado desde el checkbox — ngModel YA cambió m.conciliado, solo persiste
  async onCheckboxChange(m: TesoreriaMovimientoModel, nuevoValor: boolean): Promise<void> {
    const valorAnterior = !nuevoValor;
    this.toggling.add(m.id);
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.toggleConciliado(m.id));
    } catch {
      m.conciliado = valorAnterior; // revertir si falla
      this.alertService.showError('Error', 'No se pudo actualizar');
    } finally {
      this.toggling.delete(m.id);
      this.cdr.markForCheck();
    }
  }

  async conciliarTodos(): Promise<void> {
    const pendientes = this.movimientos.filter((m) => !m.conciliado);
    if (!pendientes.length) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const ids = pendientes.map((m) => m.id);
      await lastValueFrom(this.service.conciliarLote(ids));
      pendientes.forEach((m) => (m.conciliado = true));
      this.alertService.showSuccess('Todos conciliados', '');
    } catch {
      this.alertService.showError('Error', 'No se pudo conciliar todos');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // ── CSV Import ────────────────────────────────────────────────────
  triggerFileInput(): void {
    document.getElementById('csv-input')?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importando = true;
    this.cdr.markForCheck();

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) ?? '';
        this.extractoLineas = this.parseCSV(text);
        this.matchExtracto();
        this.alertService.showSuccess(
          'CSV importado',
          `${this.extractoLineas.length} líneas cargadas`,
        );
      } catch {
        this.alertService.showError('Error', 'No se pudo leer el archivo CSV');
      } finally {
        this.importando = false;
        this.cdr.markForCheck();
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  /**
   * Parsea CSV con formato: fecha,concepto,monto
   * La primera fila se omite si contiene texto (encabezado).
   * El monto puede ser negativo (salida) o positivo (entrada).
   */
  private parseCSV(text: string): ExtractoLinea[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const result: ExtractoLinea[] = [];

    for (const line of lines) {
      const cols = line.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 3) continue;
      const fecha = cols[0];
      const concepto = cols[1];
      const montoRaw = parseFloat(cols[2].replace(/[$.]/g, '').replace(',', '.'));
      if (isNaN(montoRaw)) continue; // skip encabezado u otras filas no numéricas
      result.push({ fecha, concepto, monto: Math.abs(montoRaw), matched: false });
    }
    return result;
  }

  /**
   * Auto-match: para cada línea de extracto, busca un movimiento del sistema
   * con monto igual (±1 peso) y fecha cercana (±3 días).
   */
  matchExtracto(): void {
    this.extractoLineas.forEach((linea) => {
      linea.matched = false;
      linea.movimientoId = undefined;
    });

    for (const linea of this.extractoLineas) {
      const lineaFecha = new Date(linea.fecha);
      if (isNaN(lineaFecha.getTime())) continue;

      const candidato = this.movimientos.find((m) => {
        if (m.conciliado) return false;
        const diff = Math.abs(m.monto - linea.monto);
        if (diff > 1) return false;
        const mFecha = new Date(m.fecha);
        const diasDiff = Math.abs((mFecha.getTime() - lineaFecha.getTime()) / 86400000);
        return diasDiff <= 3;
      });

      if (candidato) {
        linea.matched = true;
        linea.movimientoId = candidato.id;
      }
    }
    this.cdr.markForCheck();
  }

  async conciliarMatches(): Promise<void> {
    const matchIds = this.extractoLineas
      .filter((l) => l.matched && l.movimientoId != null)
      .map((l) => l.movimientoId!);

    if (!matchIds.length) {
      this.alertService.showError('Sin coincidencias', 'No hay movimientos emparejados para conciliar');
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.conciliarLote(matchIds));
      this.movimientos
        .filter((m) => matchIds.includes(m.id))
        .forEach((m) => (m.conciliado = true));
      this.alertService.showSuccess('Conciliados', `${matchIds.length} movimientos conciliados automáticamente`);
    } catch {
      this.alertService.showError('Error', 'No se pudo conciliar');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  limpiarExtracto(): void {
    this.extractoLineas = [];
    this.cdr.markForCheck();
  }

  isEntrada(m: TesoreriaMovimientoModel): boolean {
    return m.tipo === 'RECAUDO' || m.tipo === 'TRANSFERENCIA_ENTRADA';
  }

  tipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      EGRESO: 'Egreso',
      RECAUDO: 'Recaudo',
      TRANSFERENCIA_SALIDA: 'Transf. Salida',
      TRANSFERENCIA_ENTRADA: 'Transf. Entrada',
    };
    return map[tipo] ?? tipo;
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
  }

  toISO(d: Date): string {
    return aFechaLocal(d);
  }

  get cuentasOpts() {
    return this.cuentas.map((c) => ({ label: c.nombre, value: c.id }));
  }
}
