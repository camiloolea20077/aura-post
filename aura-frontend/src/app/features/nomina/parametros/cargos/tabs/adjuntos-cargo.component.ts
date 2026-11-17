import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { CargoAdjuntoModel } from '../../../../../core/models/cargo-plantilla.model';
import { NominaCargoPlantillaService } from '../../../../../core/services/nomina-cargo-plantilla.service';
import { AlertService } from '../../../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../../../shared/pipes/fecha-es.pipe';

/** Adjuntos del cargo: manual de funciones, acto administrativo, perfil… (PDF, imagen, Excel o Word). */
@Component({
  selector: 'app-adjuntos-cargo',
  standalone: true,
  imports: [CommonModule, ButtonModule, ConfirmDialogModule, TableModule, TooltipModule, FechaEsPipe],
  providers: [ConfirmationService],
  templateUrl: './adjuntos-cargo.component.html',
  styleUrls: ['../../../tab-detalle.scss'],
})
export class AdjuntosCargoComponent implements OnChanges {
  @Input({ required: true }) cargoId!: number;
  @Input() soloLectura = false;

  filas: CargoAdjuntoModel[] = [];
  subiendo = false;

  constructor(
    private readonly service: NominaCargoPlantillaService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
  ) {}

  ngOnChanges(): void {
    void this.cargar();
  }

  private async cargar(): Promise<void> {
    try {
      const res = await lastValueFrom(this.service.adjuntos(this.cargoId));
      this.filas = res.data ?? [];
    } catch {
      this.alert.showError('Adjuntos', 'No se pudieron cargar.');
    }
  }

  async onArchivo(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    this.subiendo = true;
    try {
      await lastValueFrom(this.service.subirAdjunto(this.cargoId, archivo));
      this.alert.showSuccess('Adjuntos', `${archivo.name} cargado.`);
      await this.cargar();
    } catch (err: any) {
      this.alert.showError('Adjuntos', err?.error?.message ?? 'No se pudo cargar el archivo.');
    } finally {
      this.subiendo = false;
    }
  }

  confirmarEliminar(a: CargoAdjuntoModel): void {
    this.confirm.confirm({
      message: `¿Quitar <b>${a.nombreArchivo}</b>?`,
      header: 'Confirmar',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(a),
    });
  }

  private async eliminar(a: CargoAdjuntoModel): Promise<void> {
    try {
      await lastValueFrom(this.service.eliminarAdjunto(this.cargoId, a.id));
      this.filas = this.filas.filter((f) => f.id !== a.id);
    } catch (err: any) {
      this.alert.showError('Adjuntos', err?.error?.message ?? 'No se pudo quitar.');
    }
  }

  tamano(a: CargoAdjuntoModel): string {
    const b = a.tamanoBytes ?? 0;
    return b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
  }
}
