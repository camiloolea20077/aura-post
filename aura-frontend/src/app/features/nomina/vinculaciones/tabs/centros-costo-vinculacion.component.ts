import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CentroCostoVinculacion } from '../../../../core/models/vinculacion.model';
import { CentroCostoService } from '../../../../core/services/centro-costo.service';
import { VinculacionService } from '../../../../core/services/vinculacion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

/**
 * Distribución del costo laboral de la vinculación por centro de costo. Sin
 * filas no hay distribución; con filas, deben sumar 100 %.
 */
@Component({
  selector: 'app-centros-costo-vinculacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, SelectModule, TableModule, TooltipModule],
  templateUrl: './centros-costo-vinculacion.component.html',
  styleUrls: ['../../tab-detalle.scss'],
})
export class CentrosCostoVinculacionComponent implements OnChanges {
  @Input({ required: true }) vinculacionId!: number;
  @Input() soloLectura = false;

  filas: CentroCostoVinculacion[] = [];
  opciones: { label: string; value: number }[] = [];
  guardando = false;

  constructor(
    private readonly service: VinculacionService,
    private readonly centros: CentroCostoService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(): void {
    void this.cargar();
  }

  /** Suma de porcentajes (debe dar 100 si hay filas). */
  get total(): number {
    return Math.round(this.filas.reduce((s, f) => s + (f.porcentaje ?? 0), 0) * 100) / 100;
  }

  get cuadra(): boolean {
    return !this.filas.length || this.total === 100;
  }

  private async cargar(): Promise<void> {
    try {
      const [dist, lista] = await Promise.all([
        lastValueFrom(this.service.centrosCosto(this.vinculacionId)),
        lastValueFrom(this.centros.list()),
      ]);
      this.filas = dist.data ?? [];
      this.opciones = (lista.data ?? [])
        .filter((c) => c.permiteMovimientos)
        .map((c) => ({ label: `${c.codigo} — ${c.nombre}`, value: c.id }));
    } catch {
      this.alert.showError('Centros de costo', 'No se pudieron cargar.');
    }
  }

  agregar(): void {
    const restante = Math.max(0, 100 - this.total);
    this.filas = [...this.filas, { centroCostoId: null as unknown as number, porcentaje: restante || 0 }];
  }

  quitar(i: number): void {
    this.filas = this.filas.filter((_, j) => j !== i);
  }

  async guardar(): Promise<void> {
    if (this.filas.some((f) => !f.centroCostoId || !f.porcentaje)) {
      this.alert.showWarn('Centros de costo', 'Cada fila necesita centro de costo y porcentaje.');
      return;
    }
    if (!this.cuadra) {
      this.alert.showWarn('Centros de costo', `Los porcentajes suman ${this.total} %; deben sumar 100 %.`);
      return;
    }
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.service.guardarCentrosCosto(
          this.vinculacionId,
          this.filas.map((f) => ({ centroCostoId: f.centroCostoId, porcentaje: f.porcentaje })),
        ),
      );
      this.filas = res.data ?? [];
      this.alert.showSuccess('Centros de costo', 'Distribución guardada.');
    } catch (err: any) {
      this.alert.showError('Centros de costo', err?.error?.message ?? 'No se pudo guardar.');
    } finally {
      this.guardando = false;
    }
  }
}
