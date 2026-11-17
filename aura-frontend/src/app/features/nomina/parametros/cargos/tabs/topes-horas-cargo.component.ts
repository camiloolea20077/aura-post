import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { lastValueFrom } from 'rxjs';

import { CargoTopeHorasModel } from '../../../../../core/models/cargo-plantilla.model';
import { NominaCargoPlantillaService } from '../../../../../core/services/nomina-cargo-plantilla.service';
import { AlertService } from '../../../../../shared/pipes/alert.service';

/** Ley 50 de 1990, art. 22: máximo 2 horas extra al día y 12 a la semana. */
const MAX_EXTRA_DIA = 2;
const MAX_EXTRA_SEMANA = 12;

/**
 * Máximo de horas extra y recargos que se le pueden reportar a quien tenga el
 * cargo, por tipo de hora. Vacío = sin tope. El backend valida el límite legal de
 * horas extra y que un cargo directivo no tenga (art. 162 CST).
 */
@Component({
  selector: 'app-topes-horas-cargo',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputNumberModule, TableModule],
  templateUrl: './topes-horas-cargo.component.html',
  styleUrls: ['../../../tab-detalle.scss'],
})
export class TopesHorasCargoComponent implements OnChanges {
  @Input({ required: true }) cargoId!: number;
  @Input() soloLectura = false;
  /** Cambia cuando la página copia la plantilla de otro cargo: fuerza la recarga. */
  @Input() version = 0;
  /** Nivel directivo: sin horas extra. */
  @Input() esDirectivo = false;

  filas: CargoTopeHorasModel[] = [];
  guardando = false;

  readonly maxDia = MAX_EXTRA_DIA;
  readonly maxSemana = MAX_EXTRA_SEMANA;

  constructor(
    private readonly service: NominaCargoPlantillaService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.topes(this.cargoId));
      this.filas = res.data ?? [];
    } catch {
      this.alert.showError('Horas extra y recargos', 'No se pudieron cargar.');
    }
  }

  /** Un directivo no tiene horas extra: esas filas quedan bloqueadas. */
  bloqueada(f: CargoTopeHorasModel): boolean {
    return this.soloLectura || (this.esDirectivo && f.esHoraExtra);
  }

  async guardar(): Promise<void> {
    this.guardando = true;
    try {
      // Un directivo no tiene horas extra: sus topes viejos se mandan vacíos.
      const topes = this.filas.map((f) =>
        this.esDirectivo && f.esHoraExtra ? { ...f, topeDia: null, topeSemana: null, topeMes: null } : f,
      );
      const res = await lastValueFrom(this.service.guardarTopes(this.cargoId, topes));
      this.filas = res.data ?? [];
      this.alert.showSuccess('Horas extra y recargos', 'Topes guardados.');
    } catch (err: any) {
      this.alert.showError('Horas extra y recargos', err?.error?.message ?? 'No se pudieron guardar.');
    } finally {
      this.guardando = false;
    }
  }
}
