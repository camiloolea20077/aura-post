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
  TrasladoModel,
  TrasladoTableModel,
} from '../../../core/models/traslado.model';

type TagSeverity =
  | 'success'
  | 'secondary'
  | 'info'
  | 'warn'
  | 'danger'
  | 'contrast'
  | undefined;

@Component({
  selector: 'app-detalle-traslado',
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
  templateUrl: './detalle-traslado.component.html',
  styleUrls: ['./detalle-traslado.component.scss'],
})
export class DetalleTrasladoComponent {
  @Input() visible = false;
  @Input() traslado: TrasladoModel | null = null;
  @Input() loading = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() anular = new EventEmitter<TrasladoTableModel>();

  close(): void {
    this.visibleChange.emit(false);
  }

  onAnular(): void {
    if (this.traslado) this.anular.emit(this.traslado as any);
  }

  getSeverity(estado: string): TagSeverity {
    const map: Record<string, Exclude<TagSeverity, undefined>> = {
      COMPLETADO: 'success',
      PENDIENTE: 'warn',
      ANULADO: 'danger',
    };

    return map[estado] ?? 'secondary';
  }
}
