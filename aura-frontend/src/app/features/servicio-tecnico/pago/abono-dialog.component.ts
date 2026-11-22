import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { OrdenServicioDetalle, PagoServicio } from '../../../core/models/servicio-tecnico.model';
import { ServicioTecnicoService } from '../../../core/services/servicio-tecnico.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { MedioPagoServicioComponent, pagoVacio } from './medio-pago-servicio.component';

/** Registrar un abono a la orden: queda como recibo de caja (anticipo del cliente). */
@Component({
  selector: 'app-abono-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ButtonModule, DialogModule, MedioPagoServicioComponent],
  template: `
    <p-dialog header="Registrar abono" [visible]="visible" (visibleChange)="cerrar($event)" [modal]="true"
      [style]="{ width: '520px' }" [breakpoints]="{ '560px': '95vw' }" (onShow)="alAbrir()">
      <ng-container *ngIf="pago">
        <p class="resumen" *ngIf="orden">
          Total {{ orden.total | currency: 'COP' : '$' : '1.0-0' }} · Abonado {{ orden.totalAbonado | currency: 'COP' : '$' : '1.0-0' }}
          · <strong>Saldo {{ orden.saldo | currency: 'COP' : '$' : '1.0-0' }}</strong>
        </p>
        <app-medio-pago-servicio #medio [pago]="pago" [permiteCaja]="false" />
        <small class="ayuda">Se genera un recibo de caja del cliente; al entregar, el abono se descuenta de la factura.</small>
      </ng-container>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="cerrar(false)"></button>
        <button pButton type="button" label="Registrar abono" icon="pi pi-check" class="btn-aura" [loading]="guardando" (click)="guardar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .resumen { margin: 0 0 0.9rem; font-size: 0.85rem; color: var(--aura-text-muted); }
      .ayuda { display: block; color: var(--aura-text-muted); font-size: 0.76rem; }
    `,
  ],
})
export class AbonoDialogComponent {
  @Input() visible = false;
  @Input() orden: OrdenServicioDetalle | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() registrado = new EventEmitter<OrdenServicioDetalle>();
  @ViewChild('medio') medio?: MedioPagoServicioComponent;

  pago: PagoServicio | null = null;
  guardando = false;

  constructor(
    private readonly servicio: ServicioTecnicoService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  alAbrir(): void {
    this.pago = pagoVacio();
    this.cdr.markForCheck();
  }

  cerrar(v: boolean): void {
    if (!v) {
      this.visible = false;
      this.pago = null;
      this.visibleChange.emit(false);
    }
  }

  guardar(): void {
    if (!this.orden || !this.pago) return;
    const falta = this.medio?.bloqueo();
    if (falta) {
      this.alert.showWarn('Abono', falta);
      return;
    }
    this.guardando = true;
    this.servicio.registrarAbono(this.orden.id, this.pago).subscribe({
      next: (r) => {
        this.guardando = false;
        this.alert.showSuccess('Abono registrado', 'Quedó el recibo de caja del cliente.');
        this.registrado.emit(r.data);
        this.cerrar(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.alert.showError('No se pudo registrar el abono', err?.error?.message ?? 'Intente de nuevo.');
        this.cdr.markForCheck();
      },
    });
  }
}
