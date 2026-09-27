import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../pipes/alert.service';
import { DocumentoSoporteService } from '../../../core/services/documento-soporte.service';
import {
  OrigenDocumentoSoporte,
  PreviaDocumentoSoporteModel,
} from '../../../core/models/documento-soporte.model';

/**
 * Emitir el documento soporte de una compra o un gasto.
 *
 * <p>Primero muestra exactamente lo que se va a mandar a la DIAN y qué falta:
 * con faltantes el botón de enviar no se habilita, así el usuario corrige el
 * tercero antes de gastar un intento. Si la DIAN rechaza, el motivo queda a la
 * vista junto a los intentos anteriores.
 */
@Component({
  selector: 'app-documento-soporte-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, TagModule],
  templateUrl: './documento-soporte-dialog.component.html',
  styleUrls: ['./documento-soporte-dialog.component.scss'],
})
export class DocumentoSoporteDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() origenTipo: OrigenDocumentoSoporte = 'COMPRA';
  @Input() origenId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() emitido = new EventEmitter<void>();

  previa: PreviaDocumentoSoporteModel | null = null;
  cargando = false;
  enviando = false;
  descargando = false;
  observacion = '';
  numberingRangeId = '';
  verOpciones = false;

  constructor(
    private readonly service: DocumentoSoporteService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.origenId != null) {
      this.observacion = '';
      this.numberingRangeId = '';
      this.verOpciones = false;
      void this.cargar();
    }
  }

  async cargar(): Promise<void> {
    if (this.origenId == null) return;
    this.cargando = true;
    this.previa = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.previa(this.origenTipo, this.origenId));
      this.previa = res?.data ?? null;
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo preparar el documento soporte.',
      );
      this.cerrar();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  async enviar(): Promise<void> {
    if (!this.previa?.puedeEmitirse || this.origenId == null) return;
    this.enviando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.emitir({
          origenTipo: this.origenTipo,
          origenId: this.origenId,
          observacion: this.observacion.trim() || null,
          numberingRangeId: this.numberingRangeId.trim() || null,
        }),
      );
      const doc = res?.data;
      if (doc?.estado === 'ACEPTADO') {
        this.alertService.showSuccess(
          'Aceptado por la DIAN',
          `Documento soporte ${doc.numero ?? ''} emitido.`,
        );
        this.emitido.emit();
      } else {
        this.alertService.showError(
          'Rechazado',
          doc?.mensajeError ?? 'La DIAN rechazó el documento soporte.',
        );
      }
      await this.cargar();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo enviar el documento soporte.',
      );
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  async descargarPdf(id: number): Promise<void> {
    this.descargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.pdf(id));
      if (res?.data?.pdfBase64) this.service.abrirPdf(res.data.pdfBase64);
    } catch (err: any) {
      this.alertService.showError('Error', err?.error?.message ?? 'No se pudo obtener el PDF.');
    } finally {
      this.descargando = false;
      this.cdr.markForCheck();
    }
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  formatCOP = (v: number | null | undefined): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
