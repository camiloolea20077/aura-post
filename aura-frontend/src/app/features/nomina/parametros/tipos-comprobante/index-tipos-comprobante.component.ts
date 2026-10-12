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

import {
  OPCIONES_CLASE_COMPROBANTE,
  OPCIONES_FRECUENCIA,
  TipoComprobanteModel,
} from '../../../../core/models/nomina-parametros.model';
import { NominaTipoComprobanteService } from '../../../../core/services/nomina-tipo-comprobante.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { FormTipoComprobanteComponent } from './form-tipo-comprobante.component';

/** Etiqueta de un valor dentro de una lista de opciones. */
const etiqueta = (
  opciones: { label: string; value: unknown }[],
  valor: unknown,
): string => opciones.find((o) => o.value === valor)?.label ?? '—';

/**
 * Tipos de comprobante de nómina: con qué se crea cada prenómina y nómina
 * (qué liquida, su numeración y qué empleados admite).
 */
@Component({
  selector: 'app-index-tipos-comprobante',
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
    FormTipoComprobanteComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './index-tipos-comprobante.component.html',
  styleUrls: ['../parametros-index.scss'],
})
export class IndexTiposComprobanteComponent implements OnInit {
  filas: TipoComprobanteModel[] = [];
  totalFilas = 0;
  cargando = true;
  busqueda = '';
  pagina = 0;
  tamano = 10;

  mostrarForm = false;
  seleccionado: TipoComprobanteModel | null = null;

  constructor(
    private readonly service: NominaTipoComprobanteService,
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

  editar(t: TipoComprobanteModel): void {
    this.seleccionado = t;
    this.mostrarForm = true;
  }

  textoClase(t: TipoComprobanteModel): string {
    return etiqueta(OPCIONES_CLASE_COMPROBANTE, t.clase);
  }

  textoFrecuencia(t: TipoComprobanteModel): string {
    return t.frecuencia ? etiqueta(OPCIONES_FRECUENCIA, t.frecuencia) : '—';
  }

  confirmarEliminar(t: TipoComprobanteModel): void {
    this.confirm.confirm({
      message: `¿Eliminar el tipo <b>${t.nombre}</b>?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => void this.eliminar(t),
    });
  }

  private async eliminar(t: TipoComprobanteModel): Promise<void> {
    try {
      await lastValueFrom(this.service.eliminar(t.id));
      this.alert.showSuccess('Eliminado', `${t.nombre} eliminado`);
      void this.cargar();
    } catch (err: any) {
      this.alert.showError(
        'No se pudo eliminar',
        err?.error?.message ?? 'Intente de nuevo.',
      );
    }
  }
}
