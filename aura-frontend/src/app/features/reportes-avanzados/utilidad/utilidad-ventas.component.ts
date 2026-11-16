import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import { ReporteAvanzadoService } from '../../../core/services/reporte-avanzado.service';
import {
  AgrupacionUtilidad,
  FormaUtilidad,
  ReporteUtilidadCreditoModel,
  ReporteUtilidadFilaModel,
  ReporteUtilidadFiltro,
  ReporteUtilidadModel,
} from '../../../core/models/reporte-avanzado.model';
import { HistorialCostoProductoComponent } from '../../../shared/components/historial-costo-producto/historial-costo-producto.component';

/**
 * Pestaña "Utilidad" de Reportes avanzados.
 *
 * Utilidad = venta sin IVA − costo promedio que tenía el producto al venderse.
 * Cuenta contado y crédito: la utilidad nace al vender, no al cobrar. El período
 * lo pone la página (botón Aplicar); aquí solo se agrupa y se filtra por forma de pago.
 */
@Component({
  selector: 'app-utilidad-ventas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    TableModule,
    TooltipModule,
    HistorialCostoProductoComponent,
  ],
  templateUrl: './utilidad-ventas.component.html',
  styleUrls: ['./utilidad-ventas.component.scss'],
})
export class UtilidadVentasComponent {
  public readonly agrupaciones: { label: string; value: AgrupacionUtilidad }[] = [
    { label: 'Producto', value: 'PRODUCTO' },
    { label: 'Categoría', value: 'CATEGORIA' },
    { label: 'Vendedor', value: 'VENDEDOR' },
    { label: 'Cliente', value: 'CLIENTE' },
    { label: 'Mes', value: 'MES' },
  ];
  public readonly formas: { label: string; value: FormaUtilidad }[] = [
    { label: 'Contado y crédito', value: 'TODAS' },
    { label: 'Solo contado', value: 'CONTADO' },
    { label: 'Solo crédito', value: 'CREDITO' },
  ];

  public agrupar: AgrupacionUtilidad = 'PRODUCTO';
  public forma: FormaUtilidad = 'TODAS';

  public cargando = false;
  public exportando = false;
  public datos: ReporteUtilidadModel | null = null;

  /** Desglose de "Utilidad de ventas a crédito": se pide al desplegarlo. */
  public creditoAbierto = false;
  public cargandoCredito = false;
  public ventasCredito: ReporteUtilidadCreditoModel[] | null = null;

  public historialVisible = false;
  public historialProductoId: number | null = null;

  private desde = '';
  private hasta = '';

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly service: ReporteAvanzadoService,
    private readonly msg: MessageService,
  ) {}

  /** La llama la página al aplicar el período. */
  async cargar(desde: string, hasta: string): Promise<void> {
    this.desde = desde;
    this.hasta = hasta;
    this.ventasCredito = null;
    await Promise.all([this.consultar(), this.creditoAbierto ? this.cargarCredito() : Promise.resolve()]);
  }

  /** Despliega u oculta las ventas a crédito; la primera vez las pide. */
  async alternarCredito(): Promise<void> {
    this.creditoAbierto = !this.creditoAbierto;
    this.cdr.markForCheck();
    if (this.creditoAbierto && this.ventasCredito === null) await this.cargarCredito();
  }

  /** Etiqueta del estado de la cuenta por cobrar. */
  estadoCartera(v: ReporteUtilidadCreditoModel): string {
    // Sin cuenta por cobrar no hay de dónde saber si se pagó (borrada o nunca creada).
    if (!v.numeroCuenta) return 'Sin cuenta';
    if (Number(v.porCobrar) <= 0) return 'Pagada';
    const e = (v.estadoCartera || '').toLowerCase();
    if (e === 'castigada') return 'Castigada';
    return Number(v.abonado) > 0 ? 'Con abono' : 'Pendiente';
  }

  /** Modificador de color del estado: pagada, abono, pendiente o castigada. */
  claseEstado(v: ReporteUtilidadCreditoModel): string {
    const e = this.estadoCartera(v);
    return e === 'Pagada' ? 'pagada' : e === 'Castigada' ? 'castigada' : e === 'Con abono' ? 'abono'
      : e === 'Sin cuenta' ? 'sin-cuenta' : 'pendiente';
  }

  private async cargarCredito(): Promise<void> {
    this.cargandoCredito = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.utilidadCredito(this.filtro()));
      this.ventasCredito = res?.data ?? [];
    } catch {
      this.ventasCredito = [];
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las ventas a crédito.' });
    } finally {
      this.cargandoCredito = false;
      this.cdr.markForCheck();
    }
  }

  /** Cambio de agrupación o de forma de pago: mismo período. */
  onFiltroChange(): void {
    this.consultar();
  }

  async exportarExcel(): Promise<void> {
    this.exportando = true;
    this.cdr.markForCheck();
    try {
      const blob = await lastValueFrom(this.service.utilidadExcel(this.filtro()));
      this.descargar(blob, `utilidad_${this.agrupar.toLowerCase()}_${this.desde}_${this.hasta}.xlsx`);
    } catch {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el Excel.' });
    } finally {
      this.exportando = false;
      this.cdr.markForCheck();
    }
  }

  /** Solo agrupando por producto: abre el historial de costos de esa fila. */
  verHistorial(fila: ReporteUtilidadFilaModel): void {
    if (this.agrupar !== 'PRODUCTO') return;
    this.historialProductoId = Number(fila.clave);
    this.historialVisible = true;
  }

  get filas(): ReporteUtilidadFilaModel[] {
    return this.datos?.filas ?? [];
  }

  get tituloGrupo(): string {
    return this.agrupaciones.find((a) => a.value === this.agrupar)?.label ?? 'Grupo';
  }

  get esProducto(): boolean {
    return this.agrupar === 'PRODUCTO';
  }

  /** Tono del margen: pérdida, bajo (< 10 %) o sano. */
  claseMargen(pct: number): string {
    if (pct < 0) return 'is-perdida';
    if (pct < 10) return 'is-bajo';
    return 'is-sano';
  }

  /** Ancho de la regla de margen: escala de 0 a 50 % de margen. */
  barraMargen(pct: number): number {
    return Math.max(0, Math.min(100, (pct ?? 0) * 2));
  }

  cop = (v: number | null | undefined): string =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v ?? 0);

  private async consultar(): Promise<void> {
    if (!this.desde || !this.hasta) return;
    this.cargando = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.service.utilidad(this.filtro()));
      this.datos = res?.data ?? null;
    } catch {
      this.datos = null;
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la utilidad.' });
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private filtro(): ReporteUtilidadFiltro {
    return { desde: this.desde, hasta: this.hasta, agrupar: this.agrupar, forma: this.forma };
  }

  private descargar(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}
