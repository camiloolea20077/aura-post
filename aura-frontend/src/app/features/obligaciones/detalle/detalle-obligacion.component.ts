import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { lastValueFrom } from 'rxjs';

import { ObligacionService } from '../../../core/services/obligacion.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import {
  CuotaAmortizacionModel,
  ObligacionModel,
} from '../../../core/models/obligacion.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-detalle-obligacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    SkeletonModule,
    DialogModule,
    DropdownModule,
  ],
  templateUrl: './detalle-obligacion.component.html',
  styles: [
    `
      .detalle-body {
        padding: 1.25rem 1.5rem;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .metric {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.9rem 1rem;
      }
      .metric .k {
        font-size: 0.72rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .metric .v {
        font-size: 1.05rem;
        font-weight: 700;
        color: #1e293b;
      }
      .paid {
        color: #94a3b8;
        text-decoration: line-through;
      }
      .pago-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding-top: 0.25rem;
      }
      .pago-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .pago-field label {
        font-size: 0.8rem;
        color: #475569;
        font-weight: 600;
      }
      .pago-field .required {
        color: #ef4444;
      }
      .pago-hint {
        margin: 0;
        font-size: 0.85rem;
        color: #64748b;
      }
      .pago-cash {
        color: #0e7490;
        font-size: 0.8rem;
      }
    `,
  ],
})
export class DetalleObligacionComponent implements OnInit {
  obligacion: ObligacionModel | null = null;
  loading = false;
  paying: number | null = null;

  // Diálogo de pago de cuota (origen del dinero)
  pagoDialogVisible = false;
  cuotaSel: CuotaAmortizacionModel | null = null;
  pagoForm: FormGroup;
  cuentasBancariasOpts: { label: string; value: number }[] = [];
  metodosPago = [
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Consignación', value: 'CONSIGNACION' },
    { label: 'Cheque', value: 'CHEQUE' },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: ObligacionService,
    private readonly cuentaBancariaService: CuentaBancariaService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.pagoForm = this.fb.group({
      metodoPago: ['TRANSFERENCIA', Validators.required],
      cuentaBancariaId: [null as number | null],
    });
  }

  /** Sin cuenta bancaria cuando el pago es en efectivo. */
  get esEfectivo(): boolean {
    return this.pagoForm.get('metodoPago')?.value === 'EFECTIVO';
  }

  async ngOnInit(): Promise<void> {
    const id = +this.route.snapshot.params['id'];
    await Promise.all([this.cargar(id), this.loadCuentasBancarias()]);
  }

  private async loadCuentasBancarias(): Promise<void> {
    try {
      const res = await lastValueFrom(this.cuentaBancariaService.list());
      this.cuentasBancariasOpts = (res?.data ?? [])
        .filter((c) => c.activa)
        .map((c) => ({ label: c.nombre, value: c.id }));
      this.cdr.markForCheck();
    } catch {
      this.cuentasBancariasOpts = [];
    }
  }

  private async cargar(id: number): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(id));
      this.obligacion = res?.data ?? null;
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la obligación.');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  /** Abre el diálogo para elegir el origen del pago de la cuota. */
  pagar(cuota: CuotaAmortizacionModel): void {
    if (!this.obligacion) return;
    this.cuotaSel = cuota;
    // Por defecto se sugiere pagar desde la cuenta del desembolso por transferencia.
    this.pagoForm.reset({
      metodoPago: 'TRANSFERENCIA',
      cuentaBancariaId: this.obligacion.cuentaBancariaId ?? null,
    });
    this.pagoDialogVisible = true;
    this.cdr.markForCheck();
  }

  /** Al cambiar a efectivo, se limpia la cuenta bancaria (sale de caja). */
  onMetodoChange(): void {
    if (this.esEfectivo) {
      this.pagoForm.patchValue({ cuentaBancariaId: null });
    }
  }

  async confirmarPago(): Promise<void> {
    if (!this.obligacion || !this.cuotaSel) return;
    const obligacionId = this.obligacion.id;
    const cuota = this.cuotaSel;
    const { metodoPago, cuentaBancariaId } = this.pagoForm.value;

    this.paying = cuota.id;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.pagarCuota(obligacionId, cuota.id, {
          metodoPago,
          cuentaBancariaId: this.esEfectivo ? null : cuentaBancariaId,
        }),
      );
      this.alert.showSuccess('Listo', `Cuota #${cuota.numeroCuota} pagada.`);
      this.pagoDialogVisible = false;
      this.cuotaSel = null;
      await this.cargar(obligacionId);
    } catch {
      this.alert.showError('Error', 'No se pudo pagar la cuota.');
    } finally {
      this.paying = null;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/obligaciones']);
  }
}
