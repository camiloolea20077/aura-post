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
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { NominaCargoModel } from '../../../../core/models/nomina-parametros.model';
import { NominaCargoService } from '../../../../core/services/nomina-cargo.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormCargoComponent } from './form-cargo.component';

/** Cargos de la empresa (módulo aparte): nivel, tipo, plazas y rango salarial. */
@Component({
  selector: 'app-index-cargos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    InputTextModule,
    TableModule,
    TagModule,
    TooltipModule,
    PuedeDirective,
    FormCargoComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-cargos.component.html',
  styleUrls: ['../parametros-index.scss'],
})
export class IndexCargosComponent implements OnInit {
  filas: NominaCargoModel[] = [];
  totalFilas = 0;
  cargando = true;
  busqueda = '';
  pagina = 0;
  tamano = 10;

  mostrarForm = false;
  seleccionado: NominaCargoModel | null = null;

  constructor(
    private readonly service: NominaCargoService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.page({
          page: this.pagina,
          rows: this.tamano,
          search: this.busqueda || null,
        }),
      );
      this.filas = res?.data?.content ?? [];
      this.totalFilas = res?.data?.totalElements ?? 0;
    } catch {
      this.filas = [];
      this.totalFilas = 0;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  onPagina(e: { first: number; rows: number }): void {
    this.pagina = e.first / e.rows;
    this.tamano = e.rows;
    void this.cargar();
  }

  buscar(): void {
    this.pagina = 0;
    void this.cargar();
  }

  limpiarBusqueda(): void {
    if (!this.busqueda) return;
    this.busqueda = '';
    this.buscar();
  }

  nuevo(): void {
    this.seleccionado = null;
    this.mostrarForm = true;
  }

  editar(c: NominaCargoModel): void {
    this.seleccionado = c;
    this.mostrarForm = true;
  }

  confirmarEliminar(c: NominaCargoModel): void {
    this.confirm.confirm({
      message: `¿Eliminar el cargo <b>${c.nombre}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(c),
    });
  }

  private async eliminar(c: NominaCargoModel): Promise<void> {
    try {
      await lastValueFrom(this.service.eliminar(c.id));
      this.alert.showSuccess('Eliminado', `Cargo ${c.nombre} eliminado`);
      void this.cargar();
    } catch (err: any) {
      this.alert.showError(
        'No se pudo eliminar',
        err?.error?.message ?? 'Intente de nuevo.',
      );
    }
  }
}
