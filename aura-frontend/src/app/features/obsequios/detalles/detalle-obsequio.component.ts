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
  MOTIVOS_OBSEQUIO,
  ObsequioModel,
  ObsequioTableModel,
} from '../../../core/models/obsequio.model';

@Component({
  selector: 'app-detalle-obsequio',
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
  templateUrl: './detalle-obsequio.component.html',
  styleUrls: ['./detalle-obsequio.component.scss'],
})
export class DetalleObsequioComponent {
  @Input() visible = false;
  @Input() obsequio: ObsequioModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() anular = new EventEmitter<ObsequioTableModel>();

  close(): void {
    this.visibleChange.emit(false);
  }

  onAnular(): void {
    if (this.obsequio) this.anular.emit(this.obsequio as any);
  }

  getSeverity(estado: string): 'success' | 'danger' {
    return estado === 'APROBADO' ? 'success' : 'danger';
  }

  motivoLabel(motivo: string): string {
    return MOTIVOS_OBSEQUIO.find((m) => m.value === motivo)?.label ?? motivo;
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
