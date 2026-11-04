import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  CargoConceptoModel,
  GuardarCargoConceptoDto,
} from '../../../../../core/models/cargo-plantilla.model';
import {
  CLASE_CONCEPTO_OPTS,
  ConceptoModel,
  ENTRADA_CONCEPTO_OPTS,
  etiquetaOpcion,
  REDONDEO_MODO_OPTS,
  REDONDEO_PRECISION_OPTS,
} from '../../../../../core/models/concepto.model';
import { NominaCargoPlantillaService } from '../../../../../core/services/nomina-cargo-plantilla.service';
import { AlertService } from '../../../../../shared/pipes/alert.service';
import { ConceptoBuscadorComponent } from '../../../../../shared/components/concepto-buscador/concepto-buscador.component';
import { severidadClase } from '../../../conceptos/concepto.util';

/**
 * Conceptos que el cargo liquida siempre (sueldo, seguridad social, provisiones…).
 * Se agregan en lote con el buscador avanzado. Cantidad, valor y porcentaje
 * vacíos = los del concepto; con valor, el cargo lo fija.
 */
@Component({
  selector: 'app-conceptos-cargo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConceptoBuscadorComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './conceptos-cargo.component.html',
  styleUrls: ['../../../tab-detalle.scss'],
})
export class ConceptosCargoComponent implements OnChanges {
  @Input({ required: true }) cargoId!: number;
  @Input() soloLectura = false;
  /** Cambia cuando la página copia la plantilla de otro cargo: fuerza la recarga. */
  @Input() version = 0;

  filas: CargoConceptoModel[] = [];
  mostrarBuscador = false;
  mostrarForm = false;
  editando: CargoConceptoModel | null = null;
  guardando = false;
  form: FormGroup;

  readonly severidadClase = severidadClase;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NominaCargoPlantillaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {
    this.form = this.fb.group({
      cantidad: [null as number | null],
      valor: [null as number | null],
      porcentaje: [null as number | null],
      observacion: [null as string | null],
    });
  }

  /** Números ya agregados: el buscador los muestra en gris. */
  get numeros(): number[] {
    return this.filas.map((f) => f.conceptoNumero);
  }

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.conceptos(this.cargoId));
      this.filas = res.data ?? [];
    } catch {
      this.alert.showError('Conceptos del cargo', 'No se pudieron cargar.');
    }
  }

  async onAgregar(conceptos: ConceptoModel[]): Promise<void> {
    if (!conceptos.length) return;
    try {
      const res = await lastValueFrom(
        this.service.agregarConceptos(
          this.cargoId,
          conceptos.map((c) => c.numero),
        ),
      );
      this.filas = res.data ?? [];
      this.alert.showSuccess(
        'Conceptos del cargo',
        `${conceptos.length} agregado(s).`,
      );
    } catch (err: any) {
      this.alert.showError(
        'Conceptos del cargo',
        err?.error?.message ?? 'No se pudieron agregar.',
      );
    }
  }

  editar(f: CargoConceptoModel): void {
    this.editando = f;
    this.form.reset({
      cantidad: f.cantidad,
      valor: f.valor,
      porcentaje: f.porcentaje,
      observacion: f.observacion,
    });
    this.mostrarForm = true;
  }

  async guardar(): Promise<void> {
    if (!this.editando) return;
    const v = this.form.getRawValue();
    const dto: GuardarCargoConceptoDto = {
      cantidad: v.cantidad,
      valor: v.valor,
      porcentaje: v.porcentaje,
      observacion: v.observacion?.trim() || null,
    };
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.service.actualizarConcepto(this.cargoId, this.editando.id, dto),
      );
      this.filas = res.data ?? [];
      this.mostrarForm = false;
      this.alert.showSuccess('Conceptos del cargo', 'Guardado.');
    } catch (err: any) {
      this.alert.showError(
        'Conceptos del cargo',
        err?.error?.message ?? 'No se pudo guardar.',
      );
    } finally {
      this.guardando = false;
    }
  }

  confirmarQuitar(f: CargoConceptoModel): void {
    this.confirm.confirm({
      message: `¿Quitar <b>${f.conceptoNumero} - ${f.conceptoNombre ?? ''}</b> del cargo?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.quitar(f),
    });
  }

  private async quitar(f: CargoConceptoModel): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.service.quitarConcepto(this.cargoId, f.id),
      );
      this.filas = res.data ?? [];
    } catch (err: any) {
      this.alert.showError(
        'Conceptos del cargo',
        err?.error?.message ?? 'No se pudo quitar.',
      );
    }
  }

  textoClase(f: CargoConceptoModel): string {
    return etiquetaOpcion(CLASE_CONCEPTO_OPTS, f.clase);
  }

  textoEntrada(f: CargoConceptoModel): string {
    return etiquetaOpcion(ENTRADA_CONCEPTO_OPTS, f.entrada);
  }

  textoRedondeo(f: CargoConceptoModel): string {
    if (!f.redondeoPrecision || f.redondeoPrecision === 'NINGUNO')
      return 'No redondea';
    return `${etiquetaOpcion(REDONDEO_PRECISION_OPTS, f.redondeoPrecision)} - ${etiquetaOpcion(REDONDEO_MODO_OPTS, f.redondeoModo)}`;
  }

  /** Lo que el cargo fija sobre el concepto, o "Del concepto". */
  textoPropio(f: CargoConceptoModel): string {
    if (f.valor != null)
      return f.valor.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      });
    if (f.porcentaje != null) return `${f.porcentaje} %`;
    if (f.cantidad != null) return `${f.cantidad}`;
    return 'Del concepto';
  }
}
