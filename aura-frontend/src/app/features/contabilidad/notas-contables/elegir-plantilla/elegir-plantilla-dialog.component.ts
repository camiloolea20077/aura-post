import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { lastValueFrom } from 'rxjs';

import {
  clasificacionLabel,
  NotaPlantillaModel,
} from '../models/nota-contable.model';
import { NotaContableService } from '../services/nota-contable.service';

/** Lista de plantillas para llenar la nota con una de ellas. */
@Component({
  selector: 'app-elegir-plantilla-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
  ],
  templateUrl: './elegir-plantilla-dialog.component.html',
  styleUrls: ['./elegir-plantilla-dialog.component.scss'],
})
export class ElegirPlantillaDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() elegida = new EventEmitter<number>();

  readonly clasificacionLabel = clasificacionLabel;
  plantillas: NotaPlantillaModel[] = [];
  loading = false;
  busqueda = '';

  constructor(
    private readonly service: NotaContableService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnChanges(): Promise<void> {
    if (!this.visible) return;
    this.busqueda = '';
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.plantillas());
      this.plantillas = (res.data ?? []).filter((p) => p.activa);
    } catch {
      this.plantillas = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  get filtradas(): NotaPlantillaModel[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.plantillas;
    return this.plantillas.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q),
    );
  }

  elegir(p: NotaPlantillaModel): void {
    this.elegida.emit(p.id);
    this.cerrar();
  }

  cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  formatCOP = (v: number): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
