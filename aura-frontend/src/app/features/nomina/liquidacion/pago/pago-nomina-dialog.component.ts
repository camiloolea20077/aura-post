import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
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
import { DropdownModule } from 'primeng/dropdown';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { ContabilidadService } from '../../../../core/services/contabilidad.service';
import { CuentaBancariaService } from '../../../../core/services/cuenta-bancaria.service';
import { TurnoCajaService } from '../../../../core/services/caja.service';
import { PagoNominaDto } from '../../../../core/models/nomina.model';

type ViaPago = 'TRANSFERENCIA' | 'CAJA' | 'CUENTA';
type Opcion = { label: string; value: number };

/**
 * De dónde sale la plata de la nómina.
 *
 * <p>Antes el detalle pagaba sin preguntar y el backend asumía efectivo: las
 * nóminas pagadas por banco acreditaban la caja. Ahora se elige siempre, con
 * las mismas tres vías que un gasto: banco, una caja abierta (entra a su
 * arqueo) o una cuenta de fondos como la caja menor (no toca ningún arqueo).
 */
@Component({
  selector: 'app-pago-nomina-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, DropdownModule],
  templateUrl: './pago-nomina-dialog.component.html',
  styleUrls: ['./pago-nomina-dialog.component.scss'],
})
export class PagoNominaDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() titulo = 'Pagar nómina';
  /** Neto a pagar, solo para mostrarlo. */
  @Input() total: number | null = null;
  @Input() pagando = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmar = new EventEmitter<PagoNominaDto>();

  via: ViaPago | null = null;
  cuentaBancariaId: number | null = null;
  turnoCajaId: number | null = null;
  cuentaContableId: number | null = null;

  bancosOpts: Opcion[] = [];
  turnosOpts: Opcion[] = [];
  cuentasOpts: Opcion[] = [];

  readonly vias: { value: ViaPago; label: string; hint: string; icon: string }[] = [
    {
      value: 'TRANSFERENCIA',
      label: 'Banco',
      hint: 'Transferencia desde una cuenta bancaria',
      icon: 'pi pi-building-columns',
    },
    {
      value: 'CAJA',
      label: 'Caja',
      hint: 'Efectivo de una caja abierta: sale en su cierre',
      icon: 'pi pi-inbox',
    },
    {
      value: 'CUENTA',
      label: 'Otra cuenta',
      hint: 'Caja menor u otro fondo: no toca ningún arqueo',
      icon: 'pi pi-wallet',
    },
  ];

  constructor(
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly turnoService: TurnoCajaService,
    private readonly contabilidadService: ContabilidadService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      // Arranca vacío a propósito: con un valor por defecto, quien no mira el
      // bloque vuelve a pagar "por donde sea".
      this.via = null;
      this.cuentaBancariaId = null;
      this.turnoCajaId = null;
      this.cuentaContableId = null;
      void this.cargarCatalogos();
    }
  }

  private async cargarCatalogos(): Promise<void> {
    try {
      const [bancos, turnos, cuentas] = await Promise.all([
        lastValueFrom(this.cuentaBancariaService.list()),
        lastValueFrom(this.turnoService.abiertos()),
        lastValueFrom(this.contabilidadService.listarMediosPago()),
      ]);
      this.bancosOpts = (bancos?.data ?? [])
        .filter((c) => c.activa)
        .map((c) => ({
          label: `${c.nombre}${c.numeroCuenta ? ' · ' + c.numeroCuenta : ''}`,
          value: c.id,
        }));
      this.turnosOpts = (turnos?.data ?? []).map((t) => ({
        label: `${t.cajaNombre ?? 'Caja'} — ${t.usuarioNombre ?? ''}`.trim(),
        value: t.id,
      }));
      // La caja del punto ya es la vía "Caja": aquí solo los fondos aparte.
      this.cuentasOpts = (cuentas?.data ?? [])
        .filter((c) => !c.codigo?.startsWith('1110') && !c.codigo?.startsWith('1120'))
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}`, value: c.id }));
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar las cuentas y cajas.',
      );
    } finally {
      this.cdr.markForCheck();
    }
  }

  elegir(via: ViaPago): void {
    this.via = via;
    this.cdr.markForCheck();
  }

  cerrar(): void {
    this.visibleChange.emit(false);
  }

  aceptar(): void {
    if (!this.via) {
      this.alertService.showWarn('Requerido', 'Indica de dónde sale la plata.');
      return;
    }
    if (this.via === 'TRANSFERENCIA') {
      if (!this.cuentaBancariaId) {
        this.alertService.showWarn('Requerido', 'Selecciona la cuenta bancaria.');
        return;
      }
      this.confirmar.emit({
        medioPago: 'TRANSFERENCIA',
        cuentaBancariaId: this.cuentaBancariaId,
      });
      return;
    }
    if (this.via === 'CAJA') {
      if (!this.turnoCajaId) {
        this.alertService.showWarn('Requerido', 'Selecciona la caja de la que sale el efectivo.');
        return;
      }
      this.confirmar.emit({ medioPago: 'EFECTIVO', turnoCajaId: this.turnoCajaId });
      return;
    }
    if (!this.cuentaContableId) {
      this.alertService.showWarn('Requerido', 'Selecciona la cuenta de fondos.');
      return;
    }
    this.confirmar.emit({ medioPago: 'EFECTIVO', cuentaContableId: this.cuentaContableId });
  }

  formatCOP = (v: number | null): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
