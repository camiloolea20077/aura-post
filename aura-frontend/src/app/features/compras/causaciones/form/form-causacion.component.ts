import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  CausacionCalculo,
  CausacionCrear,
  CausacionLineaCrear,
  TIPOS_SOPORTE_CAUSACION,
  TipoSoporteCausacion,
} from '../../../../core/models/causacion-gasto.model';
import { TerceroTableModel } from '../../../../core/models/tercero.model';
import { CausacionGastoService } from '../../../../core/services/causacion-gasto.service';
import { CentroCostoService } from '../../../../core/services/centro-costo.service';
import { TarifaRetencionService } from '../../../../core/services/tarifa-retencion.service';
import { SedeActualService } from '../../../../core/services/sede-actual.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { CuentaAutocompleteComponent } from '../../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';

interface Opcion<T> {
  label: string;
  value: T;
}

/**
 * Nueva causación de gasto o servicio. Los valores (IVA, retenciones, neto) los
 * calcula el back con /calcular cada vez que cambia algo: lo que se ve es lo que
 * se graba.
 */
@Component({
  selector: 'app-form-causacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CalendarModule,
    TooltipModule,
    TerceroAutocompleteComponent,
    CuentaAutocompleteComponent,
  ],
  templateUrl: './form-causacion.component.html',
  styleUrls: ['./form-causacion.component.scss'],
})
export class FormCausacionComponent implements OnInit {
  private readonly service = inject(CausacionGastoService);
  private readonly ccService = inject(CentroCostoService);
  private readonly tarifaService = inject(TarifaRetencionService);
  private readonly sedeActual = inject(SedeActualService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Cabecera
  proveedor: TerceroTableModel | null = null;
  sucursalId: number | null = null;
  fecha: Date = new Date();
  fechaVencimiento: Date | null = null;
  tipoSoporte: TipoSoporteCausacion = 'FACTURA';
  numeroSoporte = '';
  descripcion = '';
  cuentaPagarContableId: number | null = null;

  lineas: CausacionLineaCrear[] = [this.lineaNueva()];

  // Opciones
  readonly tiposSoporte = TIPOS_SOPORTE_CAUSACION;
  sedesOpts: Opcion<number>[] = [];
  centrosOpts: Opcion<number>[] = [];
  conceptosOpts: Opcion<number>[] = [];
  readonly ivaOpts: Opcion<number>[] = [
    { label: 'Sin IVA', value: 0 },
    { label: '5 %', value: 5 },
    { label: '19 %', value: 19 },
  ];
  readonly descontableOpts: Opcion<boolean>[] = [
    { label: 'Descontable', value: true },
    { label: 'Mayor valor del gasto', value: false },
  ];
  readonly reteivaOpts: Opcion<number>[] = [
    { label: 'No', value: 0 },
    { label: '15 % del IVA', value: 15 },
    { label: '100 % del IVA', value: 100 },
  ];
  readonly prefijosGasto = ['5', '6', '7', '1'];

  // Cálculo
  calculo: CausacionCalculo | null = null;
  errorCalculo: string | null = null;
  calculando = false;
  guardando = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private peticion = 0;

  async ngOnInit(): Promise<void> {
    const [sedes, ccs, tarifas, sedeId] = await Promise.all([
      this.sedeActual.opciones().catch(() => ({ sedes: [], todas: false })),
      lastValueFrom(this.ccService.list()).catch(() => null),
      lastValueFrom(this.tarifaService.todas()).catch(() => null),
      this.sedeActual.id().catch(() => null),
    ]);
    this.sedesOpts = sedes.sedes.map((s) => ({ label: s.nombre, value: s.id }));
    this.sucursalId = sedeId ?? this.sedesOpts[0]?.value ?? null;
    this.centrosOpts = (ccs?.data ?? [])
      .filter((c) => c.permiteMovimientos)
      .map((c) => ({ label: `${c.codigo} · ${c.nombre}`, value: c.id }));
    this.conceptosOpts = (tarifas?.data ?? [])
      .filter((t) => t.activo && t.tipo === 'RETEFUENTE')
      .map((t) => ({
        label: `${t.concepto} (${t.tarifaNatural}% / ${t.tarifaJuridica}%)`,
        value: t.id,
      }));
    this.cdr.markForCheck();
  }

  // ── Líneas ─────────────────────────────────────────────────────────────
  private lineaNueva(): CausacionLineaCrear {
    return {
      cuentaId: null,
      descripcion: null,
      centroCostoId: null,
      base: null,
      tarifaIva: 0,
      ivaDescontable: true,
      tarifaRetencionId: null,
      tarifaRetefuente: null,
      tarifaReteiva: 0,
      tarifaReteica: null,
    };
  }

  agregarLinea(): void {
    // La nueva hereda centro de costo y retenciones: casi siempre se repiten.
    const ultima = this.lineas[this.lineas.length - 1];
    this.lineas = [
      ...this.lineas,
      {
        ...this.lineaNueva(),
        centroCostoId: ultima?.centroCostoId ?? null,
        tarifaRetencionId: ultima?.tarifaRetencionId ?? null,
        tarifaReteica: ultima?.tarifaReteica ?? null,
      },
    ];
  }

  quitarLinea(i: number): void {
    this.lineas = this.lineas.filter((_, j) => j !== i);
    if (!this.lineas.length) this.lineas = [this.lineaNueva()];
    this.recalcular();
  }

  trackByIndex(i: number): number {
    return i;
  }

  // ── Cálculo en el back ─────────────────────────────────────────────────
  onProveedor(t: TerceroTableModel | null): void {
    this.proveedor = t;
    this.recalcular();
  }

  recalcular(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.calcular(), 400);
  }

  private get listas(): boolean {
    return this.lineas.every((l) => l.cuentaId && (l.base ?? 0) > 0);
  }

  private async calcular(): Promise<void> {
    if (!this.listas) {
      this.calculo = null;
      this.errorCalculo = null;
      this.cdr.markForCheck();
      return;
    }
    const n = ++this.peticion;
    this.calculando = true;
    try {
      const res = await lastValueFrom(this.service.calcular(this.dto()));
      if (n !== this.peticion) return;
      this.calculo = res?.data ?? null;
      this.errorCalculo = null;
    } catch (err: any) {
      if (n !== this.peticion) return;
      this.calculo = null;
      this.errorCalculo = err?.error?.message ?? err?.message ?? 'No se pudo calcular.';
    } finally {
      if (n === this.peticion) {
        this.calculando = false;
        this.cdr.markForCheck();
      }
    }
  }

  valorLinea(i: number, campo: 'valorIva' | 'valorRetefuente' | 'valorReteiva' | 'valorReteica'): number | null {
    return this.calculo?.lineas?.[i]?.[campo] ?? null;
  }

  tarifaRetefuenteLinea(i: number): number | null {
    return this.calculo?.lineas?.[i]?.tarifaRetefuente ?? null;
  }

  // ── Guardar ────────────────────────────────────────────────────────────
  private dto(): CausacionCrear {
    return {
      terceroId: this.proveedor?.id ?? null,
      sucursalId: this.sucursalId,
      fecha: this.iso(this.fecha),
      fechaVencimiento: this.iso(this.fechaVencimiento),
      tipoSoporte: this.tipoSoporte,
      numeroSoporte: this.numeroSoporte?.trim() || null,
      descripcion: this.descripcion?.trim() || null,
      cuentaPagarContableId: this.cuentaPagarContableId,
      lineas: this.lineas,
    };
  }

  async guardar(): Promise<void> {
    if (!this.proveedor) {
      this.alert.showWarn('Falta el proveedor', 'Elija a quién se le causa la factura.');
      return;
    }
    if (!this.listas) {
      this.alert.showWarn('Líneas incompletas', 'Cada línea necesita la cuenta y el valor.');
      return;
    }
    this.guardando = true;
    try {
      const res = await lastValueFrom(this.service.crear(this.dto()));
      const d = res?.data;
      this.alert.showSuccess('Causación registrada', `${d?.numero ?? ''} — queda la cuenta por pagar por el neto.`);
      if (d?.id) this.router.navigate(['/compras/causaciones', d.id]);
      else this.router.navigate(['/compras/causaciones']);
    } catch (err: any) {
      this.alert.showError('No se pudo causar', err?.error?.message ?? err?.message ?? 'Intente de nuevo.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  cancelar(): void {
    this.router.navigate(['/compras/causaciones']);
  }

  private iso(d: Date | null): string | null {
    if (!d) return null;
    return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
  }
}
