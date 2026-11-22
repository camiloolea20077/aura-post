import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { Observable, firstValueFrom } from 'rxjs';

import { TecnicoDto } from '../../../core/models/comision.model';
import { ProductoTableModel } from '../../../core/models/producto.model';
import {
  AbonoServicio,
  ClienteRapidoServicio,
  ConfigServicioTecnico,
  EstadoOrdenServicio,
  FotoServicio,
  GuardarItemServicio,
  GuardarOrdenServicio,
  MomentoFoto,
  OrdenServicioDetalle,
} from '../../../core/models/servicio-tecnico.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import { ComisionService } from '../../../core/services/comision.service';
import { EmpresaConfig, EmpresaService } from '../../../core/services/empresa.service';
import { ServicioTecnicoPdfService } from '../../../core/services/servicio-tecnico-pdf.service';
import { EnviarCorreoComponent } from '../../../shared/components/enviar-correo/enviar-correo.component';
import { ArchivoAdjunto } from '../../../shared/utils/archivo-adjunto';
import { PdfAdjunto } from '../../../shared/utils/pdf-adjunto';
import { AbonoDialogComponent } from '../pago/abono-dialog.component';
import { EntregarDialogComponent } from '../pago/entregar-dialog.component';
import { ProductoService } from '../../../core/services/producto.service';
import { ServicioTecnicoService } from '../../../core/services/servicio-tecnico.service';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { AlertService } from '../../../shared/pipes/alert.service';
import { aDate, aFechaLocal } from '../../../shared/utils/fecha.util';
import { ResponseModel } from '../../../shared/utils/responde.models';
import {
  ACCESORIOS,
  ESTADOS_SERVICIO,
  ESTADO_FISICO,
  RECORRIDO,
  TIPOS_EQUIPO,
  TIPOS_ITEM,
  comprimirFoto,
  diasEnTaller,
  errorImei,
  etiquetaEquipo,
  iconoEquipo,
  ordenVacia,
  pasoDelRecorrido,
  textoDias,
  tonoEstado,
} from '../servicio-tecnico.util';

/** Foto ya cargada para mostrar (URL local del blob, nunca una URL pública). */
interface FotoVista {
  foto: FotoServicio;
  url: string | null;
}

/** Foto elegida antes de guardar la orden nueva: se sube después de crearla. */
interface FotoPendiente {
  blob: Blob;
  nombre: string;
  url: string;
}

const MAX_FOTOS = 12;

@Component({
  selector: 'app-orden-servicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    TabViewModule,
    TextareaModule,
    TooltipModule,
    TerceroAutocompleteComponent,
    PuedeDirective,
    RouterLink,
    AbonoDialogComponent,
    EntregarDialogComponent,
    EnviarCorreoComponent,
  ],
  templateUrl: './orden-servicio.component.html',
  styleUrls: ['./orden-servicio.component.scss'],
})
export class OrdenServicioComponent implements OnInit, OnDestroy {
  readonly estados = ESTADOS_SERVICIO;
  readonly tiposEquipo = TIPOS_EQUIPO;
  readonly tiposItem = TIPOS_ITEM;
  readonly accesorios = ACCESORIOS;
  readonly estadoFisico = ESTADO_FISICO;
  readonly iconoEquipo = iconoEquipo;
  readonly etiquetaEquipo = etiquetaEquipo;
  readonly tono = tonoEstado;
  readonly recorrido = RECORRIDO;
  readonly textoDias = textoDias;
  readonly maxFotos = MAX_FOTOS;

  readonly prioridadOpts = [
    { label: 'Normal', value: 'NORMAL' },
    { label: 'Urgente', value: 'URGENTE' },
  ];
  readonly enciendeOpts = [
    { label: 'Sí enciende', value: true },
    { label: 'No enciende', value: false },
    { label: 'No se sabe', value: null },
  ];
  readonly momentoOpts: { label: string; value: MomentoFoto }[] = [
    { label: 'Al recibir', value: 'RECIBIDO' },
    { label: 'Durante la reparación', value: 'REPARACION' },
    { label: 'Al entregar', value: 'ENTREGA' },
  ];
  readonly tipoDocOpts = [
    { label: 'Cédula de ciudadanía', value: 'CC' },
    { label: 'Cédula de extranjería', value: 'CE' },
    { label: 'NIT', value: 'NIT' },
    { label: 'Pasaporte', value: 'PA' },
    { label: 'PPT', value: 'PPT' },
    { label: 'Tarjeta de identidad', value: 'TI' },
  ];

  id: number | null = null;
  orden: OrdenServicioDetalle | null = null;
  form: GuardarOrdenServicio = ordenVacia();
  /** El datepicker necesita Date; al guardar se pasa a "yyyy-MM-dd". */
  fechaEstimada: Date | null = null;
  readonly hoy = new Date();
  clienteLabel: string | null = null;
  clienteTelefono: string | null = null;
  clienteEmail: string | null = null;

  tab = 0;
  cargando = false;
  guardando = false;
  intentoGuardar = false;
  tecnicoOpts: { label: string; value: number | null }[] = [{ label: 'Sin asignar', value: null }];

  // ── Fotos ──
  fotos: FotoVista[] = [];
  pendientes: FotoPendiente[] = [];
  momentoFoto: MomentoFoto = 'RECIBIDO';
  subiendoFotos = false;
  fotoGrande: string | null = null;

  // ── Repuestos y mano de obra ──
  item: GuardarItemServicio = this.itemVacio();
  productoSel: ProductoTableModel | null = null;
  productoSugerencias: ProductoTableModel[] = [];
  /** SKU del repuesto elegido, para mostrarlo en la caja fija. */
  productoSku: string | null = null;
  /** Repuesto comprado afuera: se escribe a mano en vez de buscarlo. */
  repuestoLibre = false;
  agregandoItem = false;

  // ── Estado y notas ──
  dlgEstado = false;
  nuevoEstado: EstadoOrdenServicio | null = null;
  notaEstado = '';
  cambiandoEstado = false;
  nota = '';
  guardandoNota = false;

  // ── Abonos, entrega, documentos ──
  dlgAbono = false;
  dlgEntregar = false;
  dlgCorreo = false;
  private empresa: EmpresaConfig | null = null;
  private config: ConfigServicioTecnico | null = null;

  // ── Cliente rápido ──
  dlgCliente = false;
  cliente: ClienteRapidoServicio = this.clienteVacio();
  creandoCliente = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly servicio: ServicioTecnicoService,
    private readonly comisiones: ComisionService,
    private readonly productos: ProductoService,
    private readonly alert: AlertService,
    private readonly pdf: ServicioTecnicoPdfService,
    private readonly empresas: EmpresaService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.comisiones.listTecnicos().subscribe({
      next: (r) => {
        this.tecnicoOpts = [
          { label: 'Sin asignar', value: null },
          ...(r.data ?? []).map((t: TecnicoDto) => ({ label: t.nombreCompleto, value: t.id })),
        ];
        this.cdr.markForCheck();
      },
    });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.id = id;
      this.cargar();
    } else {
      this.servicio.config().subscribe({
        next: (r) => {
          this.form.garantiaDias = r.data?.garantiaDias ?? null;
          this.cdr.markForCheck();
        },
      });
    }
  }

  ngOnDestroy(): void {
    this.liberarFotos();
    this.pendientes.forEach((p) => URL.revokeObjectURL(p.url));
  }

  get esNueva(): boolean {
    return this.id == null;
  }

  get editable(): boolean {
    return this.esNueva || !!this.orden?.editable;
  }

  get errorImei1(): string | null {
    return errorImei(this.form.equipo.imei);
  }

  get errorImei2(): string | null {
    return errorImei(this.form.equipo.imei2);
  }

  /** Paso del recorrido en el que va la orden (-1 = cancelada). */
  get pasoActual(): number {
    return this.orden ? pasoDelRecorrido(this.orden.estado) : 0;
  }

  /** Si la orden está en pausa dentro de su paso, por qué. */
  get pausa(): string | null {
    switch (this.orden?.estado) {
      case 'ESPERANDO_APROBACION':
        return 'Esperando aprobación';
      case 'ESPERANDO_REPUESTO':
        return 'Esperando repuesto';
      case 'NO_REPARADO':
        return 'No se reparó';
      default:
        return null;
    }
  }

  get diasOrden(): number {
    return diasEnTaller(this.orden?.fechaRecibido, this.orden?.fechaEntregado);
  }

  /** Última vez que la orden llegó a ese paso (del historial). */
  fechaPaso(estado: EstadoOrdenServicio): string | null {
    const h = this.orden?.historial.find((x) => x.tipo === 'ESTADO' && x.estadoNuevo === estado);
    return h?.createdAt ?? null;
  }

  get totalFotos(): number {
    return this.fotos.length + this.pendientes.length;
  }

  volver(): void {
    this.router.navigate(['/servicio-tecnico/ordenes']);
  }

  // ── Carga y guardado ─────────────────────────────────────────────

  private cargar(): void {
    this.cargando = true;
    this.servicio.obtener(this.id!).subscribe({
      next: (r) => this.aplicar(r.data),
      error: (err) => {
        this.cargando = false;
        this.alert.showError('Orden de servicio', err?.error?.message ?? 'No se encontró la orden.');
        this.volver();
      },
    });
  }

  /** Pinta la orden que devolvió el servidor (todas las acciones devuelven la orden completa). */
  private aplicar(o: OrdenServicioDetalle): void {
    const fotosAntes = this.fotos.map((f) => f.foto.id).join(',');
    this.orden = o;
    this.form = {
      clienteId: o.clienteId,
      contactoTelefono: o.contactoTelefono,
      contactoEmail: o.contactoEmail,
      tecnicoId: o.tecnicoId,
      prioridad: o.prioridad,
      fechaEstimada: o.fechaEstimada,
      diagnostico: o.diagnostico,
      trabajoRealizado: o.trabajoRealizado,
      observaciones: o.observaciones,
      garantiaDias: o.garantiaDias,
      equipo: o.equipo
        ? { ...o.equipo, accesorios: [...o.equipo.accesorios], estadoFisico: [...o.equipo.estadoFisico] }
        : ordenVacia().equipo,
    };
    this.fechaEstimada = aDate(o.fechaEstimada);
    this.clienteLabel = o.clienteNombre;
    this.clienteTelefono = o.clienteTelefono;
    this.clienteEmail = o.clienteEmail;
    this.cargando = false;
    if (o.fotos.map((f) => f.id).join(',') !== fotosAntes) this.cargarFotos(o);
    this.cdr.markForCheck();
  }

  guardar(): void {
    this.intentoGuardar = true;
    const falta = this.validar();
    if (falta) {
      this.alert.showWarn('Revise la orden', falta);
      this.cdr.markForCheck();
      return;
    }
    const dto: GuardarOrdenServicio = { ...this.form, fechaEstimada: aFechaLocal(this.fechaEstimada) };
    this.guardando = true;
    const peticion = this.esNueva ? this.servicio.crear(dto) : this.servicio.actualizar(this.id!, dto);
    peticion.subscribe({
      next: async (r) => {
        if (this.esNueva) {
          this.id = r.data.id;
          this.aplicar(r.data);
          await this.subirPendientes();
          this.guardando = false;
          this.alert.showSuccess('Equipo recibido', `Orden ${r.data.codigo} creada.`);
          this.router.navigate(['/servicio-tecnico/ordenes', r.data.id], { replaceUrl: true });
        } else {
          this.guardando = false;
          this.aplicar(r.data);
          this.alert.showSuccess('Orden de servicio', 'Cambios guardados.');
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.guardando = false;
        this.alert.showError('No se pudo guardar', err?.error?.message ?? 'Revise los datos e intente de nuevo.');
        this.cdr.markForCheck();
      },
    });
  }

  /** Lo que falta para poder guardar; null si está completo. */
  private validar(): string | null {
    const e = this.form.equipo;
    if (!this.form.clienteId) {
      this.tab = 0;
      return 'Seleccione o cree el cliente.';
    }
    if (!e.marca?.trim() || !e.modelo?.trim()) {
      this.tab = 0;
      return 'Escriba la marca y el modelo del equipo.';
    }
    if (this.errorImei1 || this.errorImei2) {
      this.tab = 0;
      return 'Revise el IMEI: ' + (this.errorImei1 ?? this.errorImei2);
    }
    if (!e.problemasReportados?.trim()) {
      this.tab = 0;
      return 'Describa el problema que reporta el cliente.';
    }
    return null;
  }

  onCliente(t: TerceroTableModel | null): void {
    this.clienteLabel = t?.nombreCompleto ?? null;
    this.clienteTelefono = t?.telefono ?? null;
    this.clienteEmail = t?.email ?? null;
    this.cdr.markForCheck();
  }

  alternar(lista: string[], valor: string): void {
    if (!this.editable) return;
    const i = lista.indexOf(valor);
    if (i >= 0) lista.splice(i, 1);
    else lista.push(valor);
  }

  // ── Cliente rápido ───────────────────────────────────────────────

  abrirCliente(): void {
    this.cliente = this.clienteVacio();
    this.dlgCliente = true;
  }

  crearCliente(): void {
    const c = this.cliente;
    if (!c.numeroDocumento?.trim() || !c.nombres?.trim() || !c.telefono?.trim()) {
      this.alert.showWarn('Cliente nuevo', 'Documento, nombre y teléfono son obligatorios.');
      return;
    }
    this.creandoCliente = true;
    this.servicio.crearCliente({ ...c, apellidos: c.apellidos?.trim() || null, email: c.email?.trim() || null }).subscribe({
      next: (r) => {
        this.form.clienteId = r.data.id;
        this.clienteLabel = r.data.nombreCompleto;
        this.clienteTelefono = r.data.telefono;
        this.clienteEmail = r.data.email;
        this.creandoCliente = false;
        this.dlgCliente = false;
        this.alert.showSuccess('Cliente creado', r.data.nombreCompleto);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.creandoCliente = false;
        this.alert.showError('No se pudo crear el cliente', err?.error?.message ?? 'Intente de nuevo.');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Fotos ────────────────────────────────────────────────────────

  async onFotos(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    const cupo = MAX_FOTOS - this.totalFotos;
    if (files.length > cupo) this.alert.showWarn('Fotos', `Máximo ${MAX_FOTOS} fotos por orden: se toman las primeras ${cupo}.`);
    const elegidas = files.slice(0, Math.max(0, cupo)).filter((f) => f.type.startsWith('image/'));
    if (!elegidas.length) return;

    this.subiendoFotos = true;
    this.cdr.markForCheck();
    const comprimidas = await Promise.all(elegidas.map((f) => comprimirFoto(f)));
    if (this.esNueva) {
      // Aún no hay orden: se suben al guardar.
      this.pendientes = [
        ...this.pendientes,
        ...comprimidas.map((c) => ({ ...c, url: URL.createObjectURL(c.blob) })),
      ];
    } else {
      for (const c of comprimidas) await this.subirUna(c.blob, c.nombre);
    }
    this.subiendoFotos = false;
    this.cdr.markForCheck();
  }

  quitarPendiente(p: FotoPendiente): void {
    URL.revokeObjectURL(p.url);
    this.pendientes = this.pendientes.filter((x) => x !== p);
  }

  eliminarFoto(f: FotoVista): void {
    if (!this.id || !confirm('¿Eliminar esta foto?')) return;
    this.servicio.eliminarFoto(this.id, f.foto.id).subscribe({
      next: (r) => this.aplicar(r.data),
      error: (err) => this.alert.showError('Fotos', err?.error?.message ?? 'No se pudo eliminar la foto.'),
    });
  }

  verFoto(url: string | null): void {
    this.fotoGrande = url;
  }

  etiquetaMomento(m: MomentoFoto): string {
    return this.momentoOpts.find((o) => o.value === m)?.label ?? m;
  }

  private async subirPendientes(): Promise<void> {
    const lista = [...this.pendientes];
    this.pendientes = [];
    for (const p of lista) {
      await this.subirUna(p.blob, p.nombre);
      URL.revokeObjectURL(p.url);
    }
  }

  private async subirUna(blob: Blob, nombre: string): Promise<void> {
    try {
      const r = await firstValueFrom(this.servicio.subirFoto(this.id!, blob, nombre, this.momentoFoto));
      this.aplicar(r.data);
    } catch (err: any) {
      this.alert.showError('Foto no subida', `${nombre}: ${err?.error?.message ?? 'intente de nuevo.'}`);
    }
  }

  /** Descarga las fotos por el backend (vienen cifradas de la nube) y arma URLs locales. */
  private cargarFotos(o: OrdenServicioDetalle): void {
    this.liberarFotos();
    this.fotos = o.fotos.map((foto) => ({ foto, url: null }));
    for (const v of this.fotos) {
      this.servicio.foto(o.id, v.foto.id).subscribe({
        next: (blob) => {
          v.url = URL.createObjectURL(blob);
          this.fotos = [...this.fotos];
          this.cdr.markForCheck();
        },
      });
    }
  }

  private liberarFotos(): void {
    this.fotos.forEach((f) => f.url && URL.revokeObjectURL(f.url));
    this.fotos = [];
  }

  // ── Repuestos y mano de obra ─────────────────────────────────────

  buscarProducto(e: AutoCompleteCompleteEvent): void {
    this.productos.search(e.query).subscribe({
      next: (r) => {
        this.productoSugerencias = r.data ?? [];
        this.cdr.markForCheck();
      },
      error: () => (this.productoSugerencias = []),
    });
  }

  onProducto(e: AutoCompleteSelectEvent): void {
    const p = e.value as ProductoTableModel;
    this.item.productoId = p.id;
    this.item.descripcion = p.nombre;
    this.item.valorUnitario = p.precio ?? 0;
    this.item.tipo = 'REPUESTO';
    this.productoSku = p.sku ?? null;
    this.cdr.markForCheck();
  }

  /** Quita el repuesto elegido y vuelve al buscador. */
  quitarProducto(): void {
    this.productoSel = null;
    this.productoSku = null;
    this.item.productoId = null;
    this.item.descripcion = '';
    this.item.valorUnitario = 0;
  }

  /** Al cambiar de tipo, la columna vuelve a su control limpio. */
  onTipoItem(): void {
    this.quitarProducto();
    this.repuestoLibre = false;
  }

  /** Repuesto comprado afuera (texto) ↔ buscar en el inventario. */
  alternarLibre(): void {
    this.quitarProducto();
    this.repuestoLibre = !this.repuestoLibre;
  }

  agregarItem(): void {
    const i = this.item;
    if (!i.descripcion?.trim()) {
      this.alert.showWarn('Línea', 'Escriba la descripción o elija un producto.');
      return;
    }
    if (!(i.cantidad > 0)) {
      this.alert.showWarn('Línea', 'La cantidad debe ser mayor que cero.');
      return;
    }
    this.agregandoItem = true;
    this.servicio.agregarItem(this.id!, { ...i, descripcion: i.descripcion.trim(), valorUnitario: i.valorUnitario ?? 0 }).subscribe({
      next: (r) => {
        this.agregandoItem = false;
        this.item = this.itemVacio();
        this.productoSel = null;
        this.productoSku = null;
        this.repuestoLibre = false;
        this.aplicar(r.data);
      },
      error: (err) => {
        this.agregandoItem = false;
        this.alert.showError('No se pudo agregar', err?.error?.message ?? 'Intente de nuevo.');
        this.cdr.markForCheck();
      },
    });
  }

  eliminarItem(itemId: number): void {
    this.ejecutar(this.servicio.eliminarItem(this.id!, itemId), 'No se pudo quitar la línea');
  }

  etiquetaItem(t: string): string {
    return this.tiposItem.find((x) => x.value === t)?.label ?? t;
  }

  // ── Estados y notas ──────────────────────────────────────────────

  abrirEstado(sugerido: EstadoOrdenServicio | null = null): void {
    if (sugerido === 'ENTREGADO') {
      this.dlgEntregar = true;
      return;
    }
    this.nuevoEstado = sugerido;
    this.notaEstado = '';
    this.dlgEstado = true;
  }

  get estadoOpts(): { label: string; value: EstadoOrdenServicio }[] {
    return (this.orden?.estadosPermitidos ?? [])
      .filter((e) => e !== 'ENTREGADO')
      .map((e) => ({ label: this.estados[e].label, value: e }));
  }

  /** Siguiente paso natural para el botón rápido. */
  get siguiente(): EstadoOrdenServicio | null {
    const sig: Partial<Record<EstadoOrdenServicio, EstadoOrdenServicio>> = {
      RECIBIDO: 'EN_DIAGNOSTICO',
      EN_DIAGNOSTICO: 'EN_REPARACION',
      ESPERANDO_APROBACION: 'EN_REPARACION',
      ESPERANDO_REPUESTO: 'EN_REPARACION',
      EN_REPARACION: 'LISTO',
      LISTO: 'ENTREGADO',
      NO_REPARADO: 'ENTREGADO',
    };
    const s = this.orden ? sig[this.orden.estado] : undefined;
    return s && this.orden!.estadosPermitidos.includes(s) ? s : null;
  }

  cambiarEstado(): void {
    if (!this.nuevoEstado) return;
    if (this.nuevoEstado === 'CANCELADO' && !this.notaEstado.trim()) {
      this.alert.showWarn('Cancelar orden', 'Escriba el motivo de la cancelación.');
      return;
    }
    this.cambiandoEstado = true;
    this.servicio.cambiarEstado(this.id!, this.nuevoEstado, this.notaEstado.trim() || null).subscribe({
      next: (r) => {
        this.cambiandoEstado = false;
        this.dlgEstado = false;
        this.aplicar(r.data);
        this.alert.showSuccess('Estado actualizado', this.estados[r.data.estado].label);
      },
      error: (err) => {
        this.cambiandoEstado = false;
        this.alert.showError('No se pudo cambiar el estado', err?.error?.message ?? 'Intente de nuevo.');
        this.cdr.markForCheck();
      },
    });
  }

  agregarNota(): void {
    if (!this.nota.trim()) return;
    this.guardandoNota = true;
    this.servicio.agregarNota(this.id!, this.nota.trim()).subscribe({
      next: (r) => {
        this.guardandoNota = false;
        this.nota = '';
        this.aplicar(r.data);
      },
      error: (err) => {
        this.guardandoNota = false;
        this.alert.showError('No se pudo guardar la nota', err?.error?.message ?? 'Intente de nuevo.');
        this.cdr.markForCheck();
      },
    });
  }

  get puedeEntregar(): boolean {
    return !!this.orden?.estadosPermitidos.includes('ENTREGADO');
  }

  get abonosActivos(): AbonoServicio[] {
    return (this.orden?.abonos ?? []).filter((a) => a.estado === 'ACTIVO');
  }

  // ── Abonos y entrega ─────────────────────────────────────────────

  onActualizada(o: OrdenServicioDetalle): void {
    this.aplicar(o);
  }

  anularAbono(a: AbonoServicio): void {
    const motivo = prompt(`¿Por qué se anula el abono de ${a.monto.toLocaleString('es-CO')} (${a.reciboNumero ?? ''})?`);
    if (!motivo || !motivo.trim()) return;
    this.ejecutar(this.servicio.anularAbono(this.id!, a.id, motivo.trim()), 'No se pudo anular el abono');
  }

  // ── PDF, etiqueta, correo y enlace ───────────────────────────────

  async descargarPdf(): Promise<void> {
    if (!this.orden) return;
    try {
      await this.cargarEmpresa();
      await this.pdf.descargar(this.orden, this.empresa!, this.config, await this.fotosDataUrl());
    } catch (err: any) {
      this.alert.showError('PDF', err?.message ?? 'No se pudo generar el PDF.');
    }
  }

  async imprimirEtiqueta(): Promise<void> {
    if (!this.orden) return;
    await this.cargarEmpresa();
    this.pdf.etiqueta(this.orden, this.empresa!);
  }

  /** Para el componente de correo: el PDF de la orden. */
  readonly adjuntoCorreo = async (): Promise<PdfAdjunto> => {
    await this.cargarEmpresa();
    return this.pdf.adjunto(this.orden!, this.empresa!, this.config, await this.fotosDataUrl());
  };

  /** Las fotos del equipo van adjuntas (se pueden quitar antes de enviar). */
  readonly fotosCorreo = async (): Promise<ArchivoAdjunto[]> => {
    const out: ArchivoAdjunto[] = [];
    for (const f of this.fotos.slice(0, 4)) {
      if (!f.url) continue;
      const blob = await (await fetch(f.url)).blob();
      const data = await this.aDataUrl(blob);
      out.push({ nombre: f.foto.nombre, base64: data.substring(data.indexOf(',') + 1), tamano: blob.size });
    }
    return out;
  };

  get enlace(): string | null {
    return this.orden ? this.pdf.enlacePublico(this.orden) : null;
  }

  async copiarEnlace(): Promise<void> {
    const e = this.enlace;
    if (!e) return;
    try {
      await navigator.clipboard.writeText(e);
      this.alert.showSuccess('Enlace copiado', 'Envíeselo al cliente por WhatsApp para que consulte su equipo.');
    } catch {
      prompt('Copie el enlace:', e);
    }
  }

  whatsapp(): void {
    const e = this.enlace;
    if (!e || !this.orden) return;
    const tel = (this.orden.contactoTelefono || this.orden.clienteTelefono || '').replace(/\D/g, '');
    const numero = tel.length === 10 ? '57' + tel : tel;
    const texto = `Hola, puede consultar el estado de su equipo (orden ${this.orden.codigo}) aquí: ${e}`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank');
  }

  private async cargarEmpresa(): Promise<void> {
    if (!this.empresa) this.empresa = (await firstValueFrom(this.empresas.getConfig())).data ?? {};
    if (!this.config) {
      try {
        this.config = (await firstValueFrom(this.servicio.config())).data;
      } catch {
        this.config = null;
      }
    }
  }

  private async fotosDataUrl(): Promise<string[]> {
    const out: string[] = [];
    for (const f of this.fotos.slice(0, 4)) {
      if (!f.url) continue;
      out.push(await this.aDataUrl(await (await fetch(f.url)).blob()));
    }
    return out;
  }

  private aDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  // ── Apoyo ────────────────────────────────────────────────────────

  private ejecutar(peticion: Observable<ResponseModel<OrdenServicioDetalle>>, error: string): void {
    peticion.subscribe({
      next: (r) => this.aplicar(r.data),
      error: (err) => {
        this.alert.showError(error, err?.error?.message ?? 'Intente de nuevo.');
        this.cdr.markForCheck();
      },
    });
  }

  private itemVacio(): GuardarItemServicio {
    return { tipo: 'REPUESTO', productoId: null, descripcion: '', cantidad: 1, valorUnitario: 0 };
  }

  private clienteVacio(): ClienteRapidoServicio {
    return { tipoDocumento: 'CC', numeroDocumento: '', nombres: '', apellidos: null, telefono: '', email: null };
  }
}
