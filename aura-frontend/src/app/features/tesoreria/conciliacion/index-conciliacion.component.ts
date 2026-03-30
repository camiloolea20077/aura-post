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
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { TesoreriaService } from '../../../core/services/tesoreria.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { TesoreriaMovimientoModel } from '../../../core/models/tesoreria.model';
import { CuentaBancariaModel } from '../../../core/models/cuenta-bancaria.model';

@Component({
  selector: 'app-index-conciliacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DropdownModule, CalendarModule, InputNumberModule,
    TableModule, TagModule, ToastModule, TooltipModule, CheckboxModule,
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
    for (const m of pendientes) {
      this.toggling.add(m.id);
      try {
        await lastValueFrom(this.service.toggleConciliado(m.id));
        m.conciliado = true;
      } catch {
        this.alertService.showError('Error', `No se pudo conciliar: ${m.concepto}`);
      } finally {
        this.toggling.delete(m.id);
      }
    }
    this.alertService.showSuccess('Todos conciliados', '');
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
    return d.toISOString().slice(0, 10);
  }

  get cuentasOpts() {
    return this.cuentas.map((c) => ({ label: c.nombre, value: c.id }));
  }
}
