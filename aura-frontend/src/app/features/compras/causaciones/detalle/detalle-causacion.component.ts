import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import { CausacionDetalle, etiquetaSoporte } from '../../../../core/models/causacion-gasto.model';
import { CausacionGastoService } from '../../../../core/services/causacion-gasto.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';

/** Ficha de una causación: cabecera, conceptos, totales y anulación. */
@Component({
  selector: 'app-detalle-causacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TagModule, PuedeDirective],
  templateUrl: './detalle-causacion.component.html',
  styleUrls: ['./detalle-causacion.component.scss'],
})
export class DetalleCausacionComponent implements OnInit {
  private readonly service = inject(CausacionGastoService);
  private readonly alert = inject(AlertService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly etiquetaSoporte = etiquetaSoporte;

  c: CausacionDetalle | null = null;
  cargando = true;

  // Anulación en línea (sin diálogo): se pide el motivo y se confirma.
  pidiendoMotivo = false;
  motivo = '';
  anulando = false;

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    try {
      const res = await lastValueFrom(this.service.getById(id));
      this.c = res?.data ?? null;
    } catch {
      this.alert.showError('Error', 'No se encontró la causación.');
      this.volver();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  get retenciones(): number {
    const c = this.c;
    return c ? Number(c.retefuente) + Number(c.reteiva) + Number(c.reteica) : 0;
  }

  get tienePagos(): boolean {
    const c = this.c;
    return !!c && c.saldoPendiente != null && Number(c.saldoPendiente) < Number(c.totalPagar);
  }

  async anular(): Promise<void> {
    if (!this.c) return;
    if (!this.motivo.trim()) {
      this.alert.showWarn('Falta el motivo', 'Escriba por qué se anula la causación.');
      return;
    }
    this.anulando = true;
    try {
      const res = await lastValueFrom(this.service.anular(this.c.id, this.motivo.trim()));
      this.c = res?.data ?? this.c;
      this.pidiendoMotivo = false;
      this.alert.showSuccess('Causación anulada', 'Se reversó el asiento y se anuló la cuenta por pagar.');
    } catch (err: any) {
      this.alert.showError('No se pudo anular', err?.error?.message ?? err?.message ?? 'Intente de nuevo.');
    } finally {
      this.anulando = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/compras/causaciones']);
  }
}
