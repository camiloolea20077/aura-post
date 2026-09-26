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
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';

import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { NotaContableService } from '../services/nota-contable.service';

/**
 * Anular una nota contabilizada exige motivo: queda en la traza junto con
 * quién y cuándo. El backend además bloquea si el período ya se cerró.
 */
@Component({
  selector: 'app-anular-nota-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    TextareaModule,
  ],
  templateUrl: './anular-nota-dialog.component.html',
  styleUrls: ['./anular-nota-dialog.component.scss'],
})
export class AnularNotaDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() notaId: number | null = null;
  @Input() numero: string | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() anulada = new EventEmitter<void>();

  readonly motivo = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(300),
    ],
  });
  saving = false;

  constructor(
    private readonly service: NotaContableService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    if (this.visible) this.motivo.reset('');
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  async confirmar(): Promise<void> {
    if (this.motivo.invalid || !this.notaId) {
      this.motivo.markAsTouched();
      return;
    }
    this.saving = true;
    try {
      const res = await lastValueFrom(
        this.service.anular(this.notaId, this.motivo.value.trim()),
      );
      this.alert.showSuccess('Nota anulada', res?.message ?? '');
      this.anulada.emit();
      this.cerrar();
    } catch (e: any) {
      this.alert.showError(
        'No se pudo anular',
        e?.error?.message ?? 'Intente de nuevo',
      );
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }
}
