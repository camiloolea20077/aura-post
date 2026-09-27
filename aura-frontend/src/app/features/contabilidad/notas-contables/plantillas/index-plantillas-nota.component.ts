import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../../../shared/pipes/fecha-es.pipe';
import {
  clasificacionLabel,
  NotaPlantillaModel,
} from '../models/nota-contable.model';
import { PlantillaDialogComponent } from '../plantilla-dialog/plantilla-dialog.component';
import { NotaContableService } from '../services/nota-contable.service';

/**
 * Plantillas de notas contables. Se crean desde una nota ("Guardar como
 * plantilla"); aquí se usan, se ajusta su recurrencia o se eliminan.
 */
@Component({
  selector: 'app-index-plantillas-nota',
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
    ToastModule,
    TooltipModule,
    FechaEsPipe,
    PlantillaDialogComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './index-plantillas-nota.component.html',
  styleUrls: ['./index-plantillas-nota.component.scss'],
})
export class IndexPlantillasNotaComponent implements OnInit {
  readonly clasificacionLabel = clasificacionLabel;
  plantillas: NotaPlantillaModel[] = [];
  loading = false;
  searchQuery = '';

  showEditar = false;
  seleccionada: NotaPlantillaModel | null = null;

  constructor(
    private readonly service: NotaContableService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.plantillas());
      this.plantillas = res.data ?? [];
    } catch {
      this.plantillas = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  get filtradas(): NotaPlantillaModel[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.plantillas;
    return this.plantillas.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q),
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.cdr.markForCheck();
  }

  nueva(): void {
    this.router.navigate(['/contabilidad/notas/nueva'], { queryParams: { modo: 'plantilla' } });
  }

  editarLineas(p: NotaPlantillaModel): void {
    this.router.navigate(['/contabilidad/notas/nueva'], {
      queryParams: { modo: 'plantilla', plantilla: p.id },
    });
  }

  usar(p: NotaPlantillaModel): void {
    this.router.navigate(['/contabilidad/notas/nueva'], {
      queryParams: { plantilla: p.id },
    });
  }

  editar(p: NotaPlantillaModel): void {
    this.seleccionada = p;
    this.showEditar = true;
  }

  eliminar(p: NotaPlantillaModel): void {
    this.confirm.confirm({
      header: 'Eliminar plantilla',
      message: `¿Eliminar la plantilla "${p.nombre}"? Las notas que ya salieron de ella no cambian.`,
      icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminarPlantilla(p.id));
          this.alert.showSuccess('Plantilla eliminada', '');
          this.load();
        } catch (e: any) {
          this.alert.showError(
            'No se pudo eliminar',
            e?.error?.message ?? 'Intente de nuevo',
          );
        }
      },
    });
  }

  volver(): void {
    this.router.navigate(['/contabilidad/notas']);
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
