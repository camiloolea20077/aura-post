import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { lastValueFrom } from 'rxjs';

import {
  ConciliacionCabecera,
  FormatoFiscal,
  NOMBRE_FORMATO,
} from '../../../../core/models/conciliacion-fiscal.model';
import { ConciliacionFiscalService } from '../../../../core/services/conciliacion-fiscal.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../../shared/directives/puede.directive';

/** Conciliaciones fiscales de la empresa, una por año y formato. */
@Component({
  selector: 'app-index-conciliacion-fiscal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, InputNumberModule, TagModule, PuedeDirective],
  templateUrl: './index-conciliacion-fiscal.component.html',
  styleUrls: ['./index-conciliacion-fiscal.component.scss'],
})
export class IndexConciliacionFiscalComponent implements OnInit {
  private readonly service = inject(ConciliacionFiscalService);
  private readonly alert = inject(AlertService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly nombreFormato = NOMBRE_FORMATO;

  items: ConciliacionCabecera[] = [];
  cargando = true;

  // Nueva (en línea, sin diálogo)
  creando = false;
  guardando = false;
  readonly anios = Array.from({ length: 6 }, (_, i) => {
    const a = new Date().getFullYear() - 1 - i;
    return { label: String(a), value: a };
  });
  anio = new Date().getFullYear() - 1;
  formato: FormatoFiscal = '2516';
  readonly formatos = [
    { label: '2516 · personas jurídicas', value: '2516' },
    { label: '2517 · personas naturales obligadas a llevar contabilidad', value: '2517' },
  ];
  tarifaRenta = 35;

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  private async cargar(): Promise<void> {
    this.cargando = true;
    try {
      const res = await lastValueFrom(this.service.listar());
      this.items = res?.data ?? [];
    } catch {
      this.alert.showError('Error', 'No se pudieron cargar las conciliaciones.');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  async crear(): Promise<void> {
    this.guardando = true;
    try {
      const res = await lastValueFrom(
        this.service.crear({ anio: this.anio, formato: this.formato, tarifaRenta: this.tarifaRenta }),
      );
      if (res?.data?.id) this.abrir(res.data);
    } catch (err: any) {
      this.alert.showError('No se pudo crear', err?.error?.message ?? err?.message ?? 'Intente de nuevo.');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  abrir(c: ConciliacionCabecera): void {
    this.router.navigate(['/contabilidad/conciliacion-fiscal', c.id]);
  }
}
