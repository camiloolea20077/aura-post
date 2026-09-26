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
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import {
  CuentaBancariaModel,
  TipoCuenta,
  TIPOS_CUENTA,
} from '../../../core/models/cuenta-bancaria.model';

/**
 * Listado de cuentas bancarias. El formulario es una página plana
 * (form/form-cuenta-bancaria). El saldo actual no se muestra aquí: lo mueve
 * cada documento y su cifra de control es la conciliación con el mayor.
 */
@Component({
  selector: 'app-index-cuentas-bancarias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    ToastModule,
    TooltipModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './index-cuentas-bancarias.component.html',
  styleUrls: ['./index-cuentas-bancarias.component.scss'],
})
export class IndexCuentasBancariasComponent implements OnInit {
  cuentas: CuentaBancariaModel[] = [];
  loading = false;
  searchQuery = '';

  readonly tiposMeta = TIPOS_CUENTA;

  constructor(
    private readonly service: CuentaBancariaService,
    private readonly alertService: AlertService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.list());
      this.cuentas = res?.data ?? [];
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudieron cargar las cuentas bancarias',
      );
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  clearSearch(dt: { filterGlobal: (v: string, m: string) => void }): void {
    this.searchQuery = '';
    dt.filterGlobal('', 'contains');
  }

  abrirNueva(): void {
    this.router.navigate(['/tesoreria/cuentas-bancarias/nueva']);
  }

  abrirEditar(c: CuentaBancariaModel): void {
    this.router.navigate(['/tesoreria/cuentas-bancarias', c.id]);
  }

  async toggleActiva(c: CuentaBancariaModel): Promise<void> {
    try {
      await lastValueFrom(this.service.toggle(c.id));
      c.activa = !c.activa;
      this.alertService.showSuccess(
        c.activa ? 'Cuenta activada' : 'Cuenta desactivada',
        '',
      );
      this.cdr.markForCheck();
    } catch {
      this.alertService.showError('Error', 'No se pudo cambiar el estado');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getTipoMeta(tipo: TipoCuenta) {
    return this.tiposMeta.find((t) => t.value === tipo) ?? this.tiposMeta[4];
  }

  maskCuenta(num: string | null): string {
    if (!num) return '—';
    if (num.length <= 4) return num;
    return '**** ' + num.slice(-4);
  }
}
