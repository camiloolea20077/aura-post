import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { lastValueFrom } from 'rxjs';

import { ContratoService } from '../../../../core/services/contrato.service';
import {
  ContratoTableModel,
  SalarioHistorialModel,
} from '../../../../core/models/contrato.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';

/**
 * Salario e historial de un contrato (Fase 2).
 *
 * Existe como pantalla propia por una razón: **cambiar el salario no es un
 * update**. Preserva el histórico cerrando la vigencia anterior y abriendo una
 * nueva, así que hay que pedir *desde cuándo* rige y *por qué*.
 *
 * Sin la fecha no se pueden liquidar retroactivos ni calcular la bandera `vsp`
 * de PILA. Por eso no es un campo editable en la tabla de contratos.
 */
@Component({
  selector: 'app-historial-salario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    TableModule,
    TagModule,
    MessageModule,
  ],
  templateUrl: './historial-salario.component.html',
})
export class HistorialSalarioComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  private _contrato: ContratoTableModel | null = null;
  @Input()
  set contrato(c: ContratoTableModel | null) {
    this._contrato = c;
    if (c) this.cargar(c.id);
  }
  get contrato(): ContratoTableModel | null {
    return this._contrato;
  }

  historial: SalarioHistorialModel[] = [];
  loading = false;
  saving = false;

  // Formulario del cambio
  nuevoSalario: number | null = null;
  fechaDesde: Date | null = null;
  motivo: string | null = null;

  constructor(
    private readonly service: ContratoService,
    private readonly alert: AlertService,
  ) {}

  private async cargar(contratoId: number): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(this.service.historialSalarios(contratoId));
      this.historial = res.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el historial.');
    } finally {
      this.loading = false;
    }
  }

  async cambiar(): Promise<void> {
    if (!this._contrato) return;

    if (!this.nuevoSalario || this.nuevoSalario <= 0) {
      this.alert.showWarn('Datos incompletos', 'Indica el nuevo salario.');
      return;
    }
    if (!this.fechaDesde) {
      // El backend también lo exige. Sin fecha, un aumento retroactivo se
      // registraría con fecha de hoy y el retroactivo se perdería en silencio.
      this.alert.showWarn('Falta la fecha', 'Indica desde cuándo rige el nuevo salario.');
      return;
    }

    this.saving = true;
    try {
      await lastValueFrom(
        this.service.cambiarSalario(this._contrato.id, {
          nuevoSalario: this.nuevoSalario,
          fechaDesde: aFechaLocal(this.fechaDesde)!,
          motivo: this.motivo?.trim() || null,
        }),
      );
      this.alert.showSuccess('Salario actualizado', 'Se conservó el histórico anterior.');
      this.limpiarFormulario();
      await this.cargar(this._contrato.id);
      this.guardado.emit();
    } catch (err: any) {
      // El backend rechaza una fecha anterior o igual a la vigencia actual:
      // el mensaje dice desde cuándo rige la que ya existe.
      const msg = err?.error?.message ?? 'No se pudo cambiar el salario.';
      this.alert.showError('Error', msg);
    } finally {
      this.saving = false;
    }
  }

  private limpiarFormulario(): void {
    this.nuevoSalario = null;
    this.fechaDesde = null;
    this.motivo = null;
  }

  onHide(): void {
    this.limpiarFormulario();
    this.historial = [];
    this.visibleChange.emit(false);
  }

  /** Verde si subió, rojo si bajó. Un salario que baja merece una mirada. */
  severidadVariacion(v: number | null): 'success' | 'danger' | null {
    if (v === null || v === 0) return null;
    return v > 0 ? 'success' : 'danger';
  }

  textoVariacion(v: number | null): string {
    if (v === null) return '';
    return `${v > 0 ? '+' : ''}${v}%`;
  }
}
