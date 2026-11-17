import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import {
  ConceptoContableNominaModel,
  OPCIONES_TERCERO_CREDITO,
  TerceroCreditoNomina,
} from '../../../../core/models/nomina-parametros.model';
import { NominaConceptoContableService } from '../../../../core/services/nomina-concepto-contable.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { CuentaAutocompleteComponent } from '../../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';

/**
 * Pestaña Contable del concepto: cuenta del débito, cuenta del crédito y a nombre
 * de quién va el crédito en el asiento de nómina. Es la misma configuración de
 * Cuentas de nómina (backend `/api/nomina/conceptos-contables`), aquí para un
 * solo concepto. Vacío = la contabilización por defecto.
 */
@Component({
  selector: 'app-concepto-contable',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SelectModule, TagModule, CuentaAutocompleteComponent,
    TerceroAutocompleteComponent],
  templateUrl: './concepto-contable.component.html',
  styleUrls: ['../../tab-detalle.scss'],
})
export class ConceptoContableComponent implements OnChanges {
  /** Clave interna del concepto (la usa la configuración contable). */
  @Input({ required: true }) codigo!: string;
  @Input() soloLectura = false;

  fila: ConceptoContableNominaModel | null = null;
  cargando = true;
  guardando = false;
  form: {
    cuentaDebitoId: number | null;
    cuentaCreditoId: number | null;
    terceroCredito: TerceroCreditoNomina | null;
    terceroFijoId: number | null;
  } = { cuentaDebitoId: null, cuentaCreditoId: null, terceroCredito: null, terceroFijoId: null };

  readonly opcionesTercero = OPCIONES_TERCERO_CREDITO;
  readonly prefijosDebito = ['5', '6', '7'];
  readonly prefijosCredito = ['2'];

  constructor(
    private readonly service: NominaConceptoContableService,
    private readonly alert: AlertService,
  ) {}

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando = true;
    try {
      const res = await lastValueFrom(this.service.listar());
      this.fila = (res.data ?? []).find((c) => c.codigo === this.codigo) ?? null;
      this.llenar();
    } catch {
      this.alert.showError('Contable', 'No se pudo cargar la contabilización.');
    } finally {
      this.cargando = false;
    }
  }

  private llenar(): void {
    const c = this.fila;
    this.form = {
      cuentaDebitoId: c?.cuentaDebitoId ?? null,
      cuentaCreditoId: c?.cuentaCreditoId ?? null,
      terceroCredito: c?.terceroCredito ?? null,
      terceroFijoId: c?.terceroFijoId ?? null,
    };
  }

  async guardar(): Promise<void> {
    const c = this.fila;
    if (!c) return;
    if (this.form.terceroCredito === 'FIJO' && !this.form.terceroFijoId) {
      this.alert.showWarn('Contable', 'Elija el tercero fijo.');
      return;
    }
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.service.guardar(c.codigo, {
          cuentaDebitoId: c.aplicaDebito ? this.form.cuentaDebitoId : null,
          cuentaCreditoId: c.aplicaCredito ? this.form.cuentaCreditoId : null,
          terceroCredito: c.aplicaCredito ? this.form.terceroCredito : null,
          terceroFijoId: this.form.terceroCredito === 'FIJO' ? this.form.terceroFijoId : null,
        }),
      );
      this.fila = res.data;
      this.llenar();
      this.alert.showSuccess('Contable', 'Contabilización guardada.');
    } catch (err: any) {
      this.alert.showError('Contable', err?.error?.message ?? 'No se pudo guardar.');
    } finally {
      this.guardando = false;
    }
  }

  async restablecer(): Promise<void> {
    if (!this.fila) return;
    try {
      const res = await lastValueFrom(this.service.restablecer(this.fila.codigo));
      this.fila = res.data;
      this.llenar();
      this.alert.showSuccess('Contable', 'Volvió a la contabilización por defecto.');
    } catch (err: any) {
      this.alert.showError('Contable', err?.error?.message ?? 'No se pudo restablecer.');
    }
  }
}
