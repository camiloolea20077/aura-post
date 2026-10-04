import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import { CondicionPago } from '../../../core/models/factura-venta.model';
import { FacturaVentaService } from '../../../core/services/factura-venta.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../shared/directives/puede.directive';

/** Fila editable: la condición y si tiene cambios sin guardar. */
interface Fila extends CondicionPago {
  editando: boolean;
}

/**
 * Condiciones de pago de Facturación (Contado, 30, 60, 90 días…). Los días
 * definen el vencimiento de la factura; una condición en 0 días es de contado.
 * No se borran: se desactivan, porque hay facturas que las usan.
 */
@Component({
  selector: 'app-condiciones-pago',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, InputNumberModule, InputTextModule, TagModule, PuedeDirective],
  templateUrl: './condiciones-pago.component.html',
  styleUrls: ['./condiciones-pago.component.scss'],
})
export class CondicionesPagoComponent implements OnInit {
  filas: Fila[] = [];
  cargando = true;
  guardando = false;
  readonly estados = [
    { label: 'Activa', value: true },
    { label: 'Inactiva', value: false },
  ];

  constructor(
    private readonly service: FacturaVentaService,
    private readonly alert: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.condiciones(false));
      this.filas = (res?.data ?? []).map((c) => ({ ...c, editando: false }));
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las condiciones de pago');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  nueva(): void {
    if (this.filas.some((f) => !f.id)) return;
    this.filas = [{ id: 0, nombre: '', dias: 30, activa: true, editando: true }, ...this.filas];
  }

  editar(f: Fila): void {
    f.editando = true;
  }

  async cancelar(f: Fila): Promise<void> {
    if (!f.id) {
      this.filas = this.filas.filter((x) => x !== f);
      return;
    }
    await this.cargar();
  }

  async guardar(f: Fila): Promise<void> {
    if (!f.nombre?.trim()) {
      this.alert.showWarn('Falta el nombre', 'Escriba el nombre de la condición (p. ej. "Crédito 45 días").');
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(
        this.service.guardarCondicion({
          id: f.id || undefined,
          nombre: f.nombre.trim(),
          dias: f.dias ?? 0,
          activa: f.activa,
        }),
      );
      this.alert.showSuccess('Guardada', f.nombre.trim());
      await this.cargar();
    } catch (e: any) {
      this.alert.showError('No se pudo guardar', e?.error?.message ?? 'Intente de nuevo');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/ventas/facturas']);
  }
}
