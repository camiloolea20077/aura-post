import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CalendarModule } from 'primeng/calendar';
import { TabViewModule } from 'primeng/tabview';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { EeffService } from '../../../core/services/eeff.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CambioPatrimonioLinea,
  FlujoEfectivoModel,
} from '../../../core/models/eeff.model';

/**
 * E10 · Estados financieros NIIF: estado de cambios en el patrimonio y flujo
 * de efectivo (método indirecto). El EFE trae su propio cuadre contra el Δ
 * del disponible — si no cuadra, se muestra la alerta tal cual.
 */
@Component({
  selector: 'app-eeff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    CalendarModule,
    TabViewModule,
    SkeletonModule,
  ],
  providers: [MessageService],
  templateUrl: './eeff.component.html',
  styleUrls: ['./eeff.component.scss'],
})
export class EeffComponent {
  rangoFechas: Date[] = [new Date(new Date().getFullYear(), 0, 1), new Date()];

  // ── Cambios en el patrimonio ──────────────────────────────────────
  patrimonio: CambioPatrimonioLinea[] = [];
  loadingPatrimonio = false;
  patrimonioCargado = false;

  // ── Flujo de efectivo ─────────────────────────────────────────────
  flujo: FlujoEfectivoModel | null = null;
  loadingFlujo = false;

  readonly grupoNombres: Record<string, string> = {
    '12': 'Inversiones',
    '13': 'Deudores (cartera)',
    '14': 'Inventarios',
    '15': 'Propiedad, planta y equipo',
    '16': 'Intangibles',
    '17': 'Diferidos',
    '18': 'Otros activos',
    '19': 'Valorizaciones',
    '21': 'Obligaciones financieras',
    '22': 'Proveedores',
    '23': 'Cuentas por pagar',
    '24': 'Impuestos por pagar',
    '25': 'Obligaciones laborales',
    '26': 'Pasivos estimados',
    '27': 'Diferidos pasivos',
    '28': 'Otros pasivos',
    '29': 'Bonos y papeles',
    '31': 'Capital social',
    '32': 'Superávit de capital',
    '33': 'Reservas',
    '34': 'Revalorización',
    '36': 'Resultados del ejercicio',
    '37': 'Resultados acumulados',
    '38': 'Superávit por valorización',
  };

  constructor(
    private readonly service: EeffService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get totales() {
    return this.patrimonio.reduce(
      (t, l) => ({
        inicial: t.inicial + l.saldoInicial,
        aumentos: t.aumentos + l.aumentos,
        disminuciones: t.disminuciones + l.disminuciones,
        final: t.final + l.saldoFinal,
      }),
      { inicial: 0, aumentos: 0, disminuciones: 0, final: 0 },
    );
  }

  async cargarPatrimonio(): Promise<void> {
    if (!this.rangoFechas[0] || !this.rangoFechas[1]) return;
    this.loadingPatrimonio = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.cambiosPatrimonio(
          this.toISO(this.rangoFechas[0]),
          this.toISO(this.rangoFechas[1]),
        ),
      );
      this.patrimonio = res?.data ?? [];
      this.patrimonioCargado = true;
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo generar el estado',
      );
    } finally {
      this.loadingPatrimonio = false;
      this.cdr.markForCheck();
    }
  }

  async cargarFlujo(): Promise<void> {
    if (!this.rangoFechas[0] || !this.rangoFechas[1]) return;
    this.loadingFlujo = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.flujoEfectivo(
          this.toISO(this.rangoFechas[0]),
          this.toISO(this.rangoFechas[1]),
        ),
      );
      this.flujo = res?.data ?? null;
    } catch (e: any) {
      this.alertService.showError(
        'Error',
        e?.error?.message ?? 'No se pudo generar el flujo',
      );
    } finally {
      this.loadingFlujo = false;
      this.cdr.markForCheck();
    }
  }

  generarAmbos(): void {
    this.cargarPatrimonio();
    this.cargarFlujo();
  }

  nombreGrupo(grupo: string): string {
    return this.grupoNombres[grupo] ?? `Grupo ${grupo}`;
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }

  private toISO(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
