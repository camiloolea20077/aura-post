import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import {
  CreateAjusteRetroactivoDto,
  TipoMovimiento,
  TurnoCajaTableModel,
} from '../../../../core/models/caja.model';
import { TurnoCajaService } from '../../../../core/services/caja.service';
import { AlertService } from '../../../../shared/pipes/alert.service';

/**
 * Corrige un arqueo ya cerrado sin reabrirlo.
 *
 * <p>La alternativa — reabrir el turno y volver a cerrarlo — destruye la
 * evidencia: un cierre reescribible deja de probar lo que el cajero entregó ese
 * día. Aquí el cierre original se conserva y la corrección se suma encima.
 */
@Component({
  selector: 'app-ajuste-retroactivo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    MessageModule,
    RadioButtonModule,
    TextareaModule,
  ],
  templateUrl: './ajuste-retroactivo.component.html',
  styleUrls: ['./ajuste-retroactivo.component.scss'],
})
export class AjusteRetroactivoComponent {
  @Input() visible = false;
  @Input() turno: TurnoCajaTableModel | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() ajustado = new EventEmitter<void>();

  tipo: TipoMovimiento = 'EGRESO';
  monto: number | null = null;
  fechaDocumento: Date | null = null;
  motivo = '';
  concepto = '';
  isSubmitting = false;

  /** El motivo es el requisito real: sin él esto es cuadrar la caja a mano. */
  readonly motivoMinimo = 10;

  readonly tipoOpts: { label: string; value: TipoMovimiento; hint: string }[] = [
    {
      label: 'Salió plata que no se registró',
      value: 'EGRESO',
      hint: 'Un pago que se hizo ese día y nadie digitó. Agranda el faltante.',
    },
    {
      label: 'Entró plata que no se registró',
      value: 'INGRESO',
      hint: 'Un cobro que no quedó en el arqueo. Reduce el faltante.',
    },
  ];

  constructor(
    private readonly turnoService: TurnoCajaService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get motivoIncompleto(): boolean {
    return this.motivo.trim().length < this.motivoMinimo;
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.limpiar();
  }

  private limpiar(): void {
    this.tipo = 'EGRESO';
    this.monto = null;
    this.fechaDocumento = null;
    this.motivo = '';
    this.concepto = '';
    this.cdr.markForCheck();
  }

  /** Se arma a mano: toISOString() pasa a UTC y en Colombia resta un día. */
  private aIso(f: Date | null): string | null {
    if (f == null) return null;
    const y = f.getFullYear();
    const m = `${f.getMonth() + 1}`.padStart(2, '0');
    const d = `${f.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async guardar(): Promise<void> {
    if (this.turno == null) return;

    if (this.monto == null || this.monto <= 0) {
      this.alertService.showWarn('Falta el monto', 'Indica cuánto se corrige.');
      return;
    }
    if (this.motivoIncompleto) {
      this.alertService.showWarn(
        'Falta el motivo',
        'Explica qué pasó ese día. Queda guardado en el ajuste.',
      );
      return;
    }

    const dto: CreateAjusteRetroactivoDto = {
      tipo: this.tipo,
      monto: this.monto,
      fechaDocumento: this.aIso(this.fechaDocumento),
      motivo: this.motivo.trim(),
      concepto: this.concepto.trim() || null,
    };

    this.isSubmitting = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.turnoService.registrarAjusteRetroactivo(this.turno.id, dto),
      );
      this.alertService.showSuccess(
        'Ajuste registrado',
        'El cierre original se conserva; la corrección queda encima.',
      );
      this.ajustado.emit();
      this.cerrar();
    } catch (e: unknown) {
      const msg =
        (e as { error?: { message?: string } })?.error?.message ??
        'No se pudo registrar el ajuste.';
      this.alertService.showError('Error', msg);
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }
}
