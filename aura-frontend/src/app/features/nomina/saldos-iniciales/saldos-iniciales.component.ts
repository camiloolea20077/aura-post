import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { NominaService } from '../../../core/services/nomina.service';
import { SaldosInicialesModel } from '../../../core/models/nomina.model';
import { AlertService } from '../../../shared/pipes/alert.service';

/**
 * Carga de saldos iniciales (F7). Las empresas que migran de otro sistema traen
 * saldos que el motor no puede recalcular: días de vacaciones, cesantías
 * acumuladas y el acumulado del año (ingresos/retenciones).
 */
@Component({
  selector: 'app-saldos-iniciales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    CalendarModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './saldos-iniciales.component.html',
  styleUrls: ['./saldos-iniciales.component.scss'],
})
export class SaldosInicialesComponent implements OnInit {
  public filas: SaldosInicialesModel[] = [];
  public loading = false;
  public guardandoId: number | null = null;

  constructor(
    private readonly nominaService: NominaService,
    private readonly alert: AlertService,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.nominaService.listarSaldosIniciales());
      this.filas = (res?.data ?? []).map((f) => ({
        ...f,
        fechaIngreso: f.fechaIngreso ? new Date(f.fechaIngreso) : null,
      }));
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar los saldos.');
      this.filas = [];
    } finally {
      this.loading = false;
    }
  }

  async guardar(fila: SaldosInicialesModel): Promise<void> {
    this.guardandoId = fila.empleadoId;
    try {
      const dto: SaldosInicialesModel = {
        ...fila,
        fechaIngreso: this.toISO(fila.fechaIngreso),
      };
      await lastValueFrom(
        this.nominaService.guardarSaldosIniciales(fila.empleadoId, dto),
      );
      this.alert.showSuccess('Guardado', `Saldos de ${fila.empleadoNombre} actualizados.`);
    } catch {
      this.alert.showError('Error', 'No se pudo guardar.');
    } finally {
      this.guardandoId = null;
    }
  }

  private toISO(v: string | Date | null): string | null {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    if (isNaN(d.getTime())) return null;
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mes}-${dia}`;
  }
}
