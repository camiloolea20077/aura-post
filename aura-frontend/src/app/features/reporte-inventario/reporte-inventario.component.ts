import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ReporteService } from '../../core/services/reporte.service';

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
  stock: number;
  costo: number;
  precio: number;
  iva: number;
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

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loadingStats = true;
    this.loadingTabla = true;

    // TODO: reemplazar con llamada real a ProductoService
    setTimeout(() => {
      const mock: ProductoRow[] = [
        {
          sku: '7706157618381',
          nombre: 'Acople Lavamano 40cm Grival',
          categoria: 'Grifería',
          stock: 45,
          costo: 3235,
          precio: 4622,
          iva: 19,
          activo: true,
        },
        {
          sku: '7702884010023',
          nombre: 'Tubo PVC 4" x 6m',
          categoria: 'Tuberías',
          stock: 12,
          costo: 8500,
          precio: 12000,
          iva: 19,
          activo: true,
        },
        {
          sku: '7706123456789',
          nombre: 'Válvula de Bola 1/2"',
          categoria: 'Válvulas',
          stock: 0,
          costo: 4200,
          precio: 6300,
          iva: 19,
          activo: true,
        },
        {
          sku: '7706987654321',
          nombre: 'Reductor 4" a 2"',
          categoria: 'Accesorios',
          stock: 28,
          costo: 1800,
          precio: 2700,
          iva: 19,
          activo: true,
        },
        {
          sku: '7701234567890',
          nombre: 'Llave de Paso 3/4"',
          categoria: 'Grifería',
          stock: 7,
          costo: 9800,
          precio: 14500,
          iva: 19,
          activo: false,
        },
        {
          sku: '7708765432109',
          nombre: 'Codo PVC 90° x 4"',
          categoria: 'Tuberías',
          stock: 54,
          costo: 980,
          precio: 1500,
          iva: 19,
          activo: true,
        },
        {
          sku: '7709876543210',
          nombre: 'Pegante para PVC 250ml',
          categoria: 'Accesorios',
          stock: 0,
          costo: 6500,
          precio: 9800,
          iva: 19,
          activo: true,
        },
      ];

      this.productos = mock;
      this.productosFiltrados = mock;

      const activos = mock.filter((p) => p.activo);
      const sinStock = mock.filter((p) => p.activo && p.stock === 0);
      const inactivos = mock.filter((p) => !p.activo);
      const valorTotal = activos.reduce((s, p) => s + p.costo * p.stock, 0);

      this.stats = [
        {
          label: 'Valor en Inventario',
          value: this.cop(valorTotal),
          sub: `${activos.length} productos activos`,
          icon: 'pi-box',
          color: 'blue',
        },
        {
          label: 'Sin Stock',
          value: `${sinStock.length}`,
          sub: 'Necesitan reabastecimiento',
          icon: 'pi-exclamation-triangle',
          color: 'red',
        },
        {
          label: 'Total Productos',
          value: `${mock.length}`,
          sub: `${inactivos.length} inactivos`,
          icon: 'pi-tags',
          color: 'purple',
        },
        {
          label: 'Categorías',
          value: `${new Set(mock.map((p) => p.categoria)).size}`,
          sub: 'Familias de productos',
          icon: 'pi-th-large',
          color: 'green',
        },
      ];

      // Distribución por categoría
      const catMap: Record<string, number> = {};
      mock.forEach((p) => {
        catMap[p.categoria] = (catMap[p.categoria] ?? 0) + 1;
      });
      const colors = ['#7c3aed', '#2563eb', '#16a34a', '#d97706', '#dc2626'];
      this.categorias = Object.entries(catMap).map(([nombre, cantidad], i) => ({
        nombre,
        cantidad,
        pct: Math.round((cantidad / mock.length) * 100),
        color: colors[i % colors.length],
      }));

      this.loadingStats = false;
      this.loadingTabla = false;
    }, 800);
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
    if (p.stock === 0) return 'danger';
    if (p.stock < 10) return 'warn';
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
