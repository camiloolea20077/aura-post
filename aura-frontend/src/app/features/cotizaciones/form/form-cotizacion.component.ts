import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';

import {
  CotizacionModel,
  CreateCotizacionDetalleDto,
  EstadoCotizacion,
} from '../../../core/models/cotizacion.model';
import { ProductoTableModel } from '../../../core/models/producto.model';
import { TerceroModel } from '../../../core/models/tercero.model';
import { CotizacionPdfService } from '../../../core/services/cotizacion-pdf.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { FacturaVentaService } from '../../../core/services/factura-venta.service';
import { SedeActualService } from '../../../core/services/sede-actual.service';
import { ListaPreciosService } from '../../../core/services/lista-precios.service';
import { ProductoPrecioService } from '../../../core/services/producto-precio.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { FormTerceroComponent } from '../../terceros/form/form-tercero.component';
import { ProductoAutocompleteComponent } from '../../../shared/components/producto-autocomplete/producto-autocomplete.component';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { AlertService } from '../../../shared/pipes/alert.service';

/** Línea del formulario: lo que se guarda más lo que se muestra. */
interface LineaForm {
  productoId: number | null;
  productoNombre: string | null;
  productoSku: string | null;
  unidad: string | null;
  manejaInventario: boolean;
  ivaIncluido: boolean;
  descripcion: string;
  cantidad: number;
  /** Sin IVA. */
  precioUnitario: number;
  descuentoPct: number;
  impuestoPorcentaje: number;
}

/** Datos del tercero que se muestran (solo lectura: se editan en el tercero). */
interface DatosTercero {
  tipoDocumento: string;
  numeroDocumento: string;
  dv: string | null;
  nombre: string;
  nombreComercial: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  regimen: string | null;
  responsabilidad: string | null;
}

/**
 * Cotización: el mismo formulario plano de Ventas › Facturas (tercero, datos,
 * productos con totales al lado, observaciones). Se crea aquí o desde el POS;
 * solo la PENDIENTE se edita, las demás se ven en solo lectura con PDF y
 * conversión a venta.
 */
@Component({
  selector: 'app-form-cotizacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    InputTextarea,
    TagModule,
    TooltipModule,
    ConfirmDialog,
    PuedeDirective,
    ProductoAutocompleteComponent,
    TerceroAutocompleteComponent,
    FormTerceroComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './form-cotizacion.component.html',
  styleUrls: ['./form-cotizacion.component.scss'],
})
export class FormCotizacionComponent implements OnInit {
  id: number | null = null;
  cotizacion: CotizacionModel | null = null;
  cargando = true;
  guardando = false;
  soloLectura = false;

  // Tercero
  clienteId: number | null = null;
  clienteLabel: string | null = null;
  tercero: DatosTercero | null = null;
  mostrarFormTercero = false;
  terceroEditarId: number | null = null;

  // Datos
  fecha = new Date();
  diasVigencia = 15;
  vencimiento: Date | null = null;
  listaPreciosId: number | null = null;
  listasOpts: { label: string; value: number }[] = [];
  private preciosLista = new Map<number, Map<number, number>>();

  lineas: LineaForm[] = [];
  observaciones = '';
  readonly maxNotas = 1000;
  readonly hoy = new Date();

  constructor(
    private readonly service: CotizacionService,
    private readonly terceroService: TerceroService,
    private readonly listaService: ListaPreciosService,
    private readonly precioService: ProductoPrecioService,
    private readonly empresaService: EmpresaService,
    private readonly pdf: CotizacionPdfService,
    private readonly facturas: FacturaVentaService,
    private readonly sede: SedeActualService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;
    try {
      const listas = await lastValueFrom(this.listaService.list()).catch(() => null);
      this.listasOpts = (listas?.data ?? []).map((l: any) => ({ label: l.nombre, value: l.id }));
      if (this.id) {
        await this.recargar();
        if (this.cotizacion?.terceroId) await this.cargarTercero(this.cotizacion.terceroId);
      } else {
        this.onVigencia();
        this.agregarLinea();
      }
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la cotización');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private async recargar(): Promise<void> {
    if (!this.id) return;
    const c = (await lastValueFrom(this.service.getById(this.id)))?.data;
    if (!c) throw new Error();
    this.cotizacion = c;
    this.soloLectura = c.estado !== 'PENDIENTE';
    this.clienteId = c.terceroId;
    this.clienteLabel = c.terceroNombre ? `${c.terceroDocumento ?? ''} — ${c.terceroNombre}` : null;
    this.fecha = new Date(c.fecha + 'T00:00:00');
    this.diasVigencia = c.diasVigencia;
    this.vencimiento = new Date(c.fechaVencimiento + 'T00:00:00');
    this.observaciones = c.observaciones ?? '';
    this.lineas = (c.detalles ?? []).map((d) => {
      const bruto = Number(d.cantidad) * Number(d.precioUnitario);
      return {
        productoId: d.productoId,
        productoNombre: d.productoNombre,
        productoSku: d.productoSku,
        unidad: null,
        manejaInventario: true,
        ivaIncluido: false,
        descripcion: d.descripcion ?? '',
        cantidad: Number(d.cantidad),
        precioUnitario: Number(d.precioUnitario),
        descuentoPct: bruto > 0 ? Math.round((Number(d.descuentoValor) / bruto) * 10000) / 100 : 0,
        impuestoPorcentaje: Number(d.ivaPorcentaje ?? 0),
      };
    });
    if (!this.soloLectura) this.agregarLinea();
    this.cdr.markForCheck();
  }

  get titulo(): string {
    return this.cotizacion ? `Cotización ${this.cotizacion.numero}` : 'Nueva cotización';
  }

  etiquetaEstado(e: EstadoCotizacion): string {
    const m: Record<EstadoCotizacion, string> = {
      PENDIENTE: 'Pendiente',
      PARCIAL: 'Parcial',
      VENCIDA: 'Vencida',
      ANULADA: 'Anulada',
      CONVERTIDA: 'Convertida',
    };
    return m[e] ?? e;
  }

  severidadEstado(e: EstadoCotizacion): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    return e === 'PENDIENTE' ? 'info' : e === 'CONVERTIDA' ? 'success' : e === 'PARCIAL' ? 'warn' : e === 'ANULADA' ? 'danger' : 'secondary';
  }

  // ── Tercero ─────────────────────────────────────────────────────────
  async onCliente(): Promise<void> {
    await this.cargarTercero(this.clienteId);
  }

  private async cargarTercero(id: number | null): Promise<void> {
    if (!id) {
      this.tercero = null;
      this.cdr.markForCheck();
      return;
    }
    try {
      const t = (await lastValueFrom(this.terceroService.getById(id)))?.data;
      if (!t) return;
      let ciudad = t.municipio ?? null;
      let departamento: string | null = null;
      if (t.municipioId) {
        const m = (await lastValueFrom(this.terceroService.getMunicipioById(t.municipioId)).catch(() => null))?.data;
        if (m) {
          ciudad = m.nombre;
          const partes = (m.label ?? '').split(' - ');
          departamento = partes.length > 1 ? partes.slice(1).join(' - ') : null;
        }
      }
      this.tercero = {
        tipoDocumento: t.tipoDocumento,
        numeroDocumento: t.numeroDocumento,
        dv: t.dv,
        nombre: this.nombreTercero(t),
        nombreComercial: t.nombreComercial ?? null,
        email: t.emailFe || t.email,
        telefono: t.telefono,
        direccion: t.direccion,
        ciudad,
        departamento,
        regimen: t.regimen ?? null,
        responsabilidad: t.responsabilidadFiscal,
      };
      this.clienteLabel = `${t.numeroDocumento} — ${this.tercero.nombre}`;
    } catch {
      this.tercero = null;
    }
    this.cdr.markForCheck();
  }

  private nombreTercero(t: TerceroModel): string {
    return (
      t.razonSocial?.trim() ||
      [t.nombre1, t.nombre2, t.apellido1, t.apellido2].filter(Boolean).join(' ').trim() ||
      [t.nombres, t.apellidos].filter(Boolean).join(' ').trim()
    );
  }

  crearTercero(): void {
    this.terceroEditarId = null;
    this.mostrarFormTercero = true;
  }

  editarTercero(): void {
    if (!this.clienteId) return;
    this.terceroEditarId = this.clienteId;
    this.mostrarFormTercero = true;
  }

  async onTerceroGuardado(t: TerceroModel): Promise<void> {
    this.mostrarFormTercero = false;
    this.clienteId = t.id;
    await this.cargarTercero(t.id);
  }

  // ── Vigencia y lista de precios ─────────────────────────────────────
  onVigencia(): void {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + Math.max(1, this.diasVigencia || 1));
    this.vencimiento = d;
  }

  onVencimiento(): void {
    if (!this.vencimiento) return;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.diasVigencia = Math.max(1, Math.round((this.vencimiento.getTime() - hoy.getTime()) / 86400000));
  }

  /** Cambiar la lista vuelve a poner el precio de esa lista en cada línea que lo tenga. */
  async onLista(): Promise<void> {
    if (this.listaPreciosId && !this.preciosLista.has(this.listaPreciosId)) {
      const res = await lastValueFrom(this.precioService.listByLista(this.listaPreciosId)).catch(() => null);
      const m = new Map<number, number>();
      for (const p of res?.data ?? []) {
        if (p.productoId != null && p.productoPresentacionId == null) m.set(p.productoId, Number(p.precio));
      }
      this.preciosLista.set(this.listaPreciosId, m);
    }
    for (const l of this.lineas) {
      const p = this.precioDeLista(l.productoId);
      if (p != null) l.precioUnitario = this.sinIva(p, l.impuestoPorcentaje, l.ivaIncluido);
    }
    this.cdr.markForCheck();
  }

  private precioDeLista(productoId: number | null): number | null {
    if (!productoId || !this.listaPreciosId) return null;
    return this.preciosLista.get(this.listaPreciosId)?.get(productoId) ?? null;
  }

  private sinIva(precio: number, iva: number, incluido: boolean): number {
    return incluido && iva > 0 ? Math.round((precio / (1 + iva / 100)) * 100) / 100 : precio;
  }

  // ── Líneas ──────────────────────────────────────────────────────────
  agregarLinea(): void {
    this.lineas = [
      ...this.lineas,
      {
        productoId: null,
        productoNombre: null,
        productoSku: null,
        unidad: null,
        manejaInventario: false,
        ivaIncluido: false,
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        descuentoPct: 0,
        impuestoPorcentaje: 0,
      },
    ];
  }

  quitarLinea(i: number): void {
    this.lineas = this.lineas.filter((_, k) => k !== i);
    if (!this.lineas.length) this.agregarLinea();
  }

  onProducto(l: LineaForm, p: ProductoTableModel | null): void {
    if (!p) {
      Object.assign(l, { productoId: null, productoNombre: null, productoSku: null, unidad: null });
      this.cdr.markForCheck();
      return;
    }
    const iva = Number(p.ivaPorcentaje ?? 0);
    l.productoId = p.id;
    l.productoNombre = p.nombre;
    l.productoSku = p.codigoBarras || p.sku;
    l.unidad = p.unidadAbreviatura ?? null;
    l.manejaInventario = p.tipoProducto !== 'SERVICIO';
    l.ivaIncluido = !!p.ivaIncluido;
    l.impuestoPorcentaje = iva;
    l.precioUnitario = this.sinIva(this.precioDeLista(p.id) ?? Number(p.precio ?? 0), iva, l.ivaIncluido);
    if (this.lineas[this.lineas.length - 1] === l) this.agregarLinea();
    this.cdr.markForCheck();
  }

  bruto(l: LineaForm): number {
    return (l.cantidad || 0) * (l.precioUnitario || 0);
  }

  descuento(l: LineaForm): number {
    return Math.round(this.bruto(l) * (l.descuentoPct || 0)) / 100;
  }

  base(l: LineaForm): number {
    return Math.round((this.bruto(l) - this.descuento(l)) * 100) / 100;
  }

  impuesto(l: LineaForm): number {
    return Math.round(this.base(l) * (l.impuestoPorcentaje || 0)) / 100;
  }

  totalLinea(l: LineaForm): number {
    return this.base(l) + this.impuesto(l);
  }

  private get conProducto(): LineaForm[] {
    return this.lineas.filter((l) => l.productoId);
  }

  get subtotal(): number {
    return this.conProducto.reduce((s, l) => s + this.bruto(l), 0);
  }

  get descuentos(): number {
    return this.conProducto.reduce((s, l) => s + this.descuento(l), 0);
  }

  get ivas(): { tarifa: number; valor: number }[] {
    const m = new Map<number, number>();
    for (const l of this.conProducto) {
      if (!l.impuestoPorcentaje) continue;
      m.set(l.impuestoPorcentaje, (m.get(l.impuestoPorcentaje) ?? 0) + this.impuesto(l));
    }
    return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([tarifa, valor]) => ({ tarifa, valor }));
  }

  get total(): number {
    return this.conProducto.reduce((s, l) => s + this.totalLinea(l), 0);
  }

  // ── Guardar ─────────────────────────────────────────────────────────
  private detalles(): CreateCotizacionDetalleDto[] | null {
    const lineas = this.conProducto;
    if (!lineas.length) {
      this.alert.showWarn('Sin productos', 'Agregue al menos un producto o servicio.');
      return null;
    }
    if (lineas.some((l) => !l.cantidad || l.cantidad <= 0)) {
      this.alert.showWarn('Cantidad', 'Cada línea debe tener una cantidad mayor a cero.');
      return null;
    }
    return lineas.map((l) => ({
      productoId: l.productoId!,
      descripcion: l.descripcion.trim() && l.descripcion.trim() !== l.productoNombre ? l.descripcion.trim() : null,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      ivaPorcentaje: l.impuestoPorcentaje || 0,
      descuentoValor: this.descuento(l),
    }));
  }

  async guardar(): Promise<void> {
    const detalles = this.detalles();
    if (!detalles) return;
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      const base = {
        terceroId: this.clienteId,
        observaciones: this.observaciones.trim() || null,
        diasVigencia: this.diasVigencia,
        detalles,
      };
      if (this.id) {
        await lastValueFrom(this.service.update(this.id, base));
        this.alert.showSuccess('Cotización guardada', '');
        await this.recargar();
      } else {
        const res = await lastValueFrom(this.service.create({ ...base, turnoCajaId: null }));
        const nueva = res?.data;
        this.alert.showSuccess('Cotización creada', nueva?.numero ?? '');
        if (nueva?.id) this.router.navigate(['/cotizaciones/editar', nueva.id], { replaceUrl: true });
      }
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo guardar la cotización');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  // ── Acciones de la cotización guardada ──────────────────────────────
  get puedeConvertir(): boolean {
    return !!this.cotizacion && (this.cotizacion.estado === 'PENDIENTE' || this.cotizacion.estado === 'PARCIAL');
  }

  async descargarPdf(): Promise<void> {
    if (!this.cotizacion) {
      this.alert.showWarn('Guarde primero', 'Guarde la cotización para descargar el PDF.');
      return;
    }
    try {
      const empresa = (await lastValueFrom(this.empresaService.getConfig()))?.data ?? {};
      await this.pdf.cotizacion(this.cotizacion, empresa);
    } catch {
      this.alert.showError('Error', 'No se pudo generar el PDF');
    }
  }

  async convertirAVenta(): Promise<void> {
    if (!this.cotizacion) return;
    try {
      const res = await lastValueFrom(this.service.convertirAVenta(this.cotizacion.id));
      if (res?.data) this.router.navigate(['/pos'], { state: { cotizacion: res.data } });
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo convertir la cotización.');
    }
  }

  /**
   * Factura de Facturación con lo que le queda pendiente: se crea como
   * borrador en la sede actual y se abre para revisarla y emitirla.
   */
  async facturar(): Promise<void> {
    if (!this.cotizacion) return;
    if (!this.cotizacion.terceroId) {
      this.alert.showWarn('Sin cliente', 'Asigne un cliente a la cotización para poder facturarla.');
      return;
    }
    const sedeId = await this.sede.id();
    if (!sedeId) {
      this.alert.showWarn('Sin sede', 'Elija la sede en la barra superior para facturar.');
      return;
    }
    try {
      const res = await lastValueFrom(this.facturas.desdeCotizacion(this.cotizacion.id, sedeId));
      const id = res?.data?.id;
      this.alert.showSuccess('Borrador creado', 'Revise la factura y emítala.');
      if (id) this.router.navigate(['/ventas/facturas', id, 'editar']);
    } catch (e: any) {
      this.alert.showError('No se pudo facturar', e?.error?.message ?? 'Intente de nuevo');
    }
  }

  anular(): void {
    if (!this.cotizacion) return;
    this.confirm.confirm({
      header: 'Anular cotización',
      message: `¿Anular la cotización ${this.cotizacion.numero}?`,
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await lastValueFrom(this.service.anular(this.cotizacion!.id));
          this.alert.showSuccess('Cotización anulada', '');
          await this.recargar();
        } catch (e: any) {
          this.alert.showError('No se pudo anular', e?.error?.message ?? 'Intente de nuevo');
        }
      },
    });
  }

  volver(): void {
    this.router.navigate(['/cotizaciones']);
  }

  cop(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(
      v ?? 0,
    );
  }
}
