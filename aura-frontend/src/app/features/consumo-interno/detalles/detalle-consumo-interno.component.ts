import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import {
  ConsumoInternoModel,
  ConsumoInternoTableModel,
} from '../../../core/models/consumo-interno.model';

@Component({
  selector: 'app-detalle-consumo-interno',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    TagModule,
    SkeletonModule,
    TableModule,
  ],
  templateUrl: './detalle-consumo-interno.component.html',
  styleUrls: ['./detalle-consumo-interno.component.scss'],
})
export class DetalleConsumoInternoComponent {
  @Input() visible = false;
  @Input() consumo: ConsumoInternoModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() anular = new EventEmitter<ConsumoInternoTableModel>();

  close(): void {
    this.visibleChange.emit(false);
  }

  onAnular(): void {
    if (this.consumo) this.anular.emit(this.consumo as any);
  }

  getSeverity(estado: string): 'success' | 'danger' {
    return estado === 'APROBADO' ? 'success' : 'danger';
  }

  subtotalCosto(d: { cantidad: number; costoUnitario: number }): number {
    return (d.cantidad ?? 0) * (d.costoUnitario ?? 0);
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
