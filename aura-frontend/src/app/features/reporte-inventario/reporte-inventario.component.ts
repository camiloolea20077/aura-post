import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ReporteService } from '../../core/services/reporte.service';
import { ProductoService } from '../../core/services/producto.service';

interface StatCard {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: 'green' | 'blue' | 'purple' | 'red';
}

interface ProductoRow {
  sku: string;
  nombre: string;
  categoria: string;
  costo: number;
  precio: number;
  activo: boolean;
}

@Component({
  selector: 'app-reporte-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    TableModule,
    TooltipModule,
    InputTextModule,
  ],
  templateUrl: './reporte-inventario.component.html',
  styleUrls: ['./reporte-inventario.component.scss'],
})
export class ReporteInventarioComponent implements OnInit {
  busqueda = '';
  loadingStats = true;
  loadingTabla = true;
  loadingExcel = false;
  loadingPdf = false;

  stats: StatCard[] = [];
  productos: ProductoRow[] = [];
  productosFiltrados: ProductoRow[] = [];

  // Distribución por categoría (mini donut en CSS)
  categorias: {
    nombre: string;
    cantidad: number;
    pct: number;
    color: string;
  }[] = [];

  constructor(
    private reporteService: ReporteService,
    private productoService: ProductoService,
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loadingStats = true;
    this.loadingTabla = true;

    try {
      const response = await lastValueFrom(
        this.productoService.page({
          page: 0,
          rows: 1000,
        }),
      );
      const productos = response?.data?.content ?? [];

      // Mapear ProductoTableModel a ProductoRow
      const rows: ProductoRow[] = productos.map((p) => ({
        sku: p.sku || '',
        nombre: p.nombre,
        categoria: p.categoriaNombre || 'Sin categoría',
        costo: p.costo,
        precio: p.precio,
        activo: p.activo,
      }));

      this.productos = rows;
      this.productosFiltrados = rows;

      const activos = rows.filter((p) => p.activo);
      const inactivos = rows.filter((p) => !p.activo);

      this.stats = [
        {
          label: 'Total Productos',
          value: `${rows.length}`,
          sub: `${inactivos.length} inactivos`,
          icon: 'pi-tags',
          color: 'purple',
        },
        {
          label: 'Categorías',
          value: `${new Set(rows.map((p) => p.categoria)).size}`,
          sub: 'Familias de productos',
          icon: 'pi-th-large',
          color: 'green',
        },
      ];

      // Distribución por categoría
      const catMap: Record<string, number> = {};
      rows.forEach((p) => {
        catMap[p.categoria] = (catMap[p.categoria] ?? 0) + 1;
      });
      const colors = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626'];
      this.categorias = Object.entries(catMap).map(([nombre, cantidad], i) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / rows.length) * 100),
        color: colors[i % colors.length],
      }));
    } catch (error) {
      console.error('[ReporteInventario] Error cargando productos:', error);
    } finally {
      this.loadingStats = false;
      this.loadingTabla = false;
    }
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    this.productosFiltrados = q
      ? this.productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(q) ||
            p.sku.includes(q) ||
            p.categoria.toLowerCase().includes(q),
        )
      : [...this.productos];
  }

  descargarExcel(): void {
    this.loadingExcel = true;
    this.reporteService.inventarioExcel().subscribe({
      next: (b) => this.reporteService.descargar(b, 'reporte_inventario.xlsx'),
      complete: () => (this.loadingExcel = false),
      error: () => (this.loadingExcel = false),
    });
  }

  descargarPdf(): void {
    this.loadingPdf = true;
    this.reporteService.inventarioPdf().subscribe({
      next: (b) => this.reporteService.descargar(b, 'reporte_inventario.pdf'),
      complete: () => (this.loadingPdf = false),
      error: () => (this.loadingPdf = false),
    });
  }

  severityStock(p: ProductoRow): 'success' | 'warn' | 'danger' {
    if (!p.activo) return 'danger';
    return 'success';
  }

  cop(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }
}
