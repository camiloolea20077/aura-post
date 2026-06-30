import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ObligacionService } from '../../../core/services/obligacion.service';
import {
  CuotaAmortizacionModel,
  ObligacionModel,
} from '../../../core/models/obligacion.model';
import { AlertService } from '../../../shared/pipes/alert.service';

@Component({
  selector: 'app-detalle-obligacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TagModule,
    SkeletonModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './detalle-obligacion.component.html',
  styles: [
    `
      .detalle-body {
        padding: 1.25rem 1.5rem;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .metric {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.9rem 1rem;
      }
      .metric .k {
        font-size: 0.72rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .metric .v {
        font-size: 1.05rem;
        font-weight: 700;
        color: #1e293b;
      }
      .paid {
        color: #94a3b8;
        text-decoration: line-through;
      }
    `,
  ],
})
export class DetalleObligacionComponent implements OnInit {
  obligacion: ObligacionModel | null = null;
  loading = false;
  paying: number | null = null;

  constructor(
    private readonly service: ObligacionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = +this.route.snapshot.params['id'];
    await this.cargar(id);
  }

  private async cargar(id: number): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.getById(id));
      this.obligacion = res?.data ?? null;
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la obligación.');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  pagar(cuota: CuotaAmortizacionModel): void {
    if (!this.obligacion) return;
    const obligacionId = this.obligacion.id;
    this.confirm.confirm({
      header: 'Pagar cuota',
      message: `¿Confirmas el pago de la cuota #${cuota.numeroCuota}?`,
      acceptLabel: 'Pagar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.paying = cuota.id;
        this.cdr.markForCheck();
        try {
          await lastValueFrom(this.service.pagarCuota(obligacionId, cuota.id));
          this.alert.showSuccess(
            'Listo',
            `Cuota #${cuota.numeroCuota} pagada.`,
          );
          await this.cargar(obligacionId);
        } catch {
          this.alert.showError('Error', 'No se pudo pagar la cuota.');
        } finally {
          this.paying = null;
          this.cdr.markForCheck();
        }
      },
    });
  }

  volver(): void {
    this.router.navigate(['/obligaciones']);
  }
}
