import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';

import { RenovacionModel, SalarioHistorialModel } from '../../../../core/models/contrato.model';
import { ContratoService } from '../../../../core/services/contrato.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { HistorialPagosComponent } from '../../empleados/historial-pagos/historial-pagos.component';

/**
 * Historial de la vinculación: cambios de salario (con su variación),
 * renovaciones y los pagos de nómina del empleado.
 */
@Component({
  selector: 'app-historial-vinculacion',
  standalone: true,
  imports: [CommonModule, TableModule, HistorialPagosComponent],
  templateUrl: './historial-vinculacion.component.html',
  styleUrls: ['../../tab-detalle.scss'],
})
export class HistorialVinculacionComponent implements OnChanges {
  @Input({ required: true }) vinculacionId!: number;
  @Input({ required: true }) empleadoId!: number;

  salarios: SalarioHistorialModel[] = [];
  renovaciones: RenovacionModel[] = [];

  constructor(
    private readonly contratos: ContratoService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(): void {
    void this.cargar();
  }

  /** Recarga (p. ej. después de cambiar el salario). */
  async cargar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.contratos.obtener(this.vinculacionId));
      this.salarios = res.data?.historialSalarios ?? [];
      this.renovaciones = res.data?.renovaciones ?? [];
    } catch {
      this.alert.showError('Historial', 'No se pudo cargar el historial.');
    }
  }
}
