import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { lastValueFrom } from 'rxjs';

import { EmbargoService } from '../../../../core/services/embargo.service';
import {
  CreateEmbargoDto,
  EmbargoModel,
  TIPOS_EMBARGO,
  TipoEmbargo,
} from '../../../../core/models/embargo.model';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../../shared/utils/fecha.util';

/**
 * Embargos sobre el salario de un contrato (V113).
 *
 * El monto es "o valor total o porcentaje", nunca ambos. Alimentos tiene
 * prelación y llega al 50%.
 */
@Component({
  selector: 'app-embargos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    CalendarModule,
    SkeletonModule,
    TagModule,
    SelectButtonModule,
  ],
  templateUrl: './embargos.component.html',
  styleUrls: ['./embargos.component.scss'],
})
export class EmbargosComponent implements OnChanges {
  @Input() visible = false;
  @Input() contratoId: number | null = null;
  @Input() contratoLabel = '';
  /** Inline: se muestra dentro de un tab (sin diálogo). */
  @Input() inline = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  readonly tiposEmbargo = TIPOS_EMBARGO;
  readonly modoOpts = [
    { label: 'Valor total', value: 'TOTAL' },
    { label: 'Porcentaje', value: 'PCT' },
  ];

  embargos: EmbargoModel[] = [];
  loading = false;

  // Form nuevo embargo
  mostrarForm = false;
  expediente = '';
  tipo: TipoEmbargo = 'ALIMENTOS';
  modo: 'TOTAL' | 'PCT' = 'TOTAL';
  valorTotal: number | null = null;
  porcentaje: number | null = null;
  fechaInicio: Date | null = null;
  observacion: string | null = null;
  guardando = false;

  constructor(
    private readonly service: EmbargoService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const abrioDialogo = changes['visible']?.currentValue && this.contratoId;
    const cambioContratoInline =
      this.inline && changes['contratoId']?.currentValue;
    if (abrioDialogo || cambioContratoInline) {
      this.cargar();
    }
    if (
      !this.inline &&
      changes['visible'] &&
      !changes['visible'].currentValue
    ) {
      this.reset();
    }
  }

  async cargar(): Promise<void> {
    this.loading = true;
    try {
      const res = await lastValueFrom(
        this.service.porContrato(this.contratoId!),
      );
      this.embargos = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar los embargos.');
    } finally {
      this.loading = false;
    }
  }

  labelDe(tipo: TipoEmbargo): string {
    return this.tiposEmbargo.find((t) => t.value === tipo)?.label ?? tipo;
  }

  hintDe(tipo: TipoEmbargo): string {
    return this.tiposEmbargo.find((t) => t.value === tipo)?.hint ?? '';
  }

  severidadEstado(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'SUSPENDIDO':
        return 'warn';
      case 'TERMINADO':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  abrirForm(): void {
    this.mostrarForm = true;
    this.expediente = '';
    this.tipo = 'ALIMENTOS';
    this.modo = 'TOTAL';
    this.valorTotal = null;
    this.porcentaje = null;
    this.fechaInicio = new Date();
    this.observacion = null;
  }

  cancelarForm(): void {
    this.mostrarForm = false;
  }

  async guardar(): Promise<void> {
    if (!this.expediente.trim()) {
      this.alert.showWarn('Datos incompletos', 'Indica el expediente.');
      return;
    }
    if (!this.fechaInicio) {
      this.alert.showWarn('Datos incompletos', 'Indica la fecha de inicio.');
      return;
    }
    const esTotal = this.modo === 'TOTAL';
    if (esTotal && (this.valorTotal == null || this.valorTotal <= 0)) {
      this.alert.showWarn(
        'Datos incompletos',
        'Indica el valor total a embargar.',
      );
      return;
    }
    if (!esTotal && (this.porcentaje == null || this.porcentaje <= 0)) {
      this.alert.showWarn(
        'Datos incompletos',
        'Indica el porcentaje a embargar.',
      );
      return;
    }
    const dto: CreateEmbargoDto = {
      contratoId: this.contratoId!,
      expediente: this.expediente.trim(),
      tipo: this.tipo,
      valorTotal: esTotal ? this.valorTotal : null,
      porcentaje: esTotal ? null : this.porcentaje,
      fechaInicio: aFechaLocal(this.fechaInicio)!,
      observacion: this.observacion?.trim() || null,
    };
    this.guardando = true;
    try {
      await lastValueFrom(this.service.crear(dto));
      this.alert.showSuccess('Embargo registrado', '');
      this.mostrarForm = false;
      await this.cargar();
    } catch (err: any) {
      this.alert.showError(
        'Error',
        err?.error?.message ?? 'No se pudo registrar el embargo.',
      );
    } finally {
      this.guardando = false;
    }
  }

  async terminar(e: EmbargoModel): Promise<void> {
    if (!confirm(`¿Terminar el embargo ${e.expediente}?`)) return;
    try {
      await lastValueFrom(this.service.terminar(e.id));
      this.alert.showSuccess('Terminado', '');
      await this.cargar();
    } catch {
      this.alert.showError('Error', 'No se pudo terminar el embargo.');
    }
  }

  onHide(): void {
    this.reset();
    this.visibleChange.emit(false);
  }

  private reset(): void {
    this.embargos = [];
    this.mostrarForm = false;
  }
}
