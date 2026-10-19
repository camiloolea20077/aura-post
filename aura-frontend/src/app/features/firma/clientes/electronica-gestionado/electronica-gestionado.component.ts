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
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import {
  ClienteFirma,
  EstadoElectronica,
  FirmaContableService,
  SERVICIOS_ELECTRONICOS,
  ServicioElectronico,
} from '../../../../core/services/firma-contable.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';

/**
 * Documentos electrónicos de un cliente gestionado (docs/PLAN_FIRMA_CONTABLE.md §10).
 * Factus le entrega las credenciales a Aura: la firma no las pone, pide la activación
 * y Aura la atiende desde la plataforma. Después la firma digita la resolución y los
 * rangos en "Mi perfil" dentro del cliente.
 */
@Component({
  selector: 'app-electronica-gestionado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, DialogModule, TextareaModule, FechaEsPipe],
  templateUrl: './electronica-gestionado.component.html',
  styleUrls: ['../dialogo-firma.scss'],
})
export class ElectronicaGestionadoComponent {
  private readonly service = inject(FirmaContableService);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() visible = false;
  @Input() cliente: ClienteFirma | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  readonly catalogo = SERVICIOS_ELECTRONICOS;
  estado: EstadoElectronica | null = null;
  elegidos: ServicioElectronico[] = ['FACTURA_VENTA'];
  observacion = '';
  cargando = false;
  enviando = false;

  get pendiente(): boolean {
    return this.estado?.ultima?.estado === 'PENDIENTE';
  }

  get rechazada(): boolean {
    return this.estado?.ultima?.estado === 'RECHAZADA';
  }

  async alAbrir(): Promise<void> {
    if (!this.cliente) return;
    this.cargando = true;
    this.estado = null;
    this.elegidos = ['FACTURA_VENTA'];
    this.observacion = '';
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.estadoElectronica(this.cliente.clienteEmpresaId));
      this.estado = res?.data ?? null;
    } catch (err: any) {
      this.alert.showError('No se pudo leer el estado', err?.error?.message ?? 'Intente de nuevo.');
      this.cerrar();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  elegido(codigo: ServicioElectronico): boolean {
    return this.elegidos.includes(codigo);
  }

  toggle(codigo: ServicioElectronico, marcado: boolean): void {
    this.elegidos = marcado ? [...this.elegidos, codigo] : this.elegidos.filter((x) => x !== codigo);
  }

  /** Nombres de los documentos pedidos, separados por coma. */
  serviciosTexto(codigos: ServicioElectronico[]): string {
    return codigos.map((c) => this.catalogo.find((s) => s.codigo === c)?.nombre ?? c).join(', ');
  }

  async solicitar(): Promise<void> {
    if (!this.cliente || !this.elegidos.length) return;
    await this.ejecutar(
      () =>
        this.service.solicitarElectronica(
          this.cliente!.clienteEmpresaId,
          this.elegidos,
          this.observacion.trim() || null,
        ),
      'Solicitud enviada',
      'Aura le avisará por la campana cuando quede activo.',
    );
  }

  async cancelar(): Promise<void> {
    if (!this.cliente) return;
    await this.ejecutar(
      () => this.service.cancelarElectronica(this.cliente!.clienteEmpresaId),
      'Solicitud cancelada',
      'Puede volver a pedirla cuando quiera.',
    );
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  private async ejecutar(
    llamada: () => ReturnType<FirmaContableService['cancelarElectronica']>,
    titulo: string,
    detalle: string,
  ): Promise<void> {
    this.enviando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(llamada());
      this.estado = res?.data ?? this.estado;
      this.alert.showSuccess(titulo, detalle);
    } catch (err: any) {
      this.alert.showError('No se pudo completar', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.enviando = false;
      this.cdr.markForCheck();
    }
  }
}
