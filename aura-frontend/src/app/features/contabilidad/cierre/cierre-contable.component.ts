import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { CierreContableService } from '../../../core/services/cierre-contable.service';
import { CierreContableDto } from '../../../core/models/cierre-contable.model';

@Component({
  selector: 'app-cierre-contable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    SkeletonModule,
    TagModule,
    ToastModule,
    DividerModule,
  ],
  providers: [MessageService],
  templateUrl: './cierre-contable.component.html',
  styleUrls: ['./cierre-contable.component.scss'],
})
export class CierreContableComponent implements OnInit {
  data: CierreContableDto | null = null;
  loading = false;

  fechaDesde: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  fechaHasta: Date = new Date();

  constructor(
    private readonly service: CierreContableService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.obtener(this.fmt(this.fechaDesde), this.fmt(this.fechaHasta)),
      );
      this.data = res?.data ?? null;
    } catch {
      this.data = null;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private fmt(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  formatCOP(v: number | null | undefined): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  pct(v: number | null | undefined): string {
    if (v == null) return '—';
    return v.toFixed(1) + '%';
  }

  utilClass(v: number | null | undefined): string {
    if (v == null || v === 0) return 'neutral';
    return v > 0 ? 'positivo' : 'negativo';
  }

  posNeta(v: number | null | undefined): 'success' | 'warn' | 'danger' {
    if (v == null || v === 0) return 'warn';
    return v > 0 ? 'success' : 'danger';
  }
}
