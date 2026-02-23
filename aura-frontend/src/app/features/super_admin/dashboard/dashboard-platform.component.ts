// ─── dashboard-platform.component.ts ─────────────────────────
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { lastValueFrom } from 'rxjs';
import { PlatformService } from '../../../core/services/platform.service';
import { DashboardPlataformaModel } from '../../../core/models/platform.model';

@Component({
  selector: 'app-dashboard-platform',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    SkeletonModule,
    TagModule,
    ButtonModule,
  ],
  templateUrl: './dashboard-platform.component.html',
  styleUrls: ['./dashboard-platform.component.scss'],
})
export class DashboardPlatformComponent implements OnInit {
  loading = true;
  data: DashboardPlataformaModel | null = null;

  constructor(
    private readonly platformService: PlatformService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const res = await lastValueFrom(this.platformService.dashboard());
      this.data = res?.data ?? null;
    } catch {
      this.data = null;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
