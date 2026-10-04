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

import { BodegaDto } from '../../../core/models/bodega.model';
import { CuentaBancariaModel } from '../../../core/models/cuenta-bancaria.model';
import {
  AnticipoCliente,
  CondicionPago,
  FacturaVentaDetalle,
  FacturaVentaLineaDto,
  FormaPagoFactura,
  GuardarFacturaVenta,
  MetodoContado,
} from '../../../core/models/factura-venta.model';
import { ProductoTableModel } from '../../../core/models/producto.model';
import { SucursalDto } from '../../../core/models/sucursal.model';
import { TerceroModel } from '../../../core/models/tercero.model';
import { BodegaService } from '../../../core/services/bodega.service';
import { CuentaBancariaService } from '../../../core/services/cuenta-bancaria.service';
import { CentroCostoService } from '../../../core/services/centro-costo.service';
import { ProductoPresentacionService } from '../../../core/services/producto-presentacion.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { FacturaVentaPdfService } from '../../../core/services/factura-venta-pdf.service';
import { FacturaVentaService } from '../../../core/services/factura-venta.service';
import { ListaPreciosService } from '../../../core/services/lista-precios.service';
import { ProductoPrecioService } from '../../../core/services/producto-precio.service';
import { SedeActualService } from '../../../core/services/sede-actual.service';
import { SucursalService } from '../../../core/services/sucursal.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { FormTerceroComponent } from '../../terceros/form/form-tercero.component';
import { ProductoAutocompleteComponent } from '../../../shared/components/producto-autocomplete/producto-autocomplete.component';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { AlertService } from '../../../shared/pipes/alert.service';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { aFechaLocal } from '../../../shared/utils/fecha.util';

/** Línea del formulario: lo que se guarda más lo que se muestra. */
interface LineaForm {
  productoId: number | null;
  productoNombre: string | null;
  productoSku: string | null;
  unidad: string | null;
  manejaInventario: boolean;
  /** Precio del producto tal como viene del catálogo (para la lista de precios). */
  ivaIncluido: boolean;
  descripcion: string;
  cantidad: number;
  /** Sin IVA. */
  precioUnitario: number;
  descuentoPct: number;
  impuestoPorcentaje: number;
  /** Presentación elegida (caja x12…); null = unidad base. */
  productoPresentacionId: number | null;
  /** Opciones de venta del producto: unidad base y presentaciones que se venden. */
  presentaciones: { label: string; value: number | null; precio: number | null; unidad: string }[];
  /** Línea de la cotización de origen. */
  cotizacionDetalleId: number | null;
}

/** Datos del tercero que se muestran en la factura (solo lectura: se editan en el tercero). */
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
 * Factura de venta de Facturación: formulario plano por secciones (tercero,
 * datos, pago, productos con totales al lado, notas). Se guarda como borrador
 * (no consume consecutivo, stock ni contabilidad) y se emite cuando está lista.
 */
@Component({
  selector: 'app-form-factura-venta',
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
    PuedeDirective,
    ConfirmDialog,
    ProductoAutocompleteComponent,
    TerceroAutocompleteComponent,
    FormTerceroComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './form-factura-venta.component.html',
  styleUrls: ['./form-factura-venta.component.scss'],
})
export class FormFacturaVentaComponent implements OnInit {
  id: number | null = null;
  cargando = true;
  guardando = false;
  /** La factura tal como está guardada (para el encabezado, el PDF y la DIAN). */
  factura: FacturaVentaDetalle | null = null;
  /** Emitida o anulada: el mismo formulario, sin editar. */
  soloLectura = false;

  sucursales: SucursalDto[] = [];
  bodegas: BodegaDto[] = [];
  condiciones: CondicionPago[] = [];
  cuentasOpts: { label: string; value: number }[] = [];
  listasOpts: { label: string; value: number }[] = [];
  vendedoresOpts: { label: string; value: number }[] = [];
  /** listaId → (producto → precio) */
  private preciosLista = new Map<number, Map<number, number>>();

  // Tercero
  clienteId: number | null = null;
  clienteLabel: string | null = null;
  tercero: DatosTercero | null = null;
  mostrarFormTercero = false;
  terceroEditarId: number | null = null;

  // Datos
  sucursalId: number | null = null;
  bodegaId: number | null = null;
  readonly fechaEmision = new Date();
  vencimiento: Date | null = null;
  ordenCompra = '';
  listaPreciosId: number | null = null;
  vendedorId: number | null = null;

  // Pago
  formaPago: FormaPagoFactura = 'CREDITO';
  condicionPagoId: number | null = null;
  plazo = 30;
  metodoPago: MetodoContado = 'TRANSFERENCIA';
  cuentaBancariaId: number | null = null;

  lineas: LineaForm[] = [];
  notas = '';

  // Centro de costo del asiento (vacío = el de la sede).
  centroCostoId: number | null = null;
  centrosOpts: { label: string; value: number }[] = [];

  // Anticipos del cliente que se cruzan al emitir a crédito.
  anticipos: (AnticipoCliente & { aplicar: number })[] = [];
  readonly maxNotas = 1000;

  readonly formas = [
    { label: 'Contado', value: 'CONTADO' },
    { label: 'Crédito', value: 'CREDITO' },
  ];
  readonly metodos = [
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Consignación', value: 'CONSIGNACION' },
    { label: 'Tarjeta', value: 'TARJETA' },
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Cheque', value: 'CHEQUE' },
  ];
  readonly hoy = new Date();

  // AIU (construcción): las líneas son costo directo; A, I y U salen de sus porcentajes.
  esAiu = false;
  aiuAdministracionPct = 10;
  aiuImprevistosPct = 5;
  aiuUtilidadPct = 5;
  aiuIvaPct = 19;
  readonly tiposFactura = [
    { label: 'Normal', value: false },
    { label: 'AIU (construcción)', value: true },
  ];

  constructor(
    private readonly service: FacturaVentaService,
    private readonly sucursalService: SucursalService,
    private readonly bodegaService: BodegaService,
    private readonly cuentaService: CuentaBancariaService,
    private readonly terceroService: TerceroService,
    private readonly listaService: ListaPreciosService,
    private readonly precioService: ProductoPrecioService,
    private readonly usuarioService: UsuarioService,
    private readonly sede: SedeActualService,
    private readonly empresaService: EmpresaService,
    private readonly centroCostoService: CentroCostoService,
    private readonly presentacionService: ProductoPresentacionService,
    private readonly pdf: FacturaVentaPdfService,
    private readonly alert: AlertService,
    private readonly confirm: ConfirmationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Se recarga si cambia el id con la misma ruta (p. ej. al copiar un borrador).
    this.route.paramMap.subscribe((p) => this.iniciar(p.get('id')));
  }

  private async iniciar(idParam: string | null): Promise<void> {
    this.id = idParam ? Number(idParam) : null;
    this.cargando = true;
    this.factura = null;
    this.soloLectura = false;
    this.tercero = null;
    this.clienteId = null;
    this.clienteLabel = null;
    this.lineas = [];
    this.esAiu = false;
    this.ordenCompra = '';
    this.notas = '';
    this.vendedorId = null;
    this.bodegaId = null;
    this.formaPago = 'CREDITO';
    this.metodoPago = 'TRANSFERENCIA';
    this.cuentaBancariaId = null;
    this.listaPreciosId = null;
    this.centroCostoId = null;
    this.anticipos = [];
    this.cdr.markForCheck();
    try {
      const [suc, cond, cuentas, listas, usuarios, sedeId] = await Promise.all([
        lastValueFrom(this.sucursalService.getActivas()).catch(() => null),
        lastValueFrom(this.service.condiciones()).catch(() => null),
        lastValueFrom(this.cuentaService.list()).catch(() => null),
        lastValueFrom(this.listaService.list()).catch(() => null),
        lastValueFrom(this.usuarioService.page({ page: 0, rows: 500, search: null, params: {} } as any)).catch(
          () => null,
        ),
        this.sede.id(),
      ]);
      const centros = await lastValueFrom(
        this.centroCostoService.page({ page: 0, rows: 500, search: null } as any),
      ).catch(() => null);
      this.centrosOpts = ((centros as any)?.data?.content ?? [])
        .filter((c: any) => c.activo !== false)
        .map((c: any) => ({ label: `${c.codigo ? c.codigo + ' · ' : ''}${c.nombre}`, value: c.id }));
      this.sucursales = suc?.data ?? [];
      this.condiciones = cond?.data ?? [];
      this.cuentasOpts = (cuentas?.data ?? [])
        .filter((c: CuentaBancariaModel) => c.activa)
        .map((c: CuentaBancariaModel) => ({
          label: `${c.nombre}${c.banco ? ' · ' + c.banco : ''}${c.numeroCuenta ? ' · ' + c.numeroCuenta : ''}`,
          value: c.id,
        }));
      this.listasOpts = (listas?.data ?? []).map((l: any) => ({ label: l.nombre, value: l.id }));
      this.vendedoresOpts = (usuarios?.data?.content ?? [])
        .filter((u: any) => u.activo)
        .map((u: any) => ({ label: u.nombreCompleto || u.username, value: u.id }));

      if (this.id) {
        const res = await lastValueFrom(this.service.getById(this.id));
        const f = res?.data;
        if (!f) throw new Error();
        this.factura = f;
        this.soloLectura = f.estado !== 'BORRADOR';
        this.cargarFactura(f);
        await this.cargarTercero(f.clienteId);
        await this.cargarAnticipos();
      } else {
        this.sucursalId = sedeId ?? this.sucursales[0]?.id ?? null;
        this.condicionPagoId = this.condiciones.find((c) => c.dias === 30)?.id ?? null;
        this.onCondicion();
        this.agregarLinea();
      }
      await this.cargarBodegas();
    } catch {
      this.alert.showError('Error', 'No se pudo cargar la factura');
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private cargarFactura(f: FacturaVentaDetalle): void {
    this.sucursalId = f.sucursalId;
    this.bodegaId = f.bodegaId;
    this.clienteId = f.clienteId;
    this.clienteLabel = `${f.clienteDocumento ?? ''} — ${f.clienteNombre}`;
    this.vendedorId = f.vendedorId;
    this.formaPago = f.formaPago;
    this.condicionPagoId = f.condicionPagoId;
    this.vencimiento = f.fechaVencimiento ? new Date(f.fechaVencimiento + 'T00:00:00') : null;
    this.plazo = this.vencimiento ? this.diasHasta(this.vencimiento) : 0;
    this.metodoPago = f.metodoPago ?? 'TRANSFERENCIA';
    this.cuentaBancariaId = f.cuentaBancariaId;
    this.ordenCompra = f.ordenCompra ?? '';
    this.notas = f.notas ?? '';
    this.esAiu = !!f.aiu;
    if (f.aiu) {
      this.aiuAdministracionPct = Number(f.aiuAdministracionPct);
      this.aiuImprevistosPct = Number(f.aiuImprevistosPct);
      this.aiuUtilidadPct = Number(f.aiuUtilidadPct);
      this.aiuIvaPct = Number(f.aiuIvaPct);
    }
    // Las líneas de A, I y U no se editan: se recalculan desde los porcentajes.
    this.lineas = f.lineas.filter((l) => !l.aiuTipo).map((l) => {
      const bruto = Number(l.cantidad) * Number(l.precioUnitario);
      return {
        productoId: l.productoId,
        productoNombre: l.productoNombre,
        productoSku: l.productoSku,
        unidad: l.unidadAbreviatura,
        manejaInventario: l.manejaInventario,
        ivaIncluido: false,
        descripcion: l.descripcion ?? '',
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        descuentoPct: bruto > 0 ? Math.round((Number(l.descuentoValor) / bruto) * 10000) / 100 : 0,
        impuestoPorcentaje: Number(l.impuestoPorcentaje),
        productoPresentacionId: l.productoPresentacionId ?? null,
        presentaciones: [],
        cotizacionDetalleId: l.cotizacionDetalleId ?? null,
      } as LineaForm;
    });
    this.centroCostoId = f.centroCostoId ?? null;
    // Las presentaciones de cada producto, para el select de la línea.
    if (!this.soloLectura) this.lineas.forEach((l) => this.cargarPresentaciones(l, false));
  }

  // ── Tercero ─────────────────────────────────────────────────────────
  async onCliente(): Promise<void> {
    await this.cargarTercero(this.clienteId);
    await this.cargarAnticipos();
  }

  /** Anticipos activos del cliente (solo para borradores a crédito). */
  async cargarAnticipos(): Promise<void> {
    this.anticipos = [];
    if (!this.clienteId || this.soloLectura) {
      this.cdr.markForCheck();
      return;
    }
    const res = await lastValueFrom(this.service.anticiposCliente(this.clienteId)).catch(() => null);
    this.anticipos = (res?.data ?? []).map((a) => ({ ...a, aplicar: 0 }));
    this.cdr.markForCheck();
  }

  get totalAnticipos(): number {
    return this.anticipos.reduce((s, a) => s + (a.aplicar || 0), 0);
  }

  /** Aplica todo lo posible: el saldo de cada anticipo hasta cubrir el total. */
  aplicarAnticipos(): void {
    let falta = this.total;
    for (const a of this.anticipos) {
      a.aplicar = Math.max(0, Math.min(Number(a.saldo), falta));
      falta -= a.aplicar;
    }
    this.cdr.markForCheck();
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

  // ── Datos y pago ────────────────────────────────────────────────────
  async cargarBodegas(): Promise<void> {
    if (!this.sucursalId) {
      this.bodegas = [];
      return;
    }
    const res = await lastValueFrom(this.bodegaService.list({ sucursalId: this.sucursalId, soloVenta: true })).catch(
      () => null,
    );
    this.bodegas = res?.data ?? [];
    if (!this.bodegas.some((b) => b.id === this.bodegaId)) {
      this.bodegaId = this.bodegas.find((b) => b.esPrincipal)?.id ?? this.bodegas[0]?.id ?? null;
    }
    this.cdr.markForCheck();
  }

  onSucursal(): void {
    this.cargarBodegas();
  }

  onFormaPago(): void {
    if (this.formaPago === 'CONTADO') {
      this.plazo = 0;
    } else {
      if (!this.condicionPagoId) this.condicionPagoId = this.condiciones.find((c) => c.dias === 30)?.id ?? null;
      this.onCondicion();
    }
  }

  /** La condición fija el plazo y el vencimiento (los dos se pueden ajustar a mano). */
  onCondicion(): void {
    const c = this.condiciones.find((x) => x.id === this.condicionPagoId);
    if (c && c.dias === 0) {
      this.formaPago = 'CONTADO';
      this.plazo = 0;
      return;
    }
    this.plazo = c?.dias ?? 30;
    this.onPlazo();
  }

  onPlazo(): void {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + Math.max(0, this.plazo || 0));
    this.vencimiento = d;
  }

  onVencimiento(): void {
    if (this.vencimiento) this.plazo = this.diasHasta(this.vencimiento);
  }

  private diasHasta(d: Date): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((d.getTime() - hoy.getTime()) / 86400000));
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
        productoPresentacionId: null,
        presentaciones: [],
        cotizacionDetalleId: null,
      },
    ];
  }

  quitarLinea(i: number): void {
    this.lineas = this.lineas.filter((_, k) => k !== i);
    if (!this.lineas.length) this.agregarLinea();
  }

  /** Al elegir el producto se trae su precio (sin IVA, o el de la lista) y su IVA; luego se pueden cambiar. */
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
    l.productoPresentacionId = null;
    l.cotizacionDetalleId = null;
    (l as any).precioBase = Number(p.precio ?? 0);
    (l as any).vendePorUnidad = (p as any).vendePorUnidad !== false;
    if (this.lineas[this.lineas.length - 1] === l) this.agregarLinea();
    this.cargarPresentaciones(l, true);
    this.cdr.markForCheck();
  }

  /**
   * Opciones de venta del producto: la unidad base (si se vende suelto) y sus
   * presentaciones que se venden. Con `elegir`, si no se vende suelto queda
   * la presentación por defecto con su precio.
   */
  private async cargarPresentaciones(l: LineaForm, elegir: boolean): Promise<void> {
    if (!l.productoId) return;
    const res = await lastValueFrom(this.presentacionService.listByProducto(l.productoId)).catch(() => null);
    const pres = (res?.data ?? []).filter((x) => x.seVende !== false);
    const opciones: LineaForm['presentaciones'] = [];
    const sueltoPermitido = (l as any).vendePorUnidad !== false;
    if (sueltoPermitido || !pres.length) {
      opciones.push({ label: l.unidad ? `Unidad (${l.unidad})` : 'Unidad', value: null, precio: null, unidad: l.unidad ?? '' });
    }
    for (const x of pres) {
      opciones.push({
        label: `${x.nombre}${x.factorConversion ? ' · ' + Number(x.factorConversion) + ' und' : ''}`,
        value: x.id,
        precio: x.precio != null ? Number(x.precio) : null,
        unidad: x.nombre,
      });
    }
    l.presentaciones = opciones;
    if (elegir && !sueltoPermitido && pres.length) {
      const def = pres.find((x) => x.esDefaultVenta) ?? pres[0];
      l.productoPresentacionId = def.id;
      this.onPresentacion(l);
    }
    this.cdr.markForCheck();
  }

  /** Cambiar la presentación pone su precio (sin IVA) y su nombre como unidad. */
  onPresentacion(l: LineaForm): void {
    const op = l.presentaciones.find((o) => o.value === l.productoPresentacionId);
    if (!op) return;
    if (op.value == null) {
      const base = (l as any).precioBase;
      if (base != null) l.precioUnitario = this.sinIva(Number(base), l.impuestoPorcentaje, l.ivaIncluido);
    } else if (op.precio != null) {
      l.precioUnitario = this.sinIva(op.precio, l.impuestoPorcentaje, l.ivaIncluido);
    }
    l.unidad = op.value == null ? (op.unidad || l.unidad) : op.unidad;
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
    // En AIU la obra no lleva IVA: va solo sobre la Utilidad.
    if (this.esAiu) return 0;
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

  /** IVA por tarifa, como sale en la factura. */
  get ivas(): { tarifa: number; valor: number }[] {
    const m = new Map<number, number>();
    for (const l of this.conProducto) {
      if (!l.impuestoPorcentaje) continue;
      m.set(l.impuestoPorcentaje, (m.get(l.impuestoPorcentaje) ?? 0) + this.impuesto(l));
    }
    return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([tarifa, valor]) => ({ tarifa, valor }));
  }

  get total(): number {
    const obra = this.conProducto.reduce((s, l) => s + this.totalLinea(l), 0);
    return obra + this.aiuLineas.reduce((s, a) => s + a.valor + a.iva, 0);
  }

  /** Costo directo de la obra (base sin IVA), sobre el que se calcula el AIU. */
  get costoDirecto(): number {
    return this.conProducto.reduce((s, l) => s + this.base(l), 0);
  }

  /** A, I y U como las calcula el servidor (redondeo a centavos). */
  get aiuLineas(): { tipo: string; nombre: string; pct: number; valor: number; ivaPct: number; iva: number }[] {
    if (!this.esAiu) return [];
    const r2 = (v: number) => Math.round(v * 100) / 100;
    const cd = this.costoDirecto;
    return [
      { tipo: 'ADMINISTRACION', nombre: 'Administración', pct: this.aiuAdministracionPct || 0, iva: false },
      { tipo: 'IMPREVISTOS', nombre: 'Imprevistos', pct: this.aiuImprevistosPct || 0, iva: false },
      { tipo: 'UTILIDAD', nombre: 'Utilidad', pct: this.aiuUtilidadPct || 0, iva: true },
    ]
      .map((a) => {
        const valor = r2((cd * a.pct) / 100);
        const ivaPct = a.iva ? this.aiuIvaPct || 0 : 0;
        return { tipo: a.tipo, nombre: a.nombre, pct: a.pct, valor, ivaPct, iva: r2((valor * ivaPct) / 100) };
      })
      .filter((a) => a.valor > 0);
  }

  onTipoFactura(): void {
    this.cdr.markForCheck();
  }

  // ── Guardar / emitir ────────────────────────────────────────────────
  private dto(): GuardarFacturaVenta | null {
    if (!this.clienteId) {
      this.alert.showWarn('Falta el cliente', 'Busque o cree el tercero al que se le factura.');
      return null;
    }
    if (!this.sucursalId) {
      this.alert.showWarn('Falta la sede', 'Elija la sede que factura.');
      return null;
    }
    const lineas = this.conProducto;
    if (!lineas.length) {
      this.alert.showWarn('Sin productos', 'Agregue al menos un producto o servicio.');
      return null;
    }
    if (lineas.some((l) => !l.cantidad || l.cantidad <= 0)) {
      this.alert.showWarn('Cantidad', 'Cada línea debe tener una cantidad mayor a cero.');
      return null;
    }
    if (this.formaPago === 'CONTADO' && this.metodoPago !== 'EFECTIVO' && !this.cuentaBancariaId) {
      this.alert.showWarn('Falta la cuenta', 'Elija la cuenta bancaria donde entró el pago.');
      return null;
    }
    return {
      sucursalId: this.sucursalId,
      bodegaId: this.bodegaId,
      clienteId: this.clienteId,
      vendedorId: this.vendedorId,
      condicionPagoId: this.formaPago === 'CREDITO' ? this.condicionPagoId : null,
      formaPago: this.formaPago,
      metodoPago: this.formaPago === 'CONTADO' ? this.metodoPago : null,
      cuentaBancariaId: this.formaPago === 'CONTADO' && this.metodoPago !== 'EFECTIVO' ? this.cuentaBancariaId : null,
      fechaVencimiento: this.formaPago === 'CREDITO' ? aFechaLocal(this.vencimiento) : null,
      ordenCompra: this.ordenCompra.trim() || null,
      notas: this.notas.trim() || null,
      aiu: this.esAiu,
      aiuAdministracionPct: this.aiuAdministracionPct || 0,
      aiuImprevistosPct: this.aiuImprevistosPct || 0,
      aiuUtilidadPct: this.aiuUtilidadPct || 0,
      aiuIvaPct: this.aiuIvaPct || 0,
      centroCostoId: this.centroCostoId,
      lineas: lineas.map((l) => ({
        productoId: l.productoId,
        productoPresentacionId: l.productoPresentacionId,
        cotizacionDetalleId: l.cotizacionDetalleId,
        descripcion: l.descripcion.trim() && l.descripcion.trim() !== l.productoNombre ? l.descripcion.trim() : null,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        descuentoValor: this.descuento(l),
        impuestoPorcentaje: l.impuestoPorcentaje || 0,
      })),
    };
  }

  /** Guarda el borrador y devuelve su id (o null si no se pudo). */
  private async guardarBorrador(): Promise<number | null> {
    const dto = this.dto();
    if (!dto) return null;
    const res = await lastValueFrom(this.id ? this.service.actualizar(this.id, dto) : this.service.crear(dto));
    const id = res?.data?.id ?? null;
    if (id && !this.id) {
      this.id = id;
      this.router.navigate(['/ventas/facturas', id, 'editar'], { replaceUrl: true });
    }
    return id;
  }

  async guardar(): Promise<void> {
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      if (await this.guardarBorrador()) this.alert.showSuccess('Borrador guardado', 'Puede emitirla cuando esté lista.');
    } catch (e: any) {
      this.alert.showError('Error', e?.error?.message ?? 'No se pudo guardar el borrador');
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  emitir(): void {
    if (!this.dto()) return;
    const anticipo = this.formaPago === 'CREDITO' ? this.totalAnticipos : 0;
    if (anticipo > this.total + 0.01) {
      this.alert.showWarn('Anticipos', 'Lo aplicado de anticipos no puede superar el total de la factura.');
      return;
    }
    if (this.anticipos.some((a) => a.aplicar > Number(a.saldo) + 0.01)) {
      this.alert.showWarn('Anticipos', 'No se puede aplicar más del saldo de un anticipo.');
      return;
    }
    this.confirm.confirm({
      header: 'Emitir factura',
      message:
        `Se emitirá por ${this.cop(this.total)}` +
        (this.formaPago === 'CREDITO' ? ' a crédito (queda en cartera)' : ' de contado') +
        (anticipo > 0 ? `, cruzando ${this.cop(anticipo)} de anticipos del cliente` : '') +
        '. Toma el consecutivo, descuenta el inventario y genera el asiento. ¿Continuar?',
      acceptLabel: 'Emitir',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.guardando = true;
        this.cdr.markForCheck();
        try {
          const id = await this.guardarBorrador();
          if (!id) return;
          const anticipos =
            this.formaPago === 'CREDITO'
              ? this.anticipos.filter((a) => a.aplicar > 0).map((a) => ({ anticipoId: a.id, monto: a.aplicar }))
              : [];
          const res = await lastValueFrom(this.service.emitir(id, anticipos));
          this.alert.showSuccess('Factura emitida', res?.message ?? '');
          this.router.navigate(['/ventas/facturas', id], { replaceUrl: true });
          await this.recargar();
        } catch (e: any) {
          this.alert.showError('No se pudo emitir', e?.error?.message ?? 'Revise la factura e intente de nuevo');
        } finally {
          this.guardando = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  eliminar(): void {
    if (!this.id) return;
    this.confirm.confirm({
      header: 'Eliminar borrador',
      message: 'El borrador se borra sin dejar rastro. ¿Continuar?',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          await lastValueFrom(this.service.eliminar(this.id!));
          this.alert.showSuccess('Borrador eliminado', '');
          this.router.navigate(['/ventas/facturas']);
        } catch (e: any) {
          this.alert.showError('Error', e?.error?.message ?? 'No se pudo eliminar');
        }
      },
    });
  }

  // ── Factura emitida ─────────────────────────────────────────────────
  get titulo(): string {
    if (!this.id) return 'Nueva factura';
    if (!this.factura || this.factura.estado === 'BORRADOR') return `Borrador #${this.id}`;
    return `Factura ${this.factura.numero ?? ''}`;
  }

  get puedeEnviarDian(): boolean {
    const f = this.factura;
    return !!f && f.estado === 'EMITIDA' && !f.cufe && f.estadoDian !== 'EMITIDA';
  }

  private async recargar(): Promise<void> {
    if (!this.id) return;
    const f = (await lastValueFrom(this.service.getById(this.id)))?.data;
    if (f) {
      this.factura = f;
      this.soloLectura = f.estado !== 'BORRADOR';
    }
    this.cdr.markForCheck();
  }

  /**
   * PDF de la factura: la guardada si ya se emitió; si es borrador, lo que hay
   * en pantalla (aunque no se haya guardado), marcado como borrador.
   */
  async descargarPdf(): Promise<void> {
    const f = this.soloLectura && this.factura ? this.factura : this.vistaPrevia();
    if (!f) return;
    try {
      const empresa = (await lastValueFrom(this.empresaService.getConfig()))?.data ?? {};
      const t = this.tercero;
      await this.pdf.generar(f, empresa, {
        nombre: t?.nombre ?? f.clienteNombre,
        tipoDocumento: t?.tipoDocumento ?? 'NIT',
        numeroDocumento: t?.numeroDocumento ?? f.clienteDocumento ?? '',
        dv: t?.dv ?? null,
        telefono: t?.telefono ?? null,
        direccion: t?.direccion ?? null,
        ciudad: t?.ciudad ?? null,
        email: t?.email ?? null,
        responsabilidad: t?.responsabilidad ?? null,
      });
    } catch {
      this.alert.showError('Error', 'No se pudo generar el PDF');
    }
  }

  /** El borrador tal como está en pantalla, con la forma de la factura guardada. */
  private vistaPrevia(): FacturaVentaDetalle | null {
    if (!this.tercero) {
      this.alert.showWarn('Falta el cliente', 'Elija el cliente para ver la vista previa.');
      return null;
    }
    const cuenta = this.cuentasOpts.find((c) => c.value === this.cuentaBancariaId);
    const lineas: FacturaVentaLineaDto[] = this.conProducto.map((l, i) => ({
      id: i + 1,
      productoId: l.productoId,
      productoNombre: l.productoNombre ?? '',
      productoSku: l.productoSku,
      unidadAbreviatura: l.unidad,
      manejaInventario: l.manejaInventario,
      presentacionNombre: null,
      descripcion: l.descripcion.trim() || null,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
      descuentoValor: this.descuento(l),
      impuestoPorcentaje: this.esAiu ? 0 : l.impuestoPorcentaje,
      impuestoValor: this.impuesto(l),
      subtotalLinea: this.totalLinea(l),
      aiuTipo: null,
    })) as FacturaVentaLineaDto[];
    // Las líneas de A, I y U, igual que las agrega el servidor.
    this.aiuLineas.forEach((a, k) =>
      lineas.push({
        id: lineas.length + k + 1,
        productoId: null,
        productoNombre: `${a.nombre} (AIU)`,
        productoSku: null,
        unidadAbreviatura: null,
        manejaInventario: false,
        presentacionNombre: null,
        descripcion: `${a.nombre} ${a.pct}% (AIU)`,
        cantidad: 1,
        precioUnitario: a.valor,
        descuentoValor: 0,
        impuestoPorcentaje: a.ivaPct,
        impuestoValor: a.iva,
        subtotalLinea: a.valor + a.iva,
        aiuTipo: a.tipo,
      }),
    );
    return {
      ...(this.factura ?? ({} as FacturaVentaDetalle)),
      id: this.id ?? 0,
      estado: 'BORRADOR',
      clienteNombre: this.tercero.nombre,
      clienteDocumento: this.tercero.numeroDocumento,
      vendedorNombre: this.vendedoresOpts.find((v) => v.value === this.vendedorId)?.label ?? null,
      condicionPagoNombre: this.condiciones.find((c) => c.id === this.condicionPagoId)?.nombre ?? null,
      formaPago: this.formaPago,
      metodoPago: this.formaPago === 'CONTADO' ? this.metodoPago : null,
      cuentaBancariaId: this.formaPago === 'CONTADO' ? this.cuentaBancariaId : null,
      cuentaBancariaNombre: cuenta?.label ?? null,
      cuentaBancariaBanco: null,
      cuentaBancariaTipo: null,
      fechaVencimiento: aFechaLocal(this.vencimiento),
      ordenCompra: this.ordenCompra.trim() || null,
      notas: this.notas.trim() || null,
      subtotal: this.subtotal - this.descuentos,
      descuentoTotal: this.descuentos,
      impuestosTotal: this.ivas.reduce((s, i) => s + i.valor, 0) + this.aiuLineas.reduce((s, a) => s + a.iva, 0),
      total: this.total,
      cufe: null,
      qrData: null,
      numero: null,
      factusNumero: null,
      lineas,
    } as FacturaVentaDetalle;
  }

  copiar(): void {
    if (!this.id) return;
    this.confirm.confirm({
      header: 'Copiar factura',
      message:
        'Se crea un borrador nuevo con el mismo cliente, condiciones y líneas. ' +
        'El vencimiento se calcula desde hoy y la orden de compra queda vacía. ¿Continuar?',
      acceptLabel: 'Copiar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          const res = await lastValueFrom(this.service.copiar(this.id!));
          const nueva = res?.data?.id;
          this.alert.showSuccess('Copia creada', 'Quedó como borrador: revísela y emítala.');
          if (nueva) this.router.navigate(['/ventas/facturas', nueva, 'editar']);
        } catch (e: any) {
          this.alert.showError('No se pudo copiar', e?.error?.message ?? 'Intente de nuevo');
        }
      },
    });
  }

  enviarDian(): void {
    if (!this.factura) return;
    this.confirm.confirm({
      header: 'Factura electrónica',
      message: `¿Enviar la factura ${this.factura.numero} a la DIAN?`,
      acceptLabel: 'Enviar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.guardando = true;
        this.cdr.markForCheck();
        try {
          await lastValueFrom(this.service.facturaElectronica(this.factura!.id));
          this.alert.showSuccess('Enviada', 'La factura electrónica quedó registrada.');
          await this.recargar();
        } catch (e: any) {
          this.alert.showError('No se pudo enviar', e?.error?.message ?? 'Intente de nuevo');
        } finally {
          this.guardando = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  anular(): void {
    if (!this.factura) return;
    this.confirm.confirm({
      header: 'Anular factura',
      message:
        `Se anula la factura ${this.factura.numero}: el inventario vuelve a la bodega, ` +
        'sale de cartera y el asiento se reversa. ¿Continuar?',
      acceptLabel: 'Anular',
      rejectLabel: 'Cancelar',
      accept: async () => {
        this.guardando = true;
        this.cdr.markForCheck();
        try {
          const res = await lastValueFrom(this.service.anular(this.factura!.id));
          this.alert.showSuccess('Factura anulada', res?.message ?? '');
          await this.recargar();
        } catch (e: any) {
          this.alert.showError('No se pudo anular', e?.error?.message ?? 'Intente de nuevo');
        } finally {
          this.guardando = false;
          this.cdr.markForCheck();
        }
      },
    });
  }

  volver(): void {
    this.router.navigate(['/ventas/facturas']);
  }

  cop(v: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 }).format(
      v ?? 0,
    );
  }
}
