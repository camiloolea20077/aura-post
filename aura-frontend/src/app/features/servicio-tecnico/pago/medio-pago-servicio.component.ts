import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { lastValueFrom } from 'rxjs';

import { PagoServicio } from '../../../core/models/servicio-tecnico.model';
import { TurnoCajaService } from '../../../core/services/caja.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';

/** Dónde queda el efectivo (las mismas opciones del recibo de caja). */
export type DestinoEfectivo = 'CAJA' | 'CUENTA' | 'OTRO_DIA';

export const MEDIOS_PAGO = [
  { label: 'Efectivo', value: 'EFECTIVO' },
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'Nequi / Daviplata', value: 'NEQUI' },
  { label: 'Tarjeta', value: 'TARJETA' },
  { label: 'Consignación', value: 'CONSIGNACION' },
];

export function pagoVacio(monto: number | null = null): PagoServicio {
  return {
    monto,
    metodoPago: 'EFECTIVO',
    cuentaContableId: null,
    turnoCajaId: null,
    cajaOtroDia: false,
    referencia: null,
  };
}

/**
 * Medio de pago, cuenta y caja de un abono o del cobro al entregar. Edita el
 * {@link PagoServicio} que recibe. Con {@code permiteCaja} = false (abonos) el
 * efectivo no puede ir a la caja abierta: el anticipo no entra al cuadre del turno.
 */
@Component({
  selector: 'app-medio-pago-servicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, InputNumberModule, InputTextModule],
  template: `
    <div class="grid">
      <div class="campo">
        <label>Valor <span class="req">*</span></label>
        <p-inputNumber [(ngModel)]="pago.monto" mode="currency" currency="COP" locale="es-CO"
          [minFractionDigits]="0" [min]="0" styleClass="w-full" inputStyleClass="w-full" />
      </div>
      <div class="campo">
        <label>Medio de pago</label>
        <p-dropdown [options]="medios" [(ngModel)]="pago.metodoPago" (onChange)="onMedio()" appendTo="body" styleClass="w-full" />
      </div>
      <div class="campo" *ngIf="esEfectivo">
        <label>¿Dónde queda el efectivo?</label>
        <p-dropdown [options]="destinoOpts" [(ngModel)]="destino" (onChange)="aplicar()" appendTo="body" styleClass="w-full" />
        <small class="ayuda" *ngIf="destino === 'CAJA' && turnoNombre">Entra al cuadre de {{ turnoNombre }}.</small>
        <small class="error" *ngIf="destino === 'CAJA' && !turnoId">No hay una caja abierta: elija otra opción.</small>
      </div>
      <div class="campo" *ngIf="!esEfectivo || destino === 'CUENTA'">
        <label>{{ esEfectivo ? 'Cuenta de caja' : 'Cuenta donde entró' }} <span class="req" *ngIf="esEfectivo">*</span></label>
        <p-dropdown [options]="cuentas" [(ngModel)]="pago.cuentaContableId" [filter]="true" [showClear]="!esEfectivo"
          placeholder="Elija la cuenta" appendTo="body" styleClass="w-full" />
      </div>
      <div class="campo" *ngIf="!esEfectivo">
        <label>Referencia</label>
        <input pInputText [(ngModel)]="pago.referencia" maxlength="120" placeholder="N.º de transacción" />
      </div>
    </div>
    <small class="ayuda" *ngIf="!permiteCaja && esEfectivo">
      El abono queda como anticipo del cliente: en efectivo se registra en una cuenta de caja (no en el cuadre del turno).
    </small>
  `,
  styles: [
    `
      :host { display: block; container-type: inline-size; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 0.8rem; }
      @container (max-width: 460px) { .grid { grid-template-columns: minmax(0, 1fr); } }
      .campo { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.8rem; min-width: 0; }
      .campo label { font-size: 0.8rem; font-weight: 600; }
      .campo input { width: 100%; }
      .req, .error { color: #b91c1c; }
      .error { font-size: 0.75rem; }
      .ayuda { display: block; color: var(--aura-text-muted); font-size: 0.76rem; }
    `,
  ],
})
export class MedioPagoServicioComponent implements OnInit {
  @Input({ required: true }) pago!: PagoServicio;
  /** El cobro al entregar sí puede entrar a la caja abierta; un abono no. */
  @Input() permiteCaja = false;

  readonly medios = MEDIOS_PAGO;
  destino: DestinoEfectivo = 'CUENTA';
  cuentas: { label: string; value: number }[] = [];
  turnoId: number | null = null;
  turnoNombre: string | null = null;

  constructor(
    private readonly turnos: TurnoCajaService,
    private readonly contabilidad: ContabilidadService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get esEfectivo(): boolean {
    return this.pago.metodoPago === 'EFECTIVO';
  }

  get destinoOpts(): { label: string; value: DestinoEfectivo }[] {
    const o: { label: string; value: DestinoEfectivo }[] = [
      { label: 'En una cuenta de caja (caja general, caja menor)', value: 'CUENTA' },
      { label: 'Ya se movió otro día', value: 'OTRO_DIA' },
    ];
    return this.permiteCaja ? [{ label: 'En la caja abierta (cuadre del turno)', value: 'CAJA' }, ...o] : o;
  }

  async ngOnInit(): Promise<void> {
    try {
      const r = await lastValueFrom(this.contabilidad.listarPlan());
      this.cuentas = (r?.data ?? [])
        .filter((c) => c.activa && c.auxiliar && c.esMedioPago)
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
    } catch {
      this.cuentas = [];
    }
    if (this.permiteCaja) {
      try {
        const t = await lastValueFrom(this.turnos.turnoActivo());
        this.turnoId = t?.data?.id ?? null;
        this.turnoNombre = t?.data?.cajaNombre ?? null;
      } catch {
        this.turnoId = null;
      }
      if (!this.turnoId) {
        try {
          const abiertos = (await lastValueFrom(this.turnos.abiertos()))?.data ?? [];
          if (abiertos.length === 1) {
            this.turnoId = abiertos[0].id;
            this.turnoNombre = abiertos[0].cajaNombre;
          }
        } catch {
          // sin caja abierta
        }
      }
      if (this.turnoId) this.destino = 'CAJA';
    }
    this.aplicar();
    this.cdr.markForCheck();
  }

  onMedio(): void {
    this.pago.cuentaContableId = null;
    this.aplicar();
  }

  /** Pasa la elección de destino al pago. */
  aplicar(): void {
    const efectivo = this.esEfectivo;
    this.pago.cajaOtroDia = efectivo && this.destino === 'OTRO_DIA';
    this.pago.turnoCajaId = efectivo && this.destino === 'CAJA' ? this.turnoId : null;
    if (efectivo && this.destino !== 'CUENTA') this.pago.cuentaContableId = null;
  }

  /** Por qué no se puede registrar todavía; null si está completo. */
  bloqueo(): string | null {
    if (!this.pago.monto || this.pago.monto <= 0) return 'Escriba el valor';
    if (this.esEfectivo && this.destino === 'CAJA' && !this.turnoId) return 'No hay una caja abierta: elija otra opción';
    if (this.esEfectivo && this.destino === 'CUENTA' && !this.pago.cuentaContableId) return 'Elija la cuenta de caja';
    return null;
  }
}
