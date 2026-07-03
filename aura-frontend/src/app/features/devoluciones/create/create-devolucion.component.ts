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
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { lastValueFrom } from 'rxjs';

import {
  CreateDevolucionAgregadoDto,
  CreateDevolucionDetalleDto,
  CreateDevolucionDto,
} from '../../../core/models/devolucion.model';
import { VentaDetalleModel, VentaModel } from '../../../core/models/venta.model';
import {
  ProductoTableModel,
  PageableDto,
} from '../../../core/models/producto.model';
import { DevolucionService } from '../../../core/services/devolucion.service';
import { VentaService } from '../../../core/services/venta.service';
import { ProductoService } from '../../../core/services/producto.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { IndexDBService } from '../../../core/services/index-db.service';
import { AlertService } from '../../../shared/pipes/alert.service';
import { ModalTirillaComponent } from '../../pos/components/modal-tirilla/modal-tirilla.component';

interface DetalleRow {
  productoId: number;
  productoNombre: string;
  cantidadOriginal: number;
  precioUnitario: number; // sin IVA
  ivaUnitario: number; // IVA por unidad
  loteId?: number;
  seleccionado: boolean;
  cantidad: number;
}

interface AgregadoRow {
  productoId: number;
  productoNombre: string;
  precioUnitario: number; // sin IVA
  ivaPorcentaje: number;
  cantidad: number;
}

@Component({
  selector: 'app-create-devolucion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ToastModule,
    DividerModule,
    TableModule,
    DialogModule,
    TooltipModule,
    ConfirmDialogModule,
    TextareaModule,
    ModalTirillaComponent,
  ],
  providers: [MessageService, ConfirmationService],
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
  public fechaDevolucion: string = this.hoyISO();
  public detalles: DetalleRow[] = [];

  // Cambio: productos agregados
  public agregados: AgregadoRow[] = [];

  // Modal buscador de producto (igual al de compras)
  public showProductDialog = false;
  public dialogSearch = '';
  public dialogItems: ProductoTableModel[] = [];
  public dialogTotal = 0;
  public dialogLoading = false;
  private dialogLastEvent!: TableLazyLoadEvent;
  public barcodeQuery = '';
  public barcodeSearching = false;

  public isSaving = false;

  // Tirilla post-devolución
  public showTirilla = false;
  public ventaImpresion: VentaModel | null = null;
  /** Cuando la tirilla se muestra, se vuelve a la tabla solo al cerrarla. */
  private pendienteVolver = false;

  readonly tipoOpciones = [
    { label: 'Parcial', value: 'PARCIAL' },
    { label: 'Total', value: 'TOTAL' },
  ];

  readonly metodoDevolucionOpciones = [
    { label: 'Sin movimiento de dinero', value: 'SIN_DEVOLUCION' },
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Nota crédito', value: 'NOTA_CREDITO' },
  ];

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly devolucionService: DevolucionService,
    private readonly ventaService: VentaService,
    private readonly productoService: ProductoService,
    private readonly empresaService: EmpresaService,
    private readonly indexDBService: IndexDBService,
    private readonly alertService: AlertService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  private hoyISO(): string {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
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
    this.fechaDevolucion = this.hoyISO();
    this.detalles = [];
    this.agregados = [];
    this.showProductDialog = false;
    this.dialogSearch = '';
    this.dialogItems = [];
    this.dialogTotal = 0;
    this.barcodeQuery = '';
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
      } else if (venta.estadoVenta === 'ANULADA') {
        this.errorVenta = 'No se puede devolver una venta anulada.';
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
      ivaUnitario: d.cantidad > 0 ? d.impuestoValor / d.cantidad : 0,
      seleccionado: false,
      cantidad: d.cantidad,
    }));
  }

  /** Precio con IVA incluido por unidad (para mostrar en la tabla). */
  precioConIva(d: DetalleRow): number {
    return d.precioUnitario + d.ivaUnitario;
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

  // ── Cambio: buscador de producto (modal, igual al de compras) ─────
  openProductDialog(): void {
    this.dialogSearch = '';
    this.dialogItems = [];
    this.dialogTotal = 0;
    this.barcodeQuery = '';
    this.showProductDialog = true;
    this.cdr.markForCheck();
  }

  async loadDialogTable(event: TableLazyLoadEvent): Promise<void> {
    this.dialogLastEvent = event;
    this.dialogLoading = true;
    this.cdr.markForCheck();

    const page =
      event.first != null && event.rows
        ? Math.floor(event.first / event.rows)
        : 0;

    const dto: PageableDto = {
      page,
      rows: event.rows ?? 10,
      search: this.dialogSearch || null,
      order_by: 'p.nombre',
      order: 'ASC',
    };

    try {
      const res = await lastValueFrom(this.productoService.page(dto));
      this.dialogItems = res?.data?.content ?? [];
      this.dialogTotal = res?.data?.totalElements ?? 0;
    } catch {
      this.dialogItems = [];
      this.dialogTotal = 0;
    } finally {
      this.dialogLoading = false;
      this.cdr.markForCheck();
    }
  }

  onDialogSearch(): void {
    if (this.dialogLastEvent) {
      this.loadDialogTable({ ...this.dialogLastEvent, first: 0 });
    }
  }

  async buscarPorBarcode(): Promise<void> {
    const q = this.barcodeQuery.trim();
    if (!q) return;
    this.barcodeSearching = true;
    this.cdr.markForCheck();
    try {
      const res = await lastValueFrom(this.productoService.search(q));
      const productos = res?.data ?? [];
      if (productos.length === 0) {
        this.alertService.showWarn(
          'Sin resultados',
          `No se encontró producto con código "${q}".`,
        );
        return;
      }
      this.selectProductFromDialog(productos[0]);
      this.barcodeQuery = '';
    } catch {
      this.alertService.showError('Error', 'No se pudo buscar el producto.');
    } finally {
      this.barcodeSearching = false;
      this.cdr.markForCheck();
    }
  }

  selectProductFromDialog(prod: ProductoTableModel): void {
    if (!prod) return;
    const existente = this.agregados.find((a) => a.productoId === prod.id);
    if (existente) {
      existente.cantidad += 1;
    } else {
      this.agregados = [
        ...this.agregados,
        {
          productoId: prod.id,
          productoNombre: prod.nombre,
          precioUnitario: prod.precio ?? 0,
          ivaPorcentaje: prod.ivaPorcentaje ?? 0,
          cantidad: 1,
        },
      ];
    }
    this.showProductDialog = false;
    this.cdr.markForCheck();
  }

  quitarAgregado(i: number): void {
    this.agregados = this.agregados.filter((_, idx) => idx !== i);
    this.cdr.markForCheck();
  }

  /** IVA por unidad de un producto agregado. */
  ivaAgregadoUnit(a: AgregadoRow): number {
    return a.precioUnitario * (a.ivaPorcentaje / 100);
  }

  precioConIvaAgregado(a: AgregadoRow): number {
    return a.precioUnitario + this.ivaAgregadoUnit(a);
  }

  subtotalAgregado(a: AgregadoRow): number {
    return this.precioConIvaAgregado(a) * a.cantidad;
  }

  // ── Totales / neto ────────────────────────────────────────────
  get totalDevuelto(): number {
    return this.detalles
      .filter((d) => d.seleccionado && d.cantidad > 0)
      .reduce((s, d) => s + this.precioConIva(d) * d.cantidad, 0);
  }

  get totalAgregado(): number {
    return this.agregados.reduce((s, a) => s + this.subtotalAgregado(a), 0);
  }

  /** Positivo = a favor del cliente (reembolso); negativo = faltante que paga el cliente. */
  get neto(): number {
    return this.totalDevuelto - this.totalAgregado;
  }

  get faltante(): number {
    return this.neto < 0 ? -this.neto : 0;
  }

  get aReembolsar(): number {
    return this.neto > 0 ? this.neto : 0;
  }

  isFormValid(): boolean {
    if (!this.ventaCargada) return false;
    if (!this.motivo.trim()) return false;
    const algunoSeleccionado = this.detalles.some(
      (d) => d.seleccionado && d.cantidad > 0,
    );
    return algunoSeleccionado;
  }

  /** Compara la fecha de devolución con la de la venta (solo parte fecha). */
  private esFechaPosterior(): boolean {
    if (!this.ventaCargada?.fechaEmision) return false;
    const ventaFecha = this.ventaCargada.fechaEmision.substring(0, 10);
    return this.fechaDevolucion > ventaFecha;
  }

  guardar(): void {
    if (!this.isFormValid() || !this.ventaCargada) return;

    if (this.esFechaPosterior()) {
      this.confirmationService.confirm({
        header: 'Confirmar afectación de la operación',
        message:
          `La devolución tiene fecha ${this.fechaDevolucion}, posterior a la venta ` +
          `(${this.ventaCargada.fechaEmision?.substring(0, 10)}). Los movimientos e ` +
          `impacto contable se registrarán en el día de la VENTA original. ` +
          `¿Seguro que deseas afectar la operación de ese día?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, afectar',
        rejectLabel: 'Cancelar',
        accept: () => this.persistir(),
      });
      return;
    }
    this.persistir();
  }

  private async persistir(): Promise<void> {
    if (!this.ventaCargada) return;

    const detallesSeleccionados: CreateDevolucionDetalleDto[] = this.detalles
      .filter((d) => d.seleccionado && d.cantidad > 0)
      .map((d) => ({
        productoId: d.productoId,
        cantidad: d.cantidad,
        loteId: d.loteId,
      }));

    const productosAgregados: CreateDevolucionAgregadoDto[] = this.agregados
      .filter((a) => a.cantidad > 0)
      .map((a) => ({
        productoId: a.productoId,
        cantidad: a.cantidad,
        precioUnitario: a.precioUnitario,
        impuestoValor: this.ivaAgregadoUnit(a) * a.cantidad,
      }));

    const dto: CreateDevolucionDto = {
      ventaId: this.ventaCargada.id,
      tipo: this.tipo,
      motivo: this.motivo.trim(),
      reintegraInventario: this.reintegraInventario,
      observaciones: this.observaciones.trim() || undefined,
      fechaDevolucion: this.fechaDevolucion,
      metodoDevolucion: this.metodoDevolucion,
      detalles: detallesSeleccionados,
      productosAgregados: productosAgregados.length ? productosAgregados : undefined,
    };

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      await lastValueFrom(this.devolucionService.create(dto));
      this.alertService.showSuccess(
        'Devolución creada',
        'La devolución fue registrada exitosamente.',
      );
      // Se reimprime la tirilla con los productos ACTUALIZADOS (restantes + cambio).
      // Solo se vuelve a la tabla al cerrar la tirilla; si no hay nada que imprimir,
      // se vuelve de inmediato.
      const mostroTirilla = await this.abrirTirillaPostDevolucion();
      if (mostroTirilla) {
        this.pendienteVolver = true;
      } else {
        this.created.emit();
      }
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

  private async abrirTirillaPostDevolucion(): Promise<boolean> {
    if (!this.ventaCargada) return false;

    // Productos actualizados = lo que queda de la venta + lo agregado en el cambio.
    const restantes = this.calcularDetallesRestantes(this.ventaCargada);
    const agregadosDetalle = this.detallesAgregadosParaTirilla();
    const combinados = [...restantes, ...agregadosDetalle];

    if (combinados.length === 0) {
      this.alertService.showSuccess(
        'Sin productos restantes',
        'La devolución cubre todos los productos de la venta, no hay tirilla por reimprimir.',
      );
      return false;
    }

    try {
      const [empresaRes, auth] = await Promise.all([
        lastValueFrom(this.empresaService.getConfig()),
        this.indexDBService.loadDataAuthDB(),
      ]);
      const empresa = empresaRes?.data;

      const newImpuestosTotal = combinados.reduce((s, d) => s + d.impuestoValor, 0);
      const newDescuentoTotal = combinados.reduce((s, d) => s + d.montoDescuento, 0);
      const newTotalPagar = combinados.reduce((s, d) => s + d.subtotalLinea, 0);
      const newSubtotal = newTotalPagar + newDescuentoTotal - newImpuestosTotal;

      const factorPagos =
        this.ventaCargada.totalPagar > 0
          ? newTotalPagar / this.ventaCargada.totalPagar
          : 1;
      const pagosEscalados = (this.ventaCargada.pagos ?? []).map((p) => ({
        ...p,
        monto: p.monto * factorPagos,
        montoRecibido:
          p.montoRecibido != null ? p.montoRecibido * factorPagos : null,
      }));

      this.ventaImpresion = {
        ...this.ventaCargada,
        detalles: combinados,
        pagos: pagosEscalados,
        subtotal: newSubtotal,
        descuentoTotal: newDescuentoTotal,
        impuestosTotal: newImpuestosTotal,
        totalPagar: newTotalPagar,
        cufe: null,
        qrData: null,
        logoUrl: empresa?.logoUrl ?? '',
        razonSocial: empresa?.razonSocial ?? '',
        empresaNit: empresa?.nit ?? '',
        empresaDireccion: empresa?.direccion ?? '',
        empresaEmail: empresa?.correo ?? '',
        empresaTelefono: empresa?.telefono ?? '',
        municipio: empresa?.municipio ?? '',
        cajeroNombre: auth?.nombreCompleto ?? '',
        resolucionNumero: empresa?.resolucionNumero ?? undefined,
        resolucionPrefijo: empresa?.resolucionPrefijo ?? undefined,
        resolucionDesde: empresa?.resolucionDesde ?? undefined,
        resolucionHasta: empresa?.resolucionHasta ?? undefined,
        resolucionFechaDesde: empresa?.resolucionFechaDesde ?? undefined,
        resolucionFechaHasta: empresa?.resolucionFechaHasta ?? undefined,
      } as VentaModel;
      this.showTirilla = true;
      this.cdr.markForCheck();
      return true;
    } catch {
      this.alertService.showError(
        'Error',
        'No se pudo preparar la tirilla post-devolución.',
      );
      return false;
    }
  }

  /** Convierte los productos del cambio en líneas de tirilla (con IVA). */
  private detallesAgregadosParaTirilla(): VentaDetalleModel[] {
    return this.agregados
      .filter((a) => a.cantidad > 0)
      .map((a) => ({
        id: 0,
        productoId: a.productoId,
        productoNombre: a.productoNombre,
        productoSku: null,
        productoPresentacionId: null,
        presentacionNombre: null,
        cantidad: a.cantidad,
        precioUnitario: a.precioUnitario,
        descuentoValor: 0,
        impuestoValor: this.ivaAgregadoUnit(a) * a.cantidad,
        subtotalLinea: this.subtotalAgregado(a),
        montoDescuento: 0,
        unidadMedidaNombre: null,
      }));
  }

  private calcularDetallesRestantes(venta: VentaModel): VentaDetalleModel[] {
    const result: VentaDetalleModel[] = [];
    for (const original of venta.detalles) {
      const row = this.detalles.find((d) => d.productoId === original.productoId);
      let cantRestante = original.cantidad;
      if (row?.seleccionado && row.cantidad > 0) {
        cantRestante = original.cantidad - row.cantidad;
      }
      if (cantRestante <= 0 || original.cantidad <= 0) continue;

      const factor = cantRestante / original.cantidad;
      result.push({
        ...original,
        cantidad: cantRestante,
        subtotalLinea: original.subtotalLinea * factor,
        impuestoValor: original.impuestoValor * factor,
        montoDescuento: original.montoDescuento * factor,
      });
    }
    return result;
  }

  onTirillaClose(): void {
    this.showTirilla = false;
    this.ventaImpresion = null;
    // Al cerrar la tirilla ya se puede volver a la tabla (recarga la lista).
    if (this.pendienteVolver) {
      this.pendienteVolver = false;
      this.created.emit();
    }
    this.cdr.markForCheck();
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
