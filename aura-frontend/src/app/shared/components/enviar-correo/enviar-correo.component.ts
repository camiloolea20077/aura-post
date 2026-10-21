import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import { CorreoFila, GrupoCorreo } from '../../../core/models/correo.model';
import { CorreoService } from '../../../core/services/correo.service';
import { AlertService } from '../../pipes/alert.service';
import { PdfAdjunto } from '../../utils/pdf-adjunto';
import { CorreosInputComponent } from '../correos-input/correos-input.component';

/**
 * "Enviar por correo" de un documento (factura, cuenta de cobro, cotización). Trae
 * el correo del cliente, el asunto y el mensaje propuestos; el PDF lo genera la
 * pantalla con {@link generarAdjunto}, así el adjunto es el mismo que se descarga.
 * Abajo muestra a quién se le ha enviado antes.
 */
@Component({
  selector: 'app-enviar-correo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TagModule,
    TextareaModule,
    CorreosInputComponent,
  ],
  templateUrl: './enviar-correo.component.html',
  styleUrls: ['./enviar-correo.component.scss'],
})
export class EnviarCorreoComponent {
  private readonly service = inject(CorreoService);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input({ required: true }) grupo!: GrupoCorreo;
  @Input() documentoId: number | null = null;
  /** Lo que se envía, para el encabezado ("Factura FV-120"). */
  @Input() titulo = 'documento';
  /** Genera el PDF del documento (el mismo que se descarga); null = lo adjunta el servidor (cobro). */
  @Input() generarAdjunto: (() => Promise<PdfAdjunto>) | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  para: string[] = [];
  cc: string[] = [];
  asunto = '';
  mensaje = '';
  disponible = true;
  historial: CorreoFila[] = [];
  cargando = false;
  enviando = false;

  async alAbrir(): Promise<void> {
    if (!this.documentoId) return;
    this.cargando = true;
    this.para = [];
    this.cc = [];
    this.cdr.markForCheck();
    try {
      const [sug, hist] = await Promise.all([
        lastValueFrom(this.service.sugerencia(this.grupo, this.documentoId)),
        lastValueFrom(this.service.historial(this.grupo, this.documentoId)),
      ]);
      const s = sug?.data;
      this.para = s?.para ?? [];
      this.asunto = s?.asunto ?? '';
      this.mensaje = s?.mensaje ?? '';
      this.disponible = s?.disponible ?? false;
      this.historial = hist?.data ?? [];
    } catch (err: any) {
      this.alert.showError('No se pudo preparar el correo', err?.error?.message ?? 'Intente de nuevo.');
      this.cerrar();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  async enviar(): Promise<void> {
    if (!this.documentoId) return;
    if (!this.para.length) {
      this.alert.showWarn('Falta el destinatario', 'Escriba el correo y presione Enter para agregarlo.');
      return;
    }
    if (!this.asunto.trim()) {
      this.alert.showWarn('Falta el asunto', 'Escriba el asunto del correo.');
      return;
    }
    this.enviando = true;
    this.cdr.markForCheck();
    try {
      const adjunto = this.generarAdjunto ? await this.generarAdjunto() : null;
      const res = await lastValueFrom(
        this.service.enviar(this.grupo, this.documentoId, {
          para: this.para,
          cc: this.cc,
          asunto: this.asunto.trim(),
          mensaje: this.mensaje.trim() || null,
          adjunto,
        }),
      );
      const fila = res?.data;
      if (fila?.estado === 'FALLIDO') {
        this.alert.showError('No se pudo enviar', fila.error ?? 'Intente de nuevo.');
        this.historial = [fila, ...this.historial];
      } else {
        this.alert.showSuccess('Correo enviado', `Se envió a ${this.para.join(', ')}.`);
        this.cerrar();
      }
    } catch (err: any) {
      this.alert.showError('No se pudo enviar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
