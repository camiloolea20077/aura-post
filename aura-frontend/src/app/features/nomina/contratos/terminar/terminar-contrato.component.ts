import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageModule } from 'primeng/message';
import { lastValueFrom } from 'rxjs';

import { ContratoService } from '../../../../core/services/contrato.service';
import {
  CAUSA_RETIRO_OPTS,
  CausaRetiro,
  ContratoTableModel,
} from '../../../../core/models/contrato.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';

/**
 * Terminación de contrato (Fase 2).
 *
 * `causaRetiro` **no es un campo descriptivo**: determina si hay indemnización
 * y cómo se calcula (CST art. 64). Por eso es un selector y no texto libre.
 */
@Component({
  selector: 'app-terminar-contrato',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    MessageModule,
  ],
  templateUrl: './terminar-contrato.component.html',
})
export class TerminarContratoComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() contrato: ContratoTableModel | null = null;
  @Output() guardado = new EventEmitter<void>();

  readonly causaOpts = CAUSA_RETIRO_OPTS;

  fechaFin: Date | null = null;
  causaRetiro: CausaRetiro | null = null;
  saving = false;

  constructor(
    private readonly service: ContratoService,
    private readonly alert: AlertService,
  ) {}

  /**
   * El despido sin justa causa genera indemnización.
   *
   * Se avisa antes de guardar: es plata que la empresa va a deber, y quien
   * termina el contrato debería saberlo en ese momento, no al liquidar.
   */
  get generaIndemnizacion(): boolean {
    return this.causaRetiro === 'SIN_JUSTA_CAUSA';
  }

  async terminar(): Promise<void> {
    if (!this.contrato) return;

    if (!this.fechaFin) {
      this.alert.showWarn('Datos incompletos', 'Indica la fecha de terminación.');
      return;
    }
    if (!this.causaRetiro) {
      this.alert.showWarn('Falta la causa', 'La causa del retiro define la liquidación.');
      return;
    }

    this.saving = true;
    try {
      await lastValueFrom(
        this.service.terminar(this.contrato.id, {
          fechaFin: aFechaLocal(this.fechaFin)!,
          causaRetiro: this.causaRetiro,
        }),
      );
      this.alert.showSuccess('Contrato terminado', '');
      this.guardado.emit();
      this.onHide();
    } catch (err: any) {
      const msg = err?.error?.message ?? 'No se pudo terminar el contrato.';
      this.alert.showError('Error', msg);
    } finally {
      this.saving = false;
    }
  }

  onHide(): void {
    this.fechaFin = null;
    this.causaRetiro = null;
    this.visibleChange.emit(false);
  }
}
