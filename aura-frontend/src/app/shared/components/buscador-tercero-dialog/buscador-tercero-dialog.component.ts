import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import { TerceroService } from '../../../core/services/tercero.service';
import {
  TIPO_DOCUMENTO_OPTIONS,
  TerceroPageableDto,
  TerceroTableModel,
  TipoDocumento,
} from '../../../core/models/tercero.model';

export type RolTercero = 'CLIENTE' | 'PROVEEDOR' | 'EMPLEADO' | 'BANCO';
export type EstadoTercero = 'ACTIVOS' | 'INACTIVOS' | 'TODOS';

/** Lo que el usuario escribe en el panel de criterios. */
export interface CriteriosTercero {
  texto: string;
  documento: string;
  nombre: string;
  email: string;
  telefono: string;
  tipoDocumento: TipoDocumento | null;
  tipoTercero: RolTercero | null;
  estado: EstadoTercero;
}

const CRITERIOS_VACIOS: CriteriosTercero = {
  texto: '',
  documento: '',
  nombre: '',
  email: '',
  telefono: '',
  tipoDocumento: null,
  tipoTercero: null,
  // 'TODOS' a propósito: el backend no filtra por activo, así que cualquier otro
  // valor por defecto metería al diálogo en modo local desde que abre —bajando
  // el conjunto acotado sin que nadie lo haya pedido—. Los inactivos se listan
  // con su tag y el usuario los excluye si quiere.
  estado: 'TODOS',
};

/** Quita tildes y pasa a minusculas: "GOMEZ" debe encontrarse escribiendo "gomez". */
function normalizar(v: string | null | undefined): string {
  return (v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function contiene(valor: string | null | undefined, termino: string): boolean {
  return normalizar(valor).includes(normalizar(termino));
}

/**
 * Buscador avanzado de terceros. Úsalo en TODO selector de tercero
 * —beneficiario, cliente, proveedor, empleado, banco— en vez de un
 * `<p-dropdown>` con la lista precargada.
 *
 * ## Por qué existe
 *
 * `/terceros/selector` trae la lista completa de un solo golpe con tope de 500
 * en el backend. Con 500+ terceros la lista queda truncada (el que buscas puede
 * no estar) y el `[filter]` del dropdown solo mira lo ya descargado.
 *
 * ## Los dos modos, y por qué son dos
 *
 * El backend de hoy **no acepta filtros por campo**: `POST /terceros/page` solo
 * recibe un `search` de texto (un LIKE OR sobre documento, razón social,
 * nombres, apellidos, email y teléfono). Así que:
 *
 * - **Modo servidor** (sin refinamientos): paginación real contra la base, sin
 *   topes. Es el camino normal y el que se usa casi siempre.
 * - **Modo local** (hay refinamientos que el servidor no sabe hacer): se baja
 *   un conjunto acotado, se filtra en memoria y se pagina local. El conteo que
 *   se muestra es el REAL del conjunto filtrado, y si el tope se topó se avisa
 *   en pantalla para que el usuario afine el texto. Nunca se miente con el
 *   total.
 *
 * Cuando el rol es CLIENTE, PROVEEDOR o BANCO el modo local no baja 1000 filas:
 * usa los endpoints que YA filtran por rol en el servidor (`/terceros/clientes`,
 * `/proveedores`, `/bancos`, tope 50 cada uno).
 *
 * TODO(backend): cuando `TerceroQueryRepository.listar` acepte filtros en
 * `PageableDto.params` (tipoDocumento, rol, activo, y los campos desagregados
 * nombre1/apellido1, razón comercial, tipo de contribuyente, actividad
 * económica), borrar el modo local y mandarlo todo al servidor.
 */
@Component({
  selector: 'app-buscador-tercero-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    TableModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './buscador-tercero-dialog.component.html',
  styleUrls: ['./buscador-tercero-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorTerceroDialogComponent implements OnDestroy {
  @Input() visible = false;
  @Input() header = 'Buscador avanzado de terceros';

  /**
   * Rol con el que abre el buscador (queda preseleccionado en los criterios).
   * El usuario puede cambiarlo salvo que se fije `rolFijo`.
   */
  @Input() set rol(v: RolTercero | null) {
    this.criterios.tipoTercero = v;
    this.aplicados = { ...this.criterios };
  }

  /** Bloquea el tipo de tercero: un selector de proveedor no debe dejar elegir clientes. */
  @Input() rolFijo = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() terceroSelected = new EventEmitter<TerceroTableModel>();

  // ── Criterios ───────────────────────────────────────────────────
  criterios: CriteriosTercero = { ...CRITERIOS_VACIOS };
  /** Los criterios con los que se corrió la última búsqueda. */
  private aplicados: CriteriosTercero = { ...CRITERIOS_VACIOS };
  panelAbierto = true;

  readonly tipoDocumentoOpts = TIPO_DOCUMENTO_OPTIONS;
  readonly tipoTerceroOpts: { label: string; value: RolTercero }[] = [
    { label: 'Cliente', value: 'CLIENTE' },
    { label: 'Proveedor', value: 'PROVEEDOR' },
    { label: 'Empleado', value: 'EMPLEADO' },
    { label: 'Banco', value: 'BANCO' },
  ];
  readonly estadoOpts: { label: string; value: EstadoTercero }[] = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Solo activos', value: 'ACTIVOS' },
    { label: 'Solo inactivos', value: 'INACTIVOS' },
  ];

  // ── Resultados ──────────────────────────────────────────────────
  items: TerceroTableModel[] = [];
  total = 0;
  cargando = false;
  modoLocal = false;
  truncado = false;

  /** El conjunto ya filtrado cuando se está en modo local. */
  private base: TerceroTableModel[] = [];
  private baseDesactualizada = true;

  /** Cuántas filas se bajan por tanda y cuántas como máximo, en modo local. */
  private readonly TANDA = 250;
  private readonly TOPE_LOCAL = 1000;

  /**
   * La primera fila que pinta el paginador. Va en two-way con la tabla: sin
   * esto, buscar de nuevo estando en la página 3 dejaba el paginador diciendo
   * "del 21 al 30" mientras abajo estaban las filas de la página 1.
   */
  primeraFila = 0;

  private ultimoEvento: TableLazyLoadEvent = { first: 0, rows: 10 };
  private debounce: any = null;

  constructor(
    private readonly terceroService: TerceroService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    clearTimeout(this.debounce);
  }

  // ── Panel de criterios ──────────────────────────────────────────

  togglePanel(): void {
    this.panelAbierto = !this.panelAbierto;
  }

  /** Cuántos criterios hay puestos, para el contador del encabezado del panel. */
  get criteriosActivos(): number {
    const c = this.aplicados;
    let n = 0;
    if (c.texto.trim()) n++;
    if (c.documento.trim()) n++;
    if (c.nombre.trim()) n++;
    if (c.email.trim()) n++;
    if (c.telefono.trim()) n++;
    if (c.tipoDocumento) n++;
    if (c.tipoTercero) n++;
    if (c.estado !== 'TODOS') n++;
    return n;
  }

  buscar(): void {
    this.aplicados = { ...this.criterios };
    this.baseDesactualizada = true;
    this.recargar();
  }

  limpiar(): void {
    this.criterios = {
      ...CRITERIOS_VACIOS,
      // Un buscador abierto en modo "proveedor" no debe volverse de todos al limpiar.
      tipoTercero: this.rolFijo ? this.criterios.tipoTercero : null,
    };
    this.buscar();
  }

  /** El buscador rápido de la zona de resultados escribe sobre el mismo criterio de texto. */
  onBusquedaRapida(): void {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.buscar(), 300);
  }

  // ── Carga ───────────────────────────────────────────────────────

  private recargar(): void {
    this.primeraFila = 0;
    this.loadTable({ ...this.ultimoEvento, first: 0 });
  }

  async loadTable(event: TableLazyLoadEvent): Promise<void> {
    this.ultimoEvento = event;
    const rows = event.rows ?? 10;
    const first = event.first ?? 0;

    this.cargando = true;
    this.cdr.markForCheck();

    try {
      if (this.necesitaModoLocal()) {
        this.modoLocal = true;
        // La base solo se vuelve a bajar cuando cambian los criterios, no al
        // pasar de página: paginar no debe costar una descarga nueva.
        if (this.baseDesactualizada) {
          await this.cargarBase();
          this.baseDesactualizada = false;
        }
        this.total = this.base.length;
        this.items = this.base.slice(first, first + rows);
      } else {
        this.modoLocal = false;
        this.truncado = false;
        await this.cargarPaginaServidor(first, rows);
      }
    } catch {
      this.items = [];
      this.total = 0;
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Refinamientos que el servidor no sabe hacer. El `search` del backend es uno
   * solo, así que el término más selectivo se va al servidor y todo lo demás
   * obliga a filtrar en memoria.
   */
  private necesitaModoLocal(): boolean {
    const c = this.aplicados;
    if (c.tipoDocumento || c.tipoTercero) return true;
    // El backend no filtra por activo: trae borrados fuera, activos e inactivos.
    if (c.estado !== 'TODOS') return true;
    // Dos o más términos de texto: el backend solo acepta uno.
    const textos = [c.texto, c.documento, c.nombre, c.email, c.telefono].filter(
      (t) => t.trim(),
    );
    return textos.length > 1;
  }

  /** El término que se manda al servidor: el más selectivo de los que haya. */
  private terminoServidor(): string | null {
    const c = this.aplicados;
    const t =
      c.documento.trim() ||
      c.texto.trim() ||
      c.email.trim() ||
      c.telefono.trim() ||
      c.nombre.trim();
    return t || null;
  }

  private async cargarPaginaServidor(
    first: number,
    rows: number,
  ): Promise<void> {
    const dto: TerceroPageableDto = {
      page: Math.floor(first / rows),
      rows,
      search: this.terminoServidor(),
    };
    const res = await lastValueFrom(this.terceroService.page(dto));
    this.items = res?.data?.content ?? [];
    this.total = res?.data?.totalElements ?? 0;
  }

  /** Baja el conjunto acotado y lo filtra con los criterios que el servidor no aplica. */
  private async cargarBase(): Promise<void> {
    const termino = this.terminoServidor();
    const rol = this.aplicados.tipoTercero;

    let crudos: TerceroTableModel[];
    let rolYaFiltrado = false;

    if (rol === 'CLIENTE' || rol === 'PROVEEDOR' || rol === 'BANCO') {
      // Estos SÍ filtran por rol en el servidor (tope 50). Mucho más barato que
      // bajar 1000 filas para descartar casi todas acá.
      const req =
        rol === 'CLIENTE'
          ? this.terceroService.clientes(termino ?? '')
          : rol === 'PROVEEDOR'
            ? this.terceroService.proveedores(termino ?? '')
            : this.terceroService.bancos(termino ?? '');
      const res = await lastValueFrom(req);
      crudos = res?.data ?? [];
      // El endpoint corta en 50: si vinieron 50, es probable que haya más.
      this.truncado = crudos.length >= 50;
      rolYaFiltrado = true;
    } else {
      const bajado = await this.bajarEnTandas(termino);
      crudos = bajado.filas;
      this.truncado = bajado.truncado;
    }

    this.base = crudos.filter((t) => this.pasaFiltros(t, rolYaFiltrado));
  }

  /** Pagina contra el servidor hasta juntar el tope. No es "traer todo": está acotado. */
  private async bajarEnTandas(
    termino: string | null,
  ): Promise<{ filas: TerceroTableModel[]; truncado: boolean }> {
    const filas: TerceroTableModel[] = [];
    let page = 0;
    let total = 0;

    while (filas.length < this.TOPE_LOCAL) {
      const res = await lastValueFrom(
        this.terceroService.page({ page, rows: this.TANDA, search: termino }),
      );
      const content = res?.data?.content ?? [];
      total = res?.data?.totalElements ?? 0;
      filas.push(...content);
      if (content.length < this.TANDA || filas.length >= total) break;
      page++;
    }

    return { filas, truncado: total > filas.length };
  }

  private pasaFiltros(t: TerceroTableModel, rolYaFiltrado: boolean): boolean {
    const c = this.aplicados;

    if (c.estado === 'ACTIVOS' && !t.activo) return false;
    if (c.estado === 'INACTIVOS' && t.activo) return false;
    if (c.tipoDocumento && t.tipoDocumento !== c.tipoDocumento) return false;
    if (!rolYaFiltrado && c.tipoTercero && !this.tieneRol(t, c.tipoTercero)) {
      return false;
    }

    if (c.documento.trim() && !contiene(t.numeroDocumento, c.documento)) {
      return false;
    }
    if (c.nombre.trim() && !contiene(t.nombreCompleto, c.nombre)) return false;
    if (c.email.trim() && !contiene(t.email, c.email)) return false;
    if (c.telefono.trim() && !contiene(t.telefono, c.telefono)) return false;

    // El texto libre replica el OR del backend, para que refinar con otro campo
    // no cambie lo que el texto significaba.
    if (c.texto.trim()) {
      const hit =
        contiene(t.numeroDocumento, c.texto) ||
        contiene(t.nombreCompleto, c.texto) ||
        contiene(t.email, c.texto) ||
        contiene(t.telefono, c.texto);
      if (!hit) return false;
    }

    return true;
  }

  private tieneRol(t: TerceroTableModel, rol: RolTercero): boolean {
    switch (rol) {
      case 'CLIENTE':
        return !!t.esCliente;
      case 'PROVEEDOR':
        return !!t.esProveedor;
      case 'EMPLEADO':
        return !!t.esEmpleado;
      case 'BANCO':
        return !!t.esBanco;
    }
  }

  // ── Selección y cierre ──────────────────────────────────────────

  seleccionar(item: TerceroTableModel): void {
    this.terceroSelected.emit(item);
    this.close();
  }

  close(): void {
    clearTimeout(this.debounce);
    this.criterios = {
      ...CRITERIOS_VACIOS,
      tipoTercero: this.rolFijo ? this.criterios.tipoTercero : null,
    };
    this.aplicados = { ...this.criterios };
    this.base = [];
    this.items = [];
    this.total = 0;
    this.truncado = false;
    this.baseDesactualizada = true;
    this.primeraFila = 0;
    this.visible = false;
    this.visibleChange.emit(false);
    this.cdr.markForCheck();
  }
}
