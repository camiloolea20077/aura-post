import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';

import { EntregarServicio, OrdenServicioDetalle, PagoServicio } from '../../../core/models/servicio-tecnico.model';
import { ServicioTecnicoService } from '../../../core/services/servicio-tecnico.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { MedioPagoServicioComponent, pagoVacio } from './medio-pago-servicio.component';

type ModoEntrega = 'COBRAR' | 'CARTERA' | 'SIN_FACTURA';

/**
 * Entregar el equipo. Con factura: se arma con las líneas de la orden, los abonos se
 * descuentan y el saldo se cobra ahora o queda en cartera. Sin factura: garantía o
 * equipo sin cobro (con motivo).
 */
@Component({
  selector: 'app-entregar-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, DropdownModule, TextareaModule, MedioPagoServicioComponent],
  template: `
    <p-dialog header="Entregar equipo" [visible]="visible" (visibleChange)="cerrar($event)" [modal]="true"
      [style]="{ width: '560px' }" [breakpoints]="{ '600px': '95vw' }" (onShow)="alAbrir()">
      <ng-container *ngIf="orden">
        <div class="cifras">
          <div><span>Total</span><strong>{{ orden.total | currency: 'COP' : '$' : '1.0-0' }}</strong></div>
          <div><span>Abonado</span><strong>{{ orden.totalAbonado | currency: 'COP' : '$' : '1.0-0' }}</strong></div>
          <div class="cifras__saldo"><span>Saldo</span><strong>{{ orden.saldo | currency: 'COP' : '$' : '1.0-0' }}</strong></div>
        </div>

        <div class="campo">
          <label>¿Cómo se entrega?</label>
          <p-dropdown [options]="modoOpts" [(ngModel)]="modo" (onChange)="onModo()" appendTo="body" styleClass="w-full" />
        </div>

        <div class="campo" *ngIf="modo !== 'SIN_FACTURA'">
          <label>Documento</label>
          <p-dropdown [options]="tipoOpts" [(ngModel)]="tipoDocumento" appendTo="body" styleClass="w-full" />
          <small class="ayuda">Se factura con los repuestos y la mano de obra de la orden; los valores ya incluyen el IVA.</small>
        </div>

        <ng-container *ngIf="modo === 'COBRAR' && cobro">
          <h4 class="sub">Lo que paga el cliente ahora</h4>
          <app-medio-pago-servicio #medio [pago]="cobro" [permiteCaja]="true" />
        </ng-container>

        <p class="ayuda" *ngIf="modo === 'CARTERA'">
          La factura queda en cartera por el saldo; el cliente la paga después con un recibo de caja.
        </p>

        <div class="campo" *ngIf="modo === 'SIN_FACTURA' || modo === 'CARTERA'">
          <label>Nota <span class="req" *ngIf="modo === 'SIN_FACTURA' && orden.total > 0">*</span></label>
          <textarea pTextarea rows="2" [(ngModel)]="nota" maxlength="1000"
            [placeholder]="modo === 'SIN_FACTURA' ? 'Garantía, no se cobró, revisión sin costo…' : 'Opcional'"></textarea>
        </div>
        <p class="aviso" *ngIf="modo === 'SIN_FACTURA' && orden.totalAbonado > 0">
          La orden tiene abonos: entréguela con factura (se descuentan) o anule los abonos primero.
        </p>
        <p class="ayuda">Al entregar, la orden se cierra y ya no se modifica.</p>
      </ng-container>
      <ng-template pTemplate="footer">
        <button pButton type="button" label="Cancelar" class="p-button-text" (click)="cerrar(false)"></button>
        <button pButton type="button" label="Entregar" icon="pi pi-sign-out" class="btn-aura" [loading]="guardando" (click)="entregar()"></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .cifras { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.5rem; margin-bottom: 1rem; }
      .cifras div { display: flex; flex-direction: column; padding: 0.55rem 0.7rem; border: 1px solid var(--aura-border); border-radius: 10px; }
      .cifras span { font-size: 0.72rem; color: var(--aura-text-muted); }
      .cifras__saldo strong { color: #2563eb; }
      .campo { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.8rem; }
      .campo label { font-size: 0.8rem; font-weight: 600; }
      .campo textarea { width: 100%; }
      .sub { margin: 0.4rem 0 0.6rem; font-size: 0.85rem; }
      .req { color: #b91c1c; }
      .ayuda { display: block; color: var(--aura-text-muted); font-size: 0.76rem; margin: 0 0 0.5rem; }
      .aviso { color: #9a3412; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 0.5rem 0.7rem; font-size: 0.8rem; }
    `,
  ],
})
export class EntregarDialogComponent {
  @Input() visible = false;
  @Input() orden: OrdenServicioDetalle | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() entregado = new EventEmitter<OrdenServicioDetalle>();
  @ViewChild('medio') medio?: MedioPagoServicioComponent;

  readonly modoOpts: { label: string; value: ModoEntrega }[] = [
    { label: 'Facturar y cobrar el saldo ahora', value: 'COBRAR' },
    { label: 'Facturar y dejar el saldo en cartera', value: 'CARTERA' },
    { label: 'Entregar sin factura (garantía, sin cobro)', value: 'SIN_FACTURA' },
  ];
  readonly tipoOpts = [
    { label: 'El de la empresa (factura o cuenta de cobro)', value: null },
    { label: 'Factura de venta', value: 'FACTURA' },
    { label: 'Cuenta de cobro', value: 'CUENTA_COBRO' },
  ];

  modo: ModoEntrega = 'COBRAR';
  tipoDocumento: 'FACTURA' | 'CUENTA_COBRO' | null = null;
  cobro: PagoServicio | null = null;
  nota = '';
  guardando = false;

  constructor(
    private readonly servicio: ServicioTecnicoService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  alAbrir(): void {
    const o = this.orden;
    this.nota = '';
    this.tipoDocumento = null;
    this.modo = !o || o.total <= 0 ? 'SIN_FACTURA' : o.saldo <= 0 ? 'CARTERA' : 'COBRAR';
    this.cobro = pagoVacio(o && o.saldo > 0 ? o.saldo : null);
    this.cdr.markForCheck();
  }

  onModo(): void {
    if (this.modo === 'COBRAR' && !this.cobro) this.cobro = pagoVacio(this.orden?.saldo ?? null);
  }

  cerrar(v: boolean): void {
    if (!v) {
      this.visible = false;
      this.visibleChange.emit(false);
    }
  }

  entregar(): void {
    const o = this.orden;
    if (!o) return;
    if (this.modo === 'COBRAR') {
      const falta = this.medio?.bloqueo();
      if (falta) {
        this.alert.showWarn('Entregar', falta);
        return;
      }
    }
    if (this.modo === 'SIN_FACTURA' && o.total > 0 && !this.nota.trim()) {
      this.alert.showWarn('Entregar', 'Escriba por qué se entrega sin factura.');
      return;
    }
    const dto: EntregarServicio = {
      facturar: this.modo !== 'SIN_FACTURA',
      tipoDocumento: this.modo === 'SIN_FACTURA' ? null : this.tipoDocumento,
      cobro: this.modo === 'COBRAR' ? this.cobro : null,
      nota: this.nota.trim() || null,
    };
    this.guardando = true;
    this.servicio.entregar(o.id, dto).subscribe({
      next: (r) => {
        this.guardando = false;
        this.alert.showSuccess('Equipo entregado', r.data.facturaNumero ? `Factura ${r.data.facturaNumero}` : r.data.codigo);
        this.entregado.emit(r.data);
        this.cerrar(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.alert.showError('No se pudo entregar', err?.error?.message ?? 'Intente de nuevo.');
        this.cdr.markForCheck();
      },
    });
  }
}
