import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { lastValueFrom } from 'rxjs';

import {
  AutorizacionDada,
  ExcesoVenta,
} from '../../../core/models/permisos.model';
import { PermisosService } from '../../../core/services/permisos.service';

/**
 * Autorización del supervisor cuando la venta pasa el límite (PLAN_PERMISOS P8).
 * La clave del supervisor NUNCA se escribe en este equipo:
 *  - Código: el supervisor lo genera en su sesión (Autorizaciones) y lo dicta;
 *    vence en 2 minutos y sirve una vez.
 *  - Aprobación remota: se le manda la solicitud y la aprueba desde su sesión;
 *    aquí se espera la respuesta.
 */
@Component({
  selector: 'app-autorizacion-supervisor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './autorizacion-supervisor.component.html',
  styleUrls: ['./autorizacion-supervisor.component.scss'],
})
export class AutorizacionSupervisorComponent implements OnDestroy {
  @Input() visible = false;
  @Input() exceso: ExcesoVenta | null = null;
  @Output() autorizado = new EventEmitter<AutorizacionDada>();
  @Output() cancelado = new EventEmitter<void>();

  codigo = '';
  motivo = '';
  enviando = false;
  error: string | null = null;
  /** Solicitud remota en espera. */
  esperandoId: number | null = null;
  private sondeo: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly service: PermisosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    this.pararSondeo();
  }

  limite(v: number | null): string {
    return v === null || v === undefined ? 'sin límite' : `${v}%`;
  }

  async usarCodigo(): Promise<void> {
    const codigo = this.codigo.replace(/\s/g, '');
    if (!this.exceso || !/^\d{6}$/.test(codigo)) {
      this.error = 'Escriba el código de 6 dígitos que le dio el supervisor.';
      return;
    }
    this.enviando = true;
    this.error = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.usarCodigo({
          codigo,
          descuentoPct: this.exceso.descuentoPct,
          rebajaPct: this.exceso.rebajaPct,
          motivo: this.motivo.trim() || null,
        }),
      );
      if (res?.data) {
        this.limpiar();
        this.autorizado.emit(res.data);
      }
    } catch (err: any) {
      this.error = err?.error?.message ?? 'No se pudo usar el código.';
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  /** Manda la solicitud al supervisor y espera su respuesta. */
  async pedirRemota(): Promise<void> {
    if (!this.exceso) return;
    this.enviando = true;
    this.error = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.solicitarAutorizacion({
          descuentoPct: this.exceso.descuentoPct,
          rebajaPct: this.exceso.rebajaPct,
          detalle: this.exceso.detalle,
          motivo: this.motivo.trim() || null,
        }),
      );
      this.esperandoId = res?.data?.id ?? null;
      if (this.esperandoId) this.iniciarSondeo();
    } catch (err: any) {
      this.error = err?.error?.message ?? 'No se pudo enviar la solicitud.';
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.limpiar();
    this.cancelado.emit();
  }

  private iniciarSondeo(): void {
    this.pararSondeo();
    this.sondeo = setInterval(() => this.revisar(), 3000);
  }

  private async revisar(): Promise<void> {
    if (!this.esperandoId) return;
    try {
      const res = await lastValueFrom(
        this.service.estadoSolicitud(this.esperandoId),
      );
      const e = res?.data;
      if (!e) return;
      if (e.estado === 'VIGENTE') {
        const id = this.esperandoId;
        this.limpiar();
        this.autorizado.emit({
          autorizacionId: id,
          autorizador: e.autorizador ?? 'El supervisor',
          expiraEn: e.expiraEn,
        });
      } else if (e.estado === 'RECHAZADA' || e.estado === 'VENCIDA') {
        this.pararSondeo();
        this.esperandoId = null;
        this.error =
          e.estado === 'RECHAZADA'
            ? `${e.autorizador ?? 'El supervisor'} rechazó la solicitud.`
            : 'La solicitud venció sin respuesta. Pida un código o vuelva a enviarla.';
      }
    } catch {
      /* se reintenta en el siguiente ciclo */
    } finally {
      this.cdr.markForCheck();
    }
  }

  private pararSondeo(): void {
    if (this.sondeo) clearInterval(this.sondeo);
    this.sondeo = null;
  }

  private limpiar(): void {
    this.pararSondeo();
    this.esperandoId = null;
    this.codigo = '';
    this.motivo = '';
    this.error = null;
  }
}
