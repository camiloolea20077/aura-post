import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

import { CreateNovedadPermitidaDto, NovedadPermitida } from '../../../../core/models/vinculacion.model';
import { ConceptoService } from '../../../../core/services/concepto.service';
import { VinculacionService } from '../../../../core/services/vinculacion.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { OpcionConcepto, opcionesConcepto, severidadClase } from './conceptos.util';

/**
 * Novedades permitidas: qué conceptos se le pueden registrar a esta vinculación
 * (horas extra, comisiones, préstamos…), con tope por período y si exigen
 * autorización del jefe.
 */
@Component({
  selector: 'app-novedades-permitidas-vinculacion',
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
  ],
  providers: [ConfirmationService],
  templateUrl: './novedades-permitidas-vinculacion.component.html',
  styleUrls: ['../../tab-detalle.scss'],
})
export class NovedadesPermitidasVinculacionComponent implements OnChanges {
  @Input({ required: true }) vinculacionId!: number;
  @Input() soloLectura = false;

  filas: NovedadPermitida[] = [];
  opciones: OpcionConcepto[] = [];
  mostrarForm = false;
  editando: NovedadPermitida | null = null;
  guardando = false;
  form: FormGroup;

  readonly severidadClase = severidadClase;
  readonly opcionesSiNo = [
    { label: 'Sí', value: true },
    { label: 'No', value: false },
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: VinculacionService,
    private readonly conceptos: ConceptoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {
    this.form = this.fb.group({
      conceptoCodigo: [null as string | null, Validators.required],
      topeCantidad: [null as number | null],
      topeValor: [null as number | null],
      requiereAutorizacion: [false],
    });
  }

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const [lista, catalogo] = await Promise.all([
        lastValueFrom(this.service.novedadesPermitidas(this.vinculacionId)),
        lastValueFrom(this.conceptos.vigentes()),
      ]);
      this.filas = lista.data ?? [];
      this.opciones = opcionesConcepto(catalogo.data ?? []);
    } catch {
      this.alert.showError('Novedades permitidas', 'No se pudieron cargar.');
    }
  }

  nuevo(): void {
    this.editando = null;
    this.form.reset({ requiereAutorizacion: false });
    this.form.get('conceptoCodigo')?.enable();
    this.mostrarForm = true;
  }

  editar(n: NovedadPermitida): void {
    this.editando = n;
    this.form.reset({ ...n });
    this.mostrarForm = true;
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateNovedadPermitidaDto = {
      conceptoCodigo: v.conceptoCodigo,
      topeCantidad: v.topeCantidad,
      topeValor: v.topeValor,
      requiereAutorizacion: !!v.requiereAutorizacion,
    };
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.editando
          ? this.service.actualizarNovedad(this.vinculacionId, this.editando.id, dto)
          : this.service.crearNovedad(this.vinculacionId, dto),
      );
      this.filas = res.data ?? [];
      this.mostrarForm = false;
      this.alert.showSuccess('Novedades permitidas', 'Guardado.');
    } catch (err: any) {
      this.alert.showError('Novedades permitidas', err?.error?.message ?? 'No se pudo guardar.');
    } finally {
      this.guardando = false;
    }
  }

  confirmarEliminar(n: NovedadPermitida): void {
    this.confirm.confirm({
      message: `¿Dejar de permitir <b>${n.conceptoNombre ?? n.conceptoCodigo}</b>?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(n),
    });
  }

  private async eliminar(n: NovedadPermitida): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.eliminarNovedad(this.vinculacionId, n.id));
      this.filas = res.data ?? [];
    } catch (err: any) {
      this.alert.showError('Novedades permitidas', err?.error?.message ?? 'No se pudo quitar.');
    }
  }
}
