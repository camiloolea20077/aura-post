import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { lastValueFrom } from 'rxjs';

import { ComisionService } from '../../../../core/services/comision.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  ComisionLiquidacionModel,
  EstadoLiquidacion,
} from '../../../../core/models/comision.model';

@Component({
  selector: 'app-detalle-liquidacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    SidebarModule,
    TagModule,
    TableModule,
    SkeletonModule,
  ],
  templateUrl: './detalle-liquidacion.component.html',
  styleUrls: ['./detalle-liquidacion.component.scss'],
})
export class DetalleLiquidacionComponent implements OnChanges {
  @Input() visible = false;
  @Input() liquidacionId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();

  data: ComisionLiquidacionModel | null = null;
  loading = false;

  constructor(
    private readonly comisionService: ComisionService,
    private readonly alertService: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnChanges(): Promise<void> {
    if (!this.visible || !this.liquidacionId) return;
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading = true;
    this.data = null;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.comisionService.getLiquidacionById(this.liquidacionId!),
      );
      this.data = res?.data ?? null;
    } catch {
      this.alertService.showError('Error', 'No se pudo cargar el detalle');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  getEstadoSeverity(estado: EstadoLiquidacion): 'success' | 'warn' {
    return estado === 'PAGADA' ? 'success' : 'warn';
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);
  }
}
