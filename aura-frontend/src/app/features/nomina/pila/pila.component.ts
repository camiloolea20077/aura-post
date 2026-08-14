import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { lastValueFrom } from 'rxjs';

import { PilaService } from '../../../core/services/pila.service';
import {
  EstadoPila,
  EstadoPlanillaPila,
  PilaAportanteConfigModel,
  PilaCotizanteModel,
  PilaEncabezadoModel,
  ReporteValidacionPilaModel,
  SeveridadPila,
} from '../../../core/models/pila.model';
import { AlertService } from '../../../shared/pipes/alert.service';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | undefined;

@Component({
  selector: 'app-pila',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    CalendarModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './pila.component.html',
  styleUrls: ['./pila.component.scss'],
})
export class PilaComponent implements OnInit {
  planillas: PilaEncabezadoModel[] = [];
  loading = true;

  /** Mes a generar. */
  mes: Date = new Date();
  generando = false;

  // Problemas de validación (409) — texto accionable por empleado
  showProblemas = false;
  problemas = '';

  // Cotizantes de una planilla
  showCotizantes = false;
  cotizantes: PilaCotizanteModel[] = [];
  cargandoCotizantes = false;
  planillaAbierta: PilaEncabezadoModel | null = null;

  // Validación tipo UGPP (P1)
  showValidacion = false;
  validando = false;
  reporte: ReporteValidacionPilaModel | null = null;

  // Configuración del aportante (P4b)
  showConfig = false;
  savingConfig = false;
  config: PilaAportanteConfigModel = this.emptyConfig();

  constructor(
    private readonly service: PilaService,
    private readonly alert: AlertService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.service.listar());
      this.planillas = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las planillas.');
    } finally {
      this.loading = false;
    }
  }

  async generar(): Promise<void> {
    const periodo = this.periodoStr(this.mes);
    this.generando = true;
    try {
      await lastValueFrom(this.service.generar(periodo));
      this.alert.showSuccess('Planilla generada', `PILA de ${periodo} lista.`);
      await this.cargar();
    } catch (err: any) {
      // 409 = faltan datos por empleado. El mensaje trae la lista completa,
      // línea por línea: se muestra íntegro, no un toast que la trunque.
      if (err?.status === 409 && err?.error?.message) {
        this.problemas = err.error.message;
        this.showProblemas = true;
      } else {
        this.alert.showError(
          'Error',
          err?.error?.message ?? 'No se pudo generar la planilla.',
        );
      }
    } finally {
      this.generando = false;
    }
  }

  async verCotizantes(p: PilaEncabezadoModel): Promise<void> {
    this.planillaAbierta = p;
    this.showCotizantes = true;
    this.cargandoCotizantes = true;
    this.cotizantes = [];
    try {
      const res = await lastValueFrom(this.service.cotizantes(p.id));
      this.cotizantes = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar los cotizantes.');
    } finally {
      this.cargandoCotizantes = false;
    }
  }

  async validar(p: PilaEncabezadoModel): Promise<void> {
    this.planillaAbierta = p;
    this.showValidacion = true;
    this.validando = true;
    this.reporte = null;
    try {
      const res = await lastValueFrom(this.service.validar(p.periodo));
      this.reporte = res?.data ?? null;
    } catch {
      this.alert.showError('Error', 'No se pudo validar la planilla.');
      this.showValidacion = false;
    } finally {
      this.validando = false;
    }
  }

  async descargarArchivo(p: PilaEncabezadoModel): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.archivo(p.periodo));
      const contenido = res?.data ?? '';
      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PILA_${p.periodo}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo generar el archivo.',
      );
    }
  }

  async abrirConfig(): Promise<void> {
    this.showConfig = true;
    try {
      const res = await lastValueFrom(this.service.getAportanteConfig());
      this.config = { ...this.emptyConfig(), ...(res?.data ?? {}) };
    } catch {
      this.config = this.emptyConfig();
    }
  }

  async guardarConfig(): Promise<void> {
    this.savingConfig = true;
    try {
      await lastValueFrom(this.service.guardarAportanteConfig(this.config));
      this.alert.showSuccess(
        'Configuración guardada',
        'Se aplicará al generar la PILA.',
      );
      this.showConfig = false;
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo guardar la configuración.',
      );
    } finally {
      this.savingConfig = false;
    }
  }

  private emptyConfig(): PilaAportanteConfigModel {
    return {
      tipoAportante: null,
      claseAportante: null,
      naturalezaAportante: null,
      codActividadEconomica: null,
      codOperador: null,
      formaPresentacion: null,
      repLegalTipoDocumento: null,
      repLegalDocumento: null,
      repLegalApellido1: null,
      repLegalApellido2: null,
      repLegalNombre1: null,
      repLegalNombre2: null,
    };
  }

  // ── Presentación ────────────────────────────────────────────

  severidadColor(s: SeveridadPila): TagSeverity {
    switch (s) {
      case 'ERROR':
        return 'danger';
      case 'ADVERTENCIA':
        return 'warn';
      case 'NO_EVALUABLE':
        return 'secondary';
      case 'INFORMACION':
        return 'info';
      default:
        return 'secondary';
    }
  }

  estadoCotizanteColor(e: string): TagSeverity {
    switch (e) {
      case 'BLOQUEADO':
        return 'danger';
      case 'APTO_CON_ADVERTENCIAS':
        return 'warn';
      case 'NO_EVALUABLE':
        return 'secondary';
      case 'APTO':
        return 'success';
      default:
        return 'secondary';
    }
  }

  estadoPlanillaColor(e: EstadoPlanillaPila): TagSeverity {
    switch (e) {
      case 'BLOQUEADA':
        return 'danger';
      case 'LISTA_CON_ADVERTENCIAS':
        return 'warn';
      case 'NO_EVALUABLE':
        return 'secondary';
      case 'LISTA':
        return 'success';
      default:
        return 'secondary';
    }
  }

  private periodoStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  severidadEstado(e: EstadoPila): TagSeverity {
    switch (e) {
      case 'GENERADA':
        return 'info';
      case 'PRESENTADA':
        return 'warn';
      case 'PAGADA':
        return 'success';
      case 'ANULADA':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  formatMonto(v: number | null): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }
}
