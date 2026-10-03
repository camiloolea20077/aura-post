import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';

import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { aFechaLocal } from '../../../shared/utils/fecha.util';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { MovimientoTrasladoModel, ResumenTrasladoModel } from '../../../core/models/contador.model';
import { CheckboxModule } from 'primeng/checkbox';

/**
 * Herramientas del contador (Fase 4): traslado de cuentas y fusión de
 * terceros. Las dos muestran primero qué van a mover y dejan bitácora.
 */
@Component({
  selector: 'app-herramientas-contador',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TabViewModule, DropdownModule, CalendarModule,
    InputTextModule, ConfirmDialogModule, TerceroAutocompleteComponent, CheckboxModule],
  providers: [ConfirmationService],
  templateUrl: './herramientas-contador.component.html',
  styleUrls: ['./herramientas-contador.component.scss'],
})
export class HerramientasContadorComponent implements OnInit {
  activeTab = 0;
  cuentas: { label: string; value: number }[] = [];

  // Traslado
  origenId: number | null = null;
  destinoId: number | null = null;
  desde: Date = new Date(new Date().getFullYear(), 0, 1);
  hasta: Date = new Date();
  terceroTraslado: number | null = null;
  motivoTraslado = '';
  resumen: ResumenTrasladoModel | null = null;
  /** Movimientos elegidos para trasladar (por defecto, todos los de meses abiertos). */
  seleccion: MovimientoTrasladoModel[] = [];
  trasladando = false;
  historialTraslados: any[] = [];

  // Fusión
  terceroOrigen: number | null = null;
  terceroDestino: number | null = null;
  motivoFusion = '';
  previaFusion: { tabla: string; registros: number }[] | null = null;
  fusionando = false;
  historialFusiones: any[] = [];

  constructor(
    private readonly service: ContabilidadService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const [plan, t, f] = await Promise.all([
        lastValueFrom(this.service.listarPlan()),
        lastValueFrom(this.service.historialTraslados()).catch(() => null),
        lastValueFrom(this.service.historialFusiones()).catch(() => null),
      ]);
      this.cuentas = (plan?.data ?? [])
        .filter((c) => c.activa)
        .map((c) => ({ label: `${c.codigo} - ${c.nombre}${c.auxiliar ? '' : ' (agrupación)'}`, value: c.id }));
      this.historialTraslados = t?.data ?? [];
      this.historialFusiones = f?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudo cargar el plan de cuentas');
    }
    this.cdr.markForCheck();
  }

  // ── Traslado ─────────────────────────────────────────────────
  limpiarResumen(): void {
    this.resumen = null;
    this.seleccion = [];
  }

  /** "Marcar todos" no puede elegir movimientos de meses cerrados. */
  onSeleccion(sel: MovimientoTrasladoModel[]): void {
    this.seleccion = (sel ?? []).filter((m) => !this.bloqueado(m));
  }

  bloqueado(m: MovimientoTrasladoModel): boolean {
    return !!m.estado_periodo && m.estado_periodo !== 'ABIERTO';
  }

  get totalSeleccion(): { debitos: number; creditos: number } {
    return this.seleccion.reduce(
      (t, m) => ({ debitos: t.debitos + Number(m.debito || 0), creditos: t.creditos + Number(m.credito || 0) }),
      { debitos: 0, creditos: 0 },
    );
  }

  get todosElegidos(): boolean {
    return !!this.resumen && this.seleccion.length === this.resumen.movimientos.filter((m) => !this.bloqueado(m)).length;
  }

  async verTraslado(): Promise<void> {
    if (!this.origenId || !this.destinoId) {
      this.alert.showWarn('Faltan datos', 'Elige la cuenta de origen y la de destino.');
      return;
    }
    try {
      const res = await lastValueFrom(
        this.service.vistaPreviaTraslado({
          origenId: this.origenId,
          destinoId: this.destinoId,
          desde: aFechaLocal(this.desde),
          hasta: aFechaLocal(this.hasta),
          terceroId: this.terceroTraslado,
        }),
      );
      this.resumen = res?.data ?? null;
      this.seleccion = (this.resumen?.movimientos ?? []).filter((m) => !this.bloqueado(m));
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo calcular el traslado');
    }
    this.cdr.markForCheck();
  }

  trasladar(): void {
    if (!this.resumen || !this.motivoTraslado.trim()) {
      this.alert.showWarn('Falta el motivo', 'Escribe por qué trasladas: queda en la bitácora.');
      return;
    }
    if (!this.seleccion.length) {
      this.alert.showWarn('Nada elegido', 'Marca los movimientos que quieres trasladar.');
      return;
    }
    // Todos los del rango: se manda sin ids (el back mueve el rango completo).
    const ids = this.todosElegidos && !this.resumen.periodosCerrados.length ? null : this.seleccion.map((m) => m.id);
    this.confirm.confirm({
      header: 'Trasladar movimientos',
      message: `Se moverán ${this.seleccion.length} movimiento(s) a la cuenta destino. ¿Continuar?`,
      acceptLabel: 'Trasladar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.trasladando = true;
        this.cdr.markForCheck();
        try {
          const res = await lastValueFrom(
            this.service.trasladarCuenta({
              origenId: this.origenId!,
              destinoId: this.destinoId!,
              desde: aFechaLocal(this.desde),
              hasta: aFechaLocal(this.hasta),
              terceroId: this.terceroTraslado,
              detalleIds: ids,
              motivo: this.motivoTraslado.trim(),
            }),
          );
          this.alert.showSuccess('Traslado hecho', res?.message ?? '');
          this.resumen = null;
          this.seleccion = [];
          this.motivoTraslado = '';
          this.historialTraslados = (await lastValueFrom(this.service.historialTraslados()))?.data ?? [];
        } catch (e: any) {
          this.alert.showError('Error', e?.error?.message ?? 'No se pudo trasladar');
        } finally {
          this.trasladando = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  // ── Fusión ───────────────────────────────────────────────────
  async verFusion(): Promise<void> {
    if (!this.terceroOrigen || !this.terceroDestino) {
      this.alert.showWarn('Faltan datos', 'Elige el tercero duplicado y el que se conserva.');
      return;
    }
    try {
      const res = await lastValueFrom(this.service.vistaPreviaFusion(this.terceroOrigen, this.terceroDestino));
      this.previaFusion = Object.entries(res?.data ?? {}).map(([tabla, registros]) => ({ tabla, registros }));
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo calcular la fusión');
    }
    this.cdr.markForCheck();
  }

  fusionar(): void {
    if (!this.previaFusion || !this.motivoFusion.trim()) {
      this.alert.showWarn('Falta el motivo', 'Escribe por qué se fusionan: queda en la bitácora.');
      return;
    }
    this.confirm.confirm({
      header: 'Fusionar terceros',
      message:
        'Todo lo del tercero duplicado pasa al que se conserva y el duplicado queda inactivo. No se puede deshacer desde aquí. ¿Continuar?',
      acceptLabel: 'Fusionar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        this.fusionando = true;
        this.cdr.markForCheck();
        try {
          const res = await lastValueFrom(
            this.service.fusionarTerceros({
              origenId: this.terceroOrigen!,
              destinoId: this.terceroDestino!,
              motivo: this.motivoFusion.trim(),
            }),
          );
          this.alert.showSuccess('Terceros fusionados', res?.message ?? '');
          this.previaFusion = null;
          this.terceroOrigen = null;
          this.motivoFusion = '';
          this.historialFusiones = (await lastValueFrom(this.service.historialFusiones()))?.data ?? [];
        } catch (e: any) {
          this.alert.showError('Error', e?.error?.message ?? 'No se pudo fusionar');
        } finally {
          this.fusionando = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  /** "compra.proveedor_id" → "Compras (proveedor)". */
  etiquetaTabla(t: string): string {
    const [tabla, col] = t.split('.');
    return `${tabla.replace(/_/g, ' ')} (${col.replace(/_id$/, '').replace(/_/g, ' ')})`;
  }
}
