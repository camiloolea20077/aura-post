import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { ObligacionService } from '../../../core/services/obligacion.service';
import { ObligacionModel } from '../../../core/models/obligacion.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-index-obligaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './index-obligaciones.component.html',
  styles: [
    `
      .clickable {
        cursor: pointer;
      }
    `,
  ],
})
export class IndexObligacionesComponent implements OnInit {
  items: ObligacionModel[] = [];
  loading = false;
  searchQuery = '';

  constructor(
    private readonly service: ObligacionService,
    private readonly router: Router,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.listar());
      this.items = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las obligaciones.');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  clearSearch(dt: { filterGlobal: (v: string, m: string) => void }): void {
    this.searchQuery = '';
    dt.filterGlobal('', 'contains');
  }

  nuevo(): void {
    this.router.navigate(['/obligaciones/nuevo']);
  }

  abrir(o: ObligacionModel): void {
    this.router.navigate(['/obligaciones', o.id]);
  }

  estadoSeverity(estado: string): 'success' | 'danger' | 'info' {
    if (estado === 'PAGADA') return 'success';
    if (estado === 'ANULADA') return 'danger';
    return 'info';
  }
}
