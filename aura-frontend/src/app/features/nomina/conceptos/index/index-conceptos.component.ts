import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { CalendarModule } from 'primeng/calendar';
import { lastValueFrom } from 'rxjs';

import { ConceptoService } from '../../../../core/services/concepto.service';
import { ConceptoModel } from '../../../../core/models/concepto.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';
import { FormConceptoComponent } from '../form/form-concepto.component';

/**
 * Catálogo de conceptos de nómina (Fase 3).
 *
 * Muestra los conceptos vigentes en una fecha: los globales de ley y los propios
 * de la empresa, con la precedencia ya resuelta por el backend. Los de ley son
 * de solo lectura; la empresa puede crear uno propio o personalizar uno de ley
 * creando su versión con nueva vigencia.
 */
@Component({
  selector: 'app-index-conceptos',
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
    FormConceptoComponent,
  ],
  templateUrl: './index-conceptos.component.html',
  styleUrls: ['./index-conceptos.component.scss'],
})
export class IndexConceptosComponent implements OnInit {
  items: ConceptoModel[] = [];
  loading = true;

  /** Fecha en la que se miran los conceptos vigentes. Por defecto, hoy. */
  fecha: Date = new Date();

  showForm = false;
  /** Concepto del que se crea una nueva vigencia; null = alta desde cero. */
  baseSeleccionada: ConceptoModel | null = null;

  constructor(
    private readonly service: ConceptoService,
    private readonly alert: AlertService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.vigentes(aFechaLocal(this.fecha) ?? undefined),
      );
      this.items = res.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar los conceptos.');
    } finally {
      this.loading = false;
    }
  }

  nuevo(): void {
    this.baseSeleccionada = null;
    this.showForm = true;
  }

  /**
   * Personalizar un concepto = crear su versión con nueva vigencia.
   *
   * No es "editar": preserva el histórico para poder reliquidar períodos viejos
   * con la tarifa que regía entonces.
   */
  nuevaVersion(c: ConceptoModel): void {
    this.baseSeleccionada = c;
    this.showForm = true;
  }

  onGuardado(): void {
    this.showForm = false;
    this.cargar();
  }

  // ── Presentación ────────────────────────────────────────────

  severidadClase(clase: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (clase) {
      case 'DEVENGADO':
        return 'success';
      case 'DEDUCCION':
        return 'danger';
      case 'APORTE_EMPLEADOR':
        return 'warn';
      default:
        return 'info';
    }
  }

  /** Cómo se paga el concepto: un porcentaje, un valor fijo, o nada. */
  textoTarifa(c: ConceptoModel): string {
    if (c.base === 'FIJO') {
      return c.valorFijo != null
        ? c.valorFijo.toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0,
          })
        : '—';
    }
    if (c.base === 'MANUAL') return 'Manual';
    return c.porcentaje != null ? `${c.porcentaje} %` : '—';
  }

  textoVigencia(c: ConceptoModel): string {
    return c.vigenteHasta ? `${c.vigenteDesde} → ${c.vigenteHasta}` : `Desde ${c.vigenteDesde}`;
  }
}
