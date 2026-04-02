import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import {
  CreateDevolucionDetalleDto,
  CreateDevolucionDto,
} from '../../../core/models/devolucion.model';
import { VentaModel } from '../../../core/models/venta.model';
import { DevolucionService } from '../../../core/services/devolucion.service';
import { VentaService } from '../../../core/services/venta.service';
import { AlertService } from '../../../shared/pipes/alert.service';

interface DetalleRow {
  productoId: number;
  productoNombre: string;
  cantidadOriginal: number;
  precioUnitario: number;
  loteId?: number;
  seleccionado: boolean;
  cantidad: number;
}

@Component({
  selector: 'app-create-devolucion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ToastModule,
    DividerModule,
    TableModule,
    TextareaModule,
  ],
  providers: [MessageService],
  templateUrl: './create-devolucion.component.html',
  styleUrls: ['./create-devolucion.component.scss'],
})
export class CreateDevolucionComponent implements OnChanges {
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  // Búsqueda de venta
  public ventaSearch = '';
  public isSearchingVenta = false;
  public ventaCargada: VentaModel | null = null;
  public errorVenta = '';

  // Formulario
  public tipo: 'TOTAL' | 'PARCIAL' = 'PARCIAL';
  public motivo = '';
  public reintegraInventario = true;
  public observaciones = '';
  public metodoDevolucion = 'SIN_DEVOLUCION';
  public detalles: DetalleRow[] = [];

  public isSaving = false;

  readonly tipoOpciones = [
    { label: 'Parcial', value: 'PARCIAL' },
    { label: 'Total', value: 'TOTAL' },
  ];

  readonly metodoDevolucionOpciones = [
    { label: 'Sin devolución de dinero', value: 'SIN_DEVOLUCION' },
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Nota crédito', value: 'NOTA_CREDITO' },
  ];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly devolucionService: DevolucionService,
    private readonly ventaService: VentaService,
    private readonly alertService: AlertService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !this.visible) {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.ventaSearch = '';
    this.ventaCargada = null;
    this.errorVenta = '';
    this.tipo = 'PARCIAL';
    this.motivo = '';
    this.reintegraInventario = true;
    this.observaciones = '';
    this.metodoDevolucion = 'SIN_DEVOLUCION';
    this.detalles = [];
    this.isSaving = false;
  }

  async buscarVenta(): Promise<void> {
    const id = parseInt(this.ventaSearch.trim(), 10);
    if (!id || isNaN(id)) {
      this.errorVenta = 'Ingresa un N° de venta válido (solo números).';
      this.cdr.markForCheck();
      return;
    }
    this.isSearchingVenta = true;
    this.errorVenta = '';
    this.ventaCargada = null;
    this.cdr.markForCheck();

    try {
      const res = await lastValueFrom(this.ventaService.getById(id));
      const venta = res?.data ?? null;
      if (!venta) {
        this.errorVenta = 'No se encontró la venta.';
      } else if (venta.estadoVenta !== 'COMPLETADA') {
        this.errorVenta =
          'Solo se pueden devolver ventas en estado COMPLETADA.';
      } else {
        this.ventaCargada = venta;
        this.buildDetalles(venta);
      }
    } catch {
      this.errorVenta = 'No se encontró la venta o hubo un error al cargarla.';
    } finally {
      this.isSearchingVenta = false;
      this.cdr.markForCheck();
    }
  }

  private buildDetalles(venta: VentaModel): void {
    this.detalles = venta.detalles.map((d) => ({
      productoId: d.productoId,
      productoNombre: d.productoNombre,
      cantidadOriginal: d.cantidad,
      precioUnitario: d.precioUnitario,
      seleccionado: false,
      cantidad: d.cantidad,
    }));
  }

  onTipoChange(): void {
    if (this.tipo === 'TOTAL') {
      this.detalles = this.detalles.map((d) => ({
        ...d,
        seleccionado: true,
        cantidad: d.cantidadOriginal,
      }));
    }
    this.cdr.markForCheck();
  }

  isFormValid(): boolean {
    if (!this.ventaCargada) return false;
    if (!this.motivo.trim()) return false;
    const algunoSeleccionado = this.detalles.some(
      (d) => d.seleccionado && d.cantidad > 0,
    );
    return algunoSeleccionado;
  }

  async guardar(): Promise<void> {
    if (!this.isFormValid() || !this.ventaCargada) return;

    const detallesSeleccionados: CreateDevolucionDetalleDto[] = this.detalles
      .filter((d) => d.seleccionado && d.cantidad > 0)
      .map((d) => ({
        productoId: d.productoId,
        cantidad: d.cantidad,
        loteId: d.loteId,
      }));

    const dto: CreateDevolucionDto = {
      ventaId: this.ventaCargada.id,
      tipo: this.tipo,
      motivo: this.motivo.trim(),
      reintegraInventario: this.reintegraInventario,
      observaciones: this.observaciones.trim() || undefined,
      metodoDevolucion: this.metodoDevolucion,
      detalles: detallesSeleccionados,
    };

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      await lastValueFrom(this.devolucionService.create(dto));
      this.alertService.showSuccess(
        'Devolución creada',
        'La devolución fue registrada exitosamente.',
      );
      this.created.emit();
    } catch (err: any) {
      this.alertService.showError(
        'Error',
        err?.error?.message ?? 'No se pudo crear la devolución.',
      );
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  close(): void {
    this.closed.emit();
  }

  formatCOP = (v: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
}
