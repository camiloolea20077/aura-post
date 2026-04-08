import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import { AlertService } from '../../../../shared/pipes/alert.service';
import { MapPickerComponent } from '../../../../shared/components/map-picker/map-picker.component';
import { VisitaService } from '../services/visita.service';
import { VisitaModel } from '../../models/vendedor.model';

@Component({
  selector: 'app-detalle-visita',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TagModule,
    MapPickerComponent,
  ],
  templateUrl: './detalle-visita.component.html',
  styleUrls: ['./detalle-visita.component.scss'],
})
export class DetalleVisitaComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() visitaId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  loading = false;
  visita: VisitaModel | null = null;

  constructor(
    private readonly service: VisitaService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.visitaId) {
      this.loadDetalle();
    }
    if (changes['visible'] && !this.visible) {
      this.visita = null;
    }
  }

  async loadDetalle(): Promise<void> {
    if (!this.visitaId) return;
    this.loading = true;
    this.cdr.markForCheck();

    try {
      const res = await lastValueFrom(this.service.getById(this.visitaId));
      this.visita = res?.data ?? null;
    } catch {
      this.alert.showError('Error', 'No se pudo cargar los detalles');
      this.visita = null;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visita = null;
    this.visibleChange.emit(false);
  }

  getSeverity(estado: string): 'warn' | 'success' | 'danger' {
    switch (estado) {
      case 'PROGRAMADA':
        return 'warn';
      case 'COMPLETADA':
        return 'success';
      case 'CANCELADA':
        return 'danger';
      default:
        return 'warn';
    }
  }
}
