import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { lastValueFrom } from 'rxjs';

import {
  CodigoGenerado,
  SolicitudPendiente,
} from '../../core/models/permisos.model';
import { PermisosService } from '../../core/services/permisos.service';
import { StateStore } from '../../core/store/state';
import { AlertService } from '../../shared/pipes/alert.service';

/**
 * Autorizaciones de descuento del supervisor (PLAN_PERMISOS P8): genera el código
 * de un solo uso que le dicta al cajero y responde las solicitudes remotas. Su
 * clave nunca sale de su propia sesión.
 */
@Component({
  selector: 'app-autorizaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule],
  templateUrl: './autorizaciones.component.html',
  styleUrls: ['./autorizaciones.component.scss'],
})
export class AutorizacionesComponent implements OnInit, OnDestroy {
  private readonly service = inject(PermisosService);
  private readonly store = inject(StateStore);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  codigo: CodigoGenerado | null = null;
  segundos = 0;
  generando = false;
  pendientes: SolicitudPendiente[] = [];
  respondiendo: number | null = null;
  private reloj: ReturnType<typeof setInterval> | null = null;
  private refresco: ReturnType<typeof setInterval> | null = null;

  get puedeAutorizar(): boolean {
    return this.store.puede('ventas.ventas', 'AUTORIZAR_DESCUENTO');
  }

  ngOnInit(): void {
    this.cargarPendientes();
    // Un cajero puede estar esperando: se refresca solo.
    this.refresco = setInterval(() => this.cargarPendientes(), 10000);
  }

  ngOnDestroy(): void {
    if (this.reloj) clearInterval(this.reloj);
    if (this.refresco) clearInterval(this.refresco);
  }

  limite(v: number | null): string {
    return v === null || v === undefined ? 'sin límite' : `${v}%`;
  }

  async generar(): Promise<void> {
    this.generando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.generarCodigo());
      this.codigo = res?.data ?? null;
      this.iniciarReloj();
    } catch {
      /* el interceptor muestra el error */
    } finally {
      this.generando = false;
      this.cdr.markForCheck();
    }
  }

  async aprobar(s: SolicitudPendiente): Promise<void> {
    await this.responder(s, true);
  }

  async rechazar(s: SolicitudPendiente): Promise<void> {
    await this.responder(s, false);
  }

  lineas(s: SolicitudPendiente): string[] {
    return (s.detalle ?? '').split('\n').filter((l) => l.trim());
  }

  private async responder(s: SolicitudPendiente, aprobar: boolean): Promise<void> {
    this.respondiendo = s.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        aprobar
          ? this.service.aprobarSolicitud(s.id)
          : this.service.rechazarSolicitud(s.id),
      );
      this.alert.showSuccess(
        aprobar ? 'Aprobada' : 'Rechazada',
        `La venta de ${s.solicitante ?? 'el cajero'} ${aprobar ? 'puede seguir' : 'no tendrá el descuento'}.`,
      );
      await this.cargarPendientes();
    } catch {
      /* el interceptor muestra el error */
    } finally {
      this.respondiendo = null;
      this.cdr.markForCheck();
    }
  }

  private async cargarPendientes(): Promise<void> {
    if (!this.puedeAutorizar) return;
    try {
      const res = await lastValueFrom(this.service.solicitudesPendientes());
      this.pendientes = res?.data ?? [];
    } catch {
      this.pendientes = [];
    } finally {
      this.cdr.markForCheck();
    }
  }

  private iniciarReloj(): void {
    if (this.reloj) clearInterval(this.reloj);
    const tic = () => {
      if (!this.codigo) return;
      const ms = new Date(this.codigo.expiraEn).getTime() - Date.now();
      this.segundos = Math.max(0, Math.round(ms / 1000));
      if (this.segundos === 0) {
        this.codigo = null;
        if (this.reloj) clearInterval(this.reloj);
      }
      this.cdr.markForCheck();
    };
    tic();
    this.reloj = setInterval(tic, 1000);
  }
}
