import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';

import { ActivoFijoService } from '../../../../core/services/activo-fijo.service';
import { PeriodoContableService } from '../../../../core/services/periodo-contable.service';
import { AlertService } from '../../../../shared/pipes/alert.service';
import {
  CATEGORIA_ACTIVO_OPTIONS,
  ReporteActivosModel,
} from '../../../../core/models/activo-fijo.model';

/** Informe de activos: costo, depreciación y valor en libros, agrupados. */
@Component({
  selector: 'app-informe-activos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, DropdownModule, TagModule],
  templateUrl: './informe-activos.component.html',
  styleUrls: ['./informe-activos.component.scss'],
})
export class InformeActivosComponent implements OnInit {
  loading = false;
  data: ReporteActivosModel | null = null;

  estado = 'VIGENTES';
  categoria: string | null = null;
  periodoId: number | null = null;
  agrupar = 'CATEGORIA';

  readonly estados = [
    { label: 'Vigentes', value: 'VIGENTES' },
    { label: 'Activos', value: 'ACTIVO' },
    { label: 'Totalmente depreciados', value: 'DEPRECIADO' },
    { label: 'Vendidos', value: 'VENDIDO' },
    { label: 'Dados de baja', value: 'DADO_DE_BAJA' },
  ];
  readonly categorias = CATEGORIA_ACTIVO_OPTIONS;
  readonly agrupaciones = [
    { label: 'Por categoría', value: 'CATEGORIA' },
    { label: 'Por centro de costo', value: 'CENTRO_COSTO' },
    { label: 'Por responsable', value: 'RESPONSABLE' },
  ];
  periodos: { label: string; value: number }[] = [];

  constructor(
    private readonly router: Router,
    private readonly service: ActivoFijoService,
    private readonly periodoService: PeriodoContableService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarPeriodos();
    this.cargar();
  }

  volver(): void {
    this.router.navigate(['/contabilidad/activos-fijos']);
  }

  private async cargarPeriodos(): Promise<void> {
    try {
      const res = await lastValueFrom(this.periodoService.listar());
      this.periodos = (res?.data ?? []).map((p: any) => ({
        label: `${p.anio}/${String(p.mes).padStart(2, '0')}`,
        value: p.id,
      }));
      this.cdr.markForCheck();
    } catch {
      /* el informe funciona sin la depreciación del mes */
    }
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(
        this.service.reporte({
          estado: this.estado,
          categoria: this.categoria,
          periodoId: this.periodoId,
          agrupar: this.agrupar,
        }),
      );
      this.data = res?.data ?? null;
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo generar el informe');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  exportarCsv(): void {
    if (!this.data) return;
    const cab = ['Código', 'Descripción', 'Categoría', 'Placa', 'Estado', 'Centro de costo', 'Responsable',
      'Adquisición', 'Vida (meses)', 'Costo', 'Depreciación acumulada', 'Valor en libros', 'Depreciación del mes'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const filas = this.data.filas.map((f) =>
      [f.codigo, f.descripcion, f.categoria, f.placa ?? '', f.estado, f.centroCosto, f.responsable,
        f.fechaAdquisicion, f.vidaUtilMeses, f.costo, f.depreciacionAcumulada, f.valorEnLibros, f.depreciacionMes]
        .map(esc).join(';'),
    );
    const blob = new Blob(['﻿' + [cab.map(esc).join(';'), ...filas].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `activos-fijos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
