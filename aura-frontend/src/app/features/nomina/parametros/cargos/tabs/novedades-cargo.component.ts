import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  CargoNovedadModel,
  GuardarCargoNovedadDto,
} from '../../../../../core/models/cargo-plantilla.model';
import {
  CLASE_CONCEPTO_OPTS,
  ConceptoModel,
  ENTRADA_CONCEPTO_OPTS,
  etiquetaOpcion,
  SI_NO_OPTS,
} from '../../../../../core/models/concepto.model';
import { NominaCargoPlantillaService } from '../../../../../core/services/nomina-cargo-plantilla.service';
import { AlertService } from '../../../../../shared/pipes/alert.service';
import { ConceptoBuscadorComponent } from '../../../../../shared/components/concepto-buscador/concepto-buscador.component';
import { severidadClase } from '../../../conceptos/concepto.util';

/**
 * Novedades que se le pueden reportar a quien tenga el cargo (incapacidades,
 * libranzas, embargos, auxilios…), con tope por período y si exigen autorización.
 */
@Component({
  selector: 'app-novedades-cargo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConceptoBuscadorComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './novedades-cargo.component.html',
  styleUrls: ['../../../tab-detalle.scss'],
})
export class NovedadesCargoComponent implements OnChanges {
  @Input({ required: true }) cargoId!: number;
  @Input() soloLectura = false;
  /** Cambia cuando la página copia la plantilla de otro cargo: fuerza la recarga. */
  @Input() version = 0;

  filas: CargoNovedadModel[] = [];
  mostrarBuscador = false;
  mostrarForm = false;
  editando: CargoNovedadModel | null = null;
  guardando = false;
  form: FormGroup;

  readonly severidadClase = severidadClase;
  readonly siNoOpts = SI_NO_OPTS;

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: NominaCargoPlantillaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {
    this.form = this.fb.group({
      topeCantidad: [null as number | null],
      topeValor: [null as number | null],
      requiereAutorizacion: [false],
    });
  }

  get numeros(): number[] {
    return this.filas.map((f) => f.conceptoNumero);
  }

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.novedades(this.cargoId));
      this.filas = res.data ?? [];
    } catch {
      this.alert.showError('Novedades permitidas', 'No se pudieron cargar.');
    }
  }

  async onAgregar(conceptos: ConceptoModel[]): Promise<void> {
    if (!conceptos.length) return;
    try {
      const res = await lastValueFrom(
        this.service.agregarNovedades(
          this.cargoId,
          conceptos.map((c) => c.numero),
        ),
      );
      this.filas = res.data ?? [];
      this.alert.showSuccess(
        'Novedades permitidas',
        `${conceptos.length} agregada(s).`,
      );
    } catch (err: any) {
      this.alert.showError(
        'Novedades permitidas',
        err?.error?.message ?? 'No se pudieron agregar.',
      );
    }
  }

  editar(f: CargoNovedadModel): void {
    this.editando = f;
    this.form.reset({
      topeCantidad: f.topeCantidad,
      topeValor: f.topeValor,
      requiereAutorizacion: f.requiereAutorizacion,
    });
    this.mostrarForm = true;
  }

  async guardar(): Promise<void> {
    if (!this.editando) return;
    const v = this.form.getRawValue();
    const dto: GuardarCargoNovedadDto = {
      topeCantidad: v.topeCantidad,
      topeValor: v.topeValor,
      requiereAutorizacion: !!v.requiereAutorizacion,
    };
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.service.actualizarNovedad(this.cargoId, this.editando.id, dto),
      );
      this.filas = res.data ?? [];
      this.mostrarForm = false;
      this.alert.showSuccess('Novedades permitidas', 'Guardado.');
    } catch (err: any) {
      this.alert.showError(
        'Novedades permitidas',
        err?.error?.message ?? 'No se pudo guardar.',
      );
    } finally {
      this.guardando = false;
    }
  }

  confirmarQuitar(f: CargoNovedadModel): void {
    this.confirm.confirm({
      message: `¿Dejar de permitir <b>${f.conceptoNumero} - ${f.conceptoNombre ?? ''}</b> en el cargo?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.quitar(f),
    });
  }

  private async quitar(f: CargoNovedadModel): Promise<void> {
    try {
      const res = await lastValueFrom(
        this.service.quitarNovedad(this.cargoId, f.id),
      );
      this.filas = res.data ?? [];
    } catch (err: any) {
      this.alert.showError(
        'Novedades permitidas',
        err?.error?.message ?? 'No se pudo quitar.',
      );
    }
  }

  textoClase(f: CargoNovedadModel): string {
    return etiquetaOpcion(CLASE_CONCEPTO_OPTS, f.clase);
  }

  textoEntrada(f: CargoNovedadModel): string {
    return etiquetaOpcion(ENTRADA_CONCEPTO_OPTS, f.entrada);
  }
}
