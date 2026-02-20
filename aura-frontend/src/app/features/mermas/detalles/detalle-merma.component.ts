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
import { MermaModel, MermaTableModel } from '../../../core/models/merma.model';

@Component({
  selector: 'app-detalle-merma',
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
  templateUrl: './detalle-merma.component.html',
  styleUrls: ['./detalle-merma.component.scss'],
})
export class DetalleMermaComponent {
  @Input() visible = false;
  @Input() merma: MermaModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() anular = new EventEmitter<MermaTableModel>();

  close(): void {
    this.visibleChange.emit(false);
  }

  onAnular(): void {
    if (this.merma) this.anular.emit(this.merma as any);
  }

  getSeverity(estado: string): 'success' | 'danger' {
    return estado === 'APROBADA' ? 'success' : 'danger';
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
}
