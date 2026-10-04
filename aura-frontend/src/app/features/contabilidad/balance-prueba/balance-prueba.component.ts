import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { BalancePruebaModel } from '../../../core/models/contador.model';

/**
 * Balance de prueba (Fase 4): saldo anterior, débitos, créditos y saldo final
 * por cuenta hasta el nivel elegido, con filtros y comparativo mes o año.
 */
import { CuentaAutocompleteComponent } from '../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';

@Component({
  selector: 'app-balance-prueba',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CuentaAutocompleteComponent, CommonModule, FormsModule, ButtonModule, TableModule, DropdownModule, CalendarModule, InputTextModule,
    TerceroAutocompleteComponent],
  templateUrl: './balance-prueba.component.html',
  styleUrls: ['./balance-prueba.component.scss'],
})
export class BalancePruebaComponent implements OnInit {
  loading = false;
  data: BalancePruebaModel | null = null;

  desde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  hasta: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  nivel = 4;
  cuentaDesde = '';
  cuentaHasta = '';
  terceroId: number | null = null;
  comparar: string | null = null;

  readonly niveles = [
    { label: 'Clase (1 dígito)', value: 1 },
    { label: 'Grupo (2 dígitos)', value: 2 },
    { label: 'Cuenta (4 dígitos)', value: 3 },
    { label: 'Subcuenta (6 dígitos)', value: 4 },
    { label: 'Auxiliar (todo)', value: 99 },
  ];
  readonly comparaciones = [
    { label: 'Mes anterior', value: 'MES_ANTERIOR' },
    { label: 'Mismo período del año anterior', value: 'ANIO_ANTERIOR' },
  ];

  constructor(
    private readonly service: ContabilidadService,
    private readonly alert: AlertService,
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
        this.service.balancePrueba({
          desde: aFechaLocal(this.desde),
          hasta: aFechaLocal(this.hasta),
          nivel: this.nivel,
          cuentaDesde: this.cuentaDesde.trim() || null,
          cuentaHasta: this.cuentaHasta.trim() || null,
          terceroId: this.terceroId,
          comparar: this.comparar,
        }),
      );
      this.data = res?.data ?? null;
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo generar el balance de prueba');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  exportarCsv(): void {
    if (!this.data) return;
    const comp = !!this.data.comparadoDesde;
    const cab = ['Código', 'Cuenta', 'Saldo anterior', 'Débitos', 'Créditos', 'Saldo final'];
    if (comp) cab.push('Saldo comparado', 'Variación', 'Variación %');
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas = this.data.filas.map((f) => {
      const base: unknown[] = [f.codigo, f.nombre, f.saldoAnterior, f.debitos, f.creditos, f.saldoFinal];
      if (comp) base.push(f.saldoComparado ?? 0, f.variacion ?? 0, f.variacionPct ?? '');
      return base.map(esc).join(';');
    });
    const blob = new Blob(['﻿' + [cab.map(esc).join(';'), ...filas].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `balance-prueba-${aFechaLocal(this.desde)}-${aFechaLocal(this.hasta)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
