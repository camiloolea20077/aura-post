import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import { aDate, aFechaLocal } from '../../../../shared/utils/fecha.util';
import { NotaContableModel } from '../models/nota-contable.model';
import { NotaContableService } from '../services/nota-contable.service';

/**
 * Reversar = registrar la nota inversa en un mes abierto. Es la forma de
 * deshacer una nota de un mes ya cerrado sin tocar ese mes: la original y la
 * reversión quedan contabilizadas y en los informes suman cero.
 */
@Component({
  selector: 'app-reversar-nota-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, CalendarModule, DialogModule, InputTextModule, FechaEsPipe],
  templateUrl: './reversar-nota-dialog.component.html',
  styleUrls: ['./reversar-nota-dialog.component.scss'],
})
export class ReversarNotaDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() nota: NotaContableModel | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** Emite la reversión creada. */
  @Output() reversada = new EventEmitter<NotaContableModel>();

  fecha: Date | null = null;
  minFecha: Date | null = null;
  concepto = '';
  saving = false;

  constructor(
    private readonly service: NotaContableService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    if (this.visible && this.nota) {
      const original = aDate(this.nota.fecha);
      this.minFecha = original;
      // Lo usual es reversar el primer día del mes siguiente (provisiones y
      // causaciones que se deshacen al llegar la factura).
      this.fecha = original ? new Date(original.getFullYear(), original.getMonth() + 1, 1) : new Date();
      this.concepto = '';
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  async confirmar(): Promise<void> {
    if (!this.nota || !this.fecha) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.reversar(this.nota.id, aFechaLocal(this.fecha), this.concepto.trim() || null),
      );
      this.alert.showSuccess('Nota reversada', res?.message ?? '');
      this.reversada.emit(res.data);
      this.cerrar();
    } catch (e: any) {
      this.alert.showError('No se pudo reversar', e?.error?.message ?? 'Intente de nuevo');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }
}
