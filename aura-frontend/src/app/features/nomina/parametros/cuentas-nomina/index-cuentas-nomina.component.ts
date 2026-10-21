import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  ConceptoContableNominaModel,
  OPCIONES_TERCERO_CREDITO,
  TEXTO_CLASE_CONCEPTO,
  TerceroCreditoNomina,
} from '../../../../core/models/nomina-parametros.model';
import { NominaConceptoContableService } from '../../../../core/services/nomina-concepto-contable.service';
import { CuentaAutocompleteComponent } from '../../../../shared/components/cuenta-autocomplete/cuenta-autocomplete.component';
import { TerceroAutocompleteComponent } from '../../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';

/** Formulario del modal (lo nulo = valor por defecto). */
interface FormCambio {
  cuentaDebitoId: number | null;
  cuentaCreditoId: number | null;
  terceroCredito: TerceroCreditoNomina | null;
  terceroFijoId: number | null;
}

/**
 * Cuentas contables de nómina: cómo se contabiliza cada concepto en el asiento de
 * la nómina (cuenta del débito, del crédito y tercero) y los cambios de la empresa
 * sobre ese valor por defecto.
 */
@Component({
  selector: 'app-index-cuentas-nomina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    CuentaAutocompleteComponent,
    TerceroAutocompleteComponent,
    PuedeDirective,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-cuentas-nomina.component.html',
  styleUrls: ['./index-cuentas-nomina.component.scss'],
})
export class IndexCuentasNominaComponent implements OnInit {
  conceptos: ConceptoContableNominaModel[] = [];
  cargando = true;
  busqueda = '';

  mostrarForm = false;
  guardando = false;
  seleccionado: ConceptoContableNominaModel | null = null;
  form: FormCambio = { cuentaDebitoId: null, cuentaCreditoId: null, terceroCredito: null, terceroFijoId: null };

  readonly opcionesTercero = OPCIONES_TERCERO_CREDITO;
  readonly textoClase = TEXTO_CLASE_CONCEPTO;
  readonly prefijosDebito = ['5', '6', '7'];
  readonly prefijosCredito = ['2'];

  constructor(
    private readonly service: NominaConceptoContableService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargar();
  }

  /** Conceptos que coinciden con la búsqueda (código o nombre). */
  get filtrados(): ConceptoContableNominaModel[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.conceptos;
    return this.conceptos.filter(
      (c) => c.codigo.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q),
    );
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.listar());
      this.conceptos = res?.data ?? [];
    } catch {
      this.conceptos = [];
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  editar(c: ConceptoContableNominaModel): void {
    this.seleccionado = c;
    this.form = {
      cuentaDebitoId: c.cuentaDebitoId,
      cuentaCreditoId: c.cuentaCreditoId,
      terceroCredito: c.terceroCredito,
      terceroFijoId: c.terceroFijoId,
    };
    this.mostrarForm = true;
  }

  /** Texto del tercero efectivo de una fila. */
  tercero(c: ConceptoContableNominaModel): string {
    if (!c.terceroCredito) return c.terceroDefecto ?? '—';
    if (c.terceroCredito === 'FIJO') return c.terceroFijo ?? 'Tercero fijo';
    return OPCIONES_TERCERO_CREDITO.find((o) => o.value === c.terceroCredito)?.label ?? c.terceroCredito;
  }

  async guardar(): Promise<void> {
    const c = this.seleccionado;
    if (!c) return;
    if (this.form.terceroCredito === 'FIJO' && !this.form.terceroFijoId) {
      this.alert.showWarn('Cuentas de nómina', 'Elija el tercero fijo.');
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.guardar(c.codigo, {
          cuentaDebitoId: c.aplicaDebito ? this.form.cuentaDebitoId : null,
          cuentaCreditoId: c.aplicaCredito ? this.form.cuentaCreditoId : null,
          terceroCredito: c.aplicaCredito ? this.form.terceroCredito : null,
          terceroFijoId: this.form.terceroCredito === 'FIJO' ? this.form.terceroFijoId : null,
        }),
      );
      this.reemplazar(res.data);
      this.mostrarForm = false;
      this.alert.showSuccess('Cuentas de nómina', `${c.codigo} guardado`);
    } catch (err: any) {
      this.alert.showError('No se pudo guardar', err?.error?.message ?? 'Revise los datos.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  confirmarRestablecer(c: ConceptoContableNominaModel): void {
    this.confirm.confirm({
      message: `¿Volver <b>${c.codigo}</b> a su contabilización por defecto?`,
      header: 'Restablecer concepto',
      icon: 'pi pi-replay',
      acceptLabel: 'Sí, restablecer',
      rejectLabel: 'Cancelar',
      accept: () => void this.restablecer(c),
    });
  }

  private async restablecer(c: ConceptoContableNominaModel): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.restablecer(c.codigo));
      this.reemplazar(res.data);
      this.alert.showSuccess('Cuentas de nómina', `${c.codigo} restablecido`);
    } catch (err: any) {
      this.alert.showError('No se pudo restablecer', err?.error?.message ?? 'Intente de nuevo.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  private reemplazar(c: ConceptoContableNominaModel): void {
    this.conceptos = this.conceptos.map((x) => (x.codigo === c.codigo ? c : x));
  }
}
