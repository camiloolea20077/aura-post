import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { InventarioService } from '../../../core/services/inventario.service';
import { SucursalService } from '../../../core/services/sucursal.service';
import { BodegaService } from '../../../core/services/bodega.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { SugeridoCompraModel } from '../../../core/models/inventario.model';

interface GrupoProveedor {
  proveedor: string;
  filas: SugeridoCompraModel[];
  total: number;
}

/**
 * Sugerido de compra: productos en o bajo su punto de reorden (o su mínimo),
 * con lo que falta para llegar al máximo, agrupados por el último proveedor
 * que los vendió. El punto de reorden y el máximo se definen por bodega en
 * Inventario › Stock.
 */
@Component({
  selector: 'app-sugerido-compra',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, DropdownModule, TagModule, TooltipModule],
  templateUrl: './sugerido-compra.component.html',
  styleUrls: ['./sugerido-compra.component.scss'],
})
export class SugeridoCompraComponent implements OnInit {
  loading = false;
  filas: SugeridoCompraModel[] = [];
  grupos: GrupoProveedor[] = [];
  totalGeneral = 0;
  sinMaximo = 0;

  sucursalId: number | null = null;
  bodegaId: number | null = null;
  sucursales: { label: string; value: number }[] = [];
  bodegas: { label: string; value: number }[] = [];

  constructor(
    private readonly inventario: InventarioService,
    private readonly sucursalService: SucursalService,
    private readonly bodegaService: BodegaService,
    private readonly alert: AlertService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarSucursales();
    this.cargar();
  }

  private async cargarSucursales(): Promise<void> {
    try {
      const res = await lastValueFrom(this.sucursalService.getActivas());
      this.sucursales = (res?.data ?? []).map((s) => ({ label: s.nombre, value: s.id }));
      this.cdr.markForCheck();
    } catch {
      /* sin sucursales: se consulta toda la empresa */
    }
  }

  async onSucursalChange(): Promise<void> {
    this.bodegaId = null;
    this.bodegas = [];
    if (this.sucursalId != null) {
      try {
        const res = await lastValueFrom(this.bodegaService.list({ sucursalId: this.sucursalId }));
        this.bodegas = (res?.data ?? []).map((b) => ({ label: b.nombre, value: b.id }));
      } catch {
        /* la sede sin bodegas se consulta completa */
      }
    }
    this.cargar();
  }

  async cargar(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.inventario.sugeridoCompra(this.sucursalId, this.bodegaId));
      this.filas = res?.data ?? [];
      this.agrupar();
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo calcular el sugerido de compra');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private agrupar(): void {
    const mapa = new Map<string, GrupoProveedor>();
    for (const f of this.filas) {
      const clave = f.ultimoProveedorNombre ?? 'Sin compras registradas';
      const g = mapa.get(clave) ?? { proveedor: clave, filas: [], total: 0 };
      g.filas.push(f);
      g.total += Number(f.valorEstimado ?? 0);
      mapa.set(clave, g);
    }
    this.grupos = [...mapa.values()];
    this.totalGeneral = this.grupos.reduce((a, g) => a + g.total, 0);
    this.sinMaximo = this.filas.filter((f) => f.sinMaximo).length;
  }

  /** CSV para mandarle el pedido al proveedor o abrirlo en Excel. */
  exportarCsv(): void {
    const cab = ['Proveedor', 'Producto', 'SKU', 'Sede', 'Bodega', 'Stock', 'Punto reorden', 'Máximo', 'Pedir', 'Unidad', 'Costo', 'Valor'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lineas = this.filas.map((f) =>
      [
        f.ultimoProveedorNombre ?? '',
        f.productoNombre,
        f.productoSku ?? '',
        f.sucursalNombre,
        f.bodegaNombre ?? '',
        f.stockActual,
        f.puntoReorden ?? f.stockMinimo,
        f.stockMaximo ?? '',
        f.cantidadSugerida,
        f.unidadAbreviatura ?? '',
        f.costo ?? 0,
        f.valorEstimado,
      ]
        .map(esc)
        .join(';'),
    );
    const blob = new Blob(['﻿' + [cab.map(esc).join(';'), ...lineas].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sugerido-compra-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
