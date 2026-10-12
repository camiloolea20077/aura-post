import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import {
  ClienteFirma,
  FirmaContableService,
  PaqueteGestionado,
  ResumenFirma,
  SolicitudFirma,
} from '../../../core/services/firma-contable.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../shared/pipes/fecha-es.pipe';

/**
 * Clientes de una firma contable (docs/PLAN_FIRMA_CONTABLE.md §9): solicitudes de
 * empresas que piden que les lleven la contabilidad, cupo de clientes gestionados y
 * los módulos de cada gestionado. Solo para administradores de la firma.
 */
@Component({
  selector: 'app-firma-clientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputTextModule,
    SkeletonModule,
    TagModule,
    FechaEsPipe,
  ],
  templateUrl: './firma-clientes.component.html',
  styleUrls: ['./firma-clientes.component.scss'],
})
export class FirmaClientesComponent implements OnInit {
  private readonly service = inject(FirmaContableService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  cargando = true;
  resumen: ResumenFirma | null = null;
  solicitudes: SolicitudFirma[] = [];
  catalogo: PaqueteGestionado[] = [];
  respondiendo: number | null = null;
  /** Solicitud a la que se le está escribiendo el motivo del rechazo. */
  rechazando: number | null = null;
  motivo = '';

  // ── Módulos de un gestionado ──
  dialogoModulos = false;
  clienteModulos: ClienteFirma | null = null;
  paquetesElegidos: string[] = [];
  guardandoModulos = false;

  get cupoLleno(): boolean {
    return !!this.resumen && this.resumen.gestionados >= this.resumen.cupo;
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const [resumen, solicitudes, catalogo] = await Promise.all([
        lastValueFrom(this.service.resumen()),
        lastValueFrom(this.service.solicitudesRecibidas()),
        lastValueFrom(this.service.paquetes()),
      ]);
      this.resumen = resumen?.data ?? null;
      this.solicitudes = solicitudes?.data ?? [];
      this.catalogo = catalogo?.data ?? [];
    } catch (err: any) {
      this.alert.showError('No se pudieron cargar los clientes', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  nuevo(): void {
    if (this.cupoLleno) {
      this.alert.showError('Cupo lleno', 'Llegó al cupo de clientes gestionados. Comuníquese con Aura para ampliarlo.');
      return;
    }
    this.router.navigate(['/firma/clientes/nuevo']);
  }

  // ── Solicitudes ──────────────────────────────────────────
  async aceptar(s: SolicitudFirma): Promise<void> {
    this.respondiendo = s.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.aceptar(s.id));
      this.alert.showSuccess('Solicitud aceptada', `${s.clienteNombre} ya aparece entre sus clientes.`);
      await this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo aceptar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.respondiendo = null;
      this.cdr.markForCheck();
    }
  }

  empezarRechazo(s: SolicitudFirma): void {
    this.rechazando = s.id;
    this.motivo = '';
  }

  async confirmarRechazo(s: SolicitudFirma): Promise<void> {
    this.respondiendo = s.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.rechazar(s.id, this.motivo.trim() || null));
      this.alert.showSuccess('Solicitud rechazada', `Se le avisó a ${s.clienteNombre}.`);
      this.rechazando = null;
      await this.cargar();
    } catch (err: any) {
      this.alert.showError('No se pudo rechazar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.respondiendo = null;
      this.cdr.markForCheck();
    }
  }

  // ── Módulos de un gestionado ─────────────────────────────
  async abrirModulos(c: ClienteFirma): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.paquetesDe(c.clienteEmpresaId));
      this.paquetesElegidos = res?.data ?? ['CONTABILIDAD'];
      this.clienteModulos = c;
      this.dialogoModulos = true;
    } catch (err: any) {
      this.alert.showError('No se pudieron leer los módulos', err?.error?.message ?? 'Intente de nuevo.');
    }
    this.cdr.markForCheck();
  }

  elegido(codigo: string): boolean {
    return this.paquetesElegidos.includes(codigo);
  }

  toggle(codigo: string, marcado: boolean): void {
    if (codigo === 'CONTABILIDAD') return;
    this.paquetesElegidos = marcado
      ? [...this.paquetesElegidos, codigo]
      : this.paquetesElegidos.filter((x) => x !== codigo);
  }

  async guardarModulos(): Promise<void> {
    if (!this.clienteModulos) return;
    this.guardandoModulos = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.service.cambiarPaquetes(this.clienteModulos.clienteEmpresaId, this.paquetesElegidos));
      this.alert.showSuccess('Módulos actualizados', `${this.clienteModulos.clienteNombre} ya tiene los cambios.`);
      this.dialogoModulos = false;
    } catch (err: any) {
      this.alert.showError('No se pudieron guardar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.guardandoModulos = false;
      this.cdr.markForCheck();
    }
  }
}
