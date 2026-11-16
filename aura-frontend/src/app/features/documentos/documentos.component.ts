import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  NubeArchivo,
  NubeCarpeta,
  NubeContenido,
  NubeEvento,
  NubePapelera,
  NubeUso,
  VisibilidadCarpeta,
} from '../../core/models/nube.model';
import { NubeService } from '../../core/services/nube.service';
import { StateStore } from '../../core/store/state';
import { AlertService } from '../../shared/pipes/alert.service';
import { FechaEsPipe } from '../../shared/pipes/fecha-es.pipe';
import { DestinoNube, MoverNubeComponent } from './mover-nube/mover-nube.component';
import {
  MAX_ARCHIVOS_POR_SUBIDA,
  TERMINOS_VERSION,
  diasRestantes,
  formatoBytes,
  formatoMb,
  iconoArchivo,
  opcionesCuota,
  revisarAntesDeSubir,
  textoAccion,
  tipoVista,
} from './nube-utils';
import { TerminosNubeComponent } from './terminos-nube/terminos-nube.component';
import { VistaPreviaNubeComponent } from './vista-previa-nube/vista-previa-nube.component';

const CLAVE = 'principal.documentos';

type Elemento = { tipo: 'carpeta'; item: NubeCarpeta } | { tipo: 'archivo'; item: NubeArchivo };

/**
 * Nube de documentos de la empresa (docs/PLAN_NUBE_DOCUMENTOS.md F5): carpetas,
 * archivos de máximo 1 MB, papelera de 30 días y espacio con aviso.
 *
 * La empresa sale del token: si el usuario es de la firma, solo ve la empresa
 * en la que entró. Las carpetas "Solo firma" no existen para el cliente.
 */
@Component({
  selector: 'app-documentos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    InputTextModule,
    ProgressBarModule,
    SkeletonModule,
    TagModule,
    TooltipModule,
    FechaEsPipe,
    TerminosNubeComponent,
    MoverNubeComponent,
    VistaPreviaNubeComponent,
  ],
  templateUrl: './documentos.component.html',
  styleUrls: ['./documentos.component.scss'],
})
export class DocumentosComponent implements OnInit {
  private readonly service = inject(NubeService);
  private readonly store = inject(StateStore);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly formatoBytes = formatoBytes;
  readonly formatoMb = formatoMb;
  readonly iconoArchivo = iconoArchivo;
  readonly tipoVista = tipoVista;
  readonly diasRestantes = diasRestantes;
  readonly textoAccion = textoAccion;

  readonly opcionesVisibilidad = [
    { label: 'Compartida con la empresa', value: 'COMPARTIDA' as VisibilidadCarpeta },
    { label: 'Solo la firma (papeles de trabajo)', value: 'SOLO_FIRMA' as VisibilidadCarpeta },
  ];

  cargando = true;
  uso: NubeUso | null = null;
  contenido: NubeContenido | null = null;
  carpetaId: number | null = null;
  modo: 'archivos' | 'papelera' = 'archivos';
  papelera: NubePapelera | null = null;
  ocupado = false;
  subiendo = false;
  arrastrando = false;
  aceptandoTerminos = false;

  // ── Diálogos ──
  dlgNombre = false;
  nombreModo: 'crear' | 'renombrar' = 'crear';
  nombreValor = '';
  nombreVisibilidad: VisibilidadCarpeta = 'COMPARTIDA';
  nombreObjetivo: Elemento | null = null;

  dlgMover = false;
  moverObjetivo: Elemento | null = null;

  dlgConfirmar = false;
  confirmarTitulo = '';
  confirmarMensaje = '';
  private confirmarAccion: (() => Promise<void>) | null = null;

  dlgVista = false;
  archivoVista: NubeArchivo | null = null;

  dlgHistorial = false;
  historialTitulo = '';
  eventos: NubeEvento[] = [];

  dlgEspacio = false;
  cuotaPedida: number | null = null;

  // ── Permisos (el back los vuelve a revisar en cada llamada) ──
  get puedeCrear(): boolean {
    return this.store.puede(CLAVE, 'CREAR');
  }
  get puedeEditar(): boolean {
    return this.store.puede(CLAVE, 'EDITAR');
  }
  get puedeEliminar(): boolean {
    return this.store.puede(CLAVE, 'ANULAR');
  }

  get vacio(): boolean {
    return !!this.contenido && !this.contenido.carpetas.length && !this.contenido.archivos.length;
  }

  get lleno(): boolean {
    return this.uso?.aviso === 'LLENO';
  }

  get solicitudPendiente(): boolean {
    return this.uso?.solicitud?.estado === 'PENDIENTE';
  }

  get opcionesEspacio(): { label: string; value: number }[] {
    return this.uso ? opcionesCuota(this.uso.cuotaBytes) : [];
  }

  get aceptaArchivos(): string {
    return (this.uso?.extensionesPermitidas ?? []).map((e) => '.' + e).join(',');
  }

  async ngOnInit(): Promise<void> {
    await this.store.asegurarPermisos();
    await this.cargarUso();
    if (this.uso?.terminosAceptados) await this.abrir(null);
    this.cargando = false;
    this.cdr.markForCheck();
  }

  // ── Navegación ──

  async abrir(carpetaId: number | null): Promise<void> {
    this.ocupado = true;
    this.cdr.markForCheck();
    try {
      const r = await lastValueFrom(this.service.contenido(carpetaId));
      this.contenido = r.data;
      this.carpetaId = carpetaId;
      this.modo = 'archivos';
    } catch {
      // Una carpeta que ya no existe (o no es visible): vuelve a la raíz.
      if (carpetaId != null) await this.abrir(null);
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  async refrescar(): Promise<void> {
    await Promise.all([this.cargarUso(), this.modo === 'papelera' ? this.verPapelera() : this.abrir(this.carpetaId)]);
  }

  private async cargarUso(): Promise<void> {
    try {
      this.uso = (await lastValueFrom(this.service.uso())).data;
    } catch {
      this.uso = null;
    }
    this.cdr.markForCheck();
  }

  async aceptarTerminos(): Promise<void> {
    this.aceptandoTerminos = true;
    this.cdr.markForCheck();
    try {
      this.uso = (await lastValueFrom(this.service.aceptarTerminos(TERMINOS_VERSION))).data;
      await this.abrir(null);
    } catch {
      // El interceptor ya mostró el error.
    } finally {
      this.aceptandoTerminos = false;
      this.cdr.markForCheck();
    }
  }

  // ── Subir ──

  alElegirArchivos(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    input.value = '';
    void this.subir(archivos);
  }

  alArrastrar(ev: DragEvent, encima: boolean): void {
    if (this.modo !== 'archivos' || !this.puedeCrear) return;
    ev.preventDefault();
    this.arrastrando = encima;
  }

  alSoltar(ev: DragEvent): void {
    if (this.modo !== 'archivos' || !this.puedeCrear) return;
    ev.preventDefault();
    this.arrastrando = false;
    void this.subir(Array.from(ev.dataTransfer?.files ?? []));
  }

  async subir(archivos: File[]): Promise<void> {
    if (!this.uso || !archivos.length) return;
    if (this.lleno) {
      this.alert.showWarn('Espacio lleno', 'Elimina archivos y vacía la papelera, o solicita más espacio.');
      return;
    }
    const { validos, rechazados } = revisarAntesDeSubir(archivos, this.uso);
    if (rechazados.length) this.alert.showWarn('No se subieron', rechazados.slice(0, 4).join(' · '));
    if (!validos.length) return;

    this.subiendo = true;
    this.cdr.markForCheck();
    let subidos = 0;
    try {
      for (let i = 0; i < validos.length; i += MAX_ARCHIVOS_POR_SUBIDA) {
        const lote = validos.slice(i, i + MAX_ARCHIVOS_POR_SUBIDA);
        const r = await lastValueFrom(this.service.subir(this.carpetaId, lote));
        subidos += r.data.length;
      }
    } catch {
      // El interceptor ya mostró el motivo (cuota, tipo, límite por minuto…).
    } finally {
      this.subiendo = false;
      if (subidos) this.alert.showSuccess('Listo', subidos === 1 ? 'Archivo subido' : `${subidos} archivos subidos`);
      await this.refrescar();
    }
  }

  // ── Abrir / descargar ──

  ver(a: NubeArchivo): void {
    if (!tipoVista(a)) {
      void this.descargar(a);
      return;
    }
    this.archivoVista = a;
    this.dlgVista = true;
    this.cdr.markForCheck();
  }

  async descargar(a: NubeArchivo): Promise<void> {
    try {
      const blob = await lastValueFrom(this.service.descargar(a.id));
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = a.nombre;
      link.rel = 'noopener';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // El interceptor ya mostró el error.
    }
  }

  // ── Crear / renombrar ──

  nuevaCarpeta(): void {
    this.nombreModo = 'crear';
    this.nombreValor = '';
    this.nombreVisibilidad = this.contenido?.carpeta?.visibilidad === 'SOLO_FIRMA' ? 'SOLO_FIRMA' : 'COMPARTIDA';
    this.nombreObjetivo = null;
    this.dlgNombre = true;
  }

  renombrar(e: Elemento): void {
    this.nombreModo = 'renombrar';
    this.nombreValor = e.item.nombre;
    this.nombreVisibilidad = e.tipo === 'carpeta' ? e.item.visibilidad : 'COMPARTIDA';
    this.nombreObjetivo = e;
    this.dlgNombre = true;
  }

  /** La privacidad la elige solo la firma, y dentro de una carpeta privada todo es privado. */
  get puedeElegirVisibilidad(): boolean {
    if (!this.uso?.esFirma) return false;
    if (this.nombreModo === 'crear') return this.contenido?.carpeta?.visibilidad !== 'SOLO_FIRMA';
    return this.nombreObjetivo?.tipo === 'carpeta';
  }

  async guardarNombre(): Promise<void> {
    const nombre = this.nombreValor.trim();
    if (!nombre) return;
    this.ocupado = true;
    try {
      if (this.nombreModo === 'crear') {
        await lastValueFrom(
          this.service.crearCarpeta({
            nombre,
            padreId: this.carpetaId,
            visibilidad: this.puedeElegirVisibilidad ? this.nombreVisibilidad : undefined,
          }),
        );
      } else if (this.nombreObjetivo?.tipo === 'carpeta') {
        const c = this.nombreObjetivo.item;
        const cambiaVisibilidad = this.puedeElegirVisibilidad && this.nombreVisibilidad !== c.visibilidad;
        await lastValueFrom(
          this.service.actualizarCarpeta(c.id, {
            nombre: nombre !== c.nombre ? nombre : undefined,
            visibilidad: cambiaVisibilidad ? this.nombreVisibilidad : undefined,
          }),
        );
      } else if (this.nombreObjetivo?.tipo === 'archivo') {
        await lastValueFrom(this.service.actualizarArchivo(this.nombreObjetivo.item.id, { nombre }));
      }
      this.dlgNombre = false;
      await this.abrir(this.carpetaId);
    } catch {
      // El interceptor ya mostró el error; el diálogo queda abierto para corregir.
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  // ── Mover ──

  mover(e: Elemento): void {
    this.moverObjetivo = e;
    this.dlgMover = true;
  }

  get moverOrigen(): number | null {
    const e = this.moverObjetivo;
    if (!e) return null;
    return e.tipo === 'carpeta' ? e.item.padreId : e.item.carpetaId;
  }

  async alElegirDestino(d: DestinoNube): Promise<void> {
    const e = this.moverObjetivo;
    if (!e) return;
    const dto = d.carpetaId == null ? { raiz: true } : { moverA: d.carpetaId };
    try {
      if (e.tipo === 'carpeta') await lastValueFrom(this.service.actualizarCarpeta(e.item.id, dto));
      else await lastValueFrom(this.service.actualizarArchivo(e.item.id, dto));
      this.dlgMover = false;
      this.alert.showSuccess('Listo', 'Movido');
      await this.abrir(this.carpetaId);
    } catch {
      // El interceptor ya mostró el error.
    }
  }

  // ── Eliminar / papelera ──

  eliminar(e: Elemento): void {
    const esCarpeta = e.tipo === 'carpeta';
    this.confirmar(
      esCarpeta ? 'Eliminar carpeta' : 'Eliminar archivo',
      esCarpeta
        ? `«${e.item.nombre}» y todo lo que contiene irán a la papelera. Podrás restaurarlos durante 30 días.`
        : `«${e.item.nombre}» irá a la papelera. Podrás restaurarlo durante 30 días.`,
      async () => {
        if (esCarpeta) await lastValueFrom(this.service.eliminarCarpeta(e.item.id));
        else await lastValueFrom(this.service.eliminarArchivo(e.item.id));
        this.alert.showSuccess('Listo', 'Enviado a la papelera');
        await this.refrescar();
      },
    );
  }

  async verPapelera(): Promise<void> {
    this.ocupado = true;
    this.cdr.markForCheck();
    try {
      this.papelera = (await lastValueFrom(this.service.papelera())).data;
      this.modo = 'papelera';
    } catch {
      // El interceptor ya mostró el error.
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  async volverDePapelera(): Promise<void> {
    await this.abrir(this.carpetaId);
  }

  async restaurar(tipo: 'carpeta' | 'archivo', id: number): Promise<void> {
    try {
      await lastValueFrom(this.service.restaurar(tipo, id));
      this.alert.showSuccess('Listo', 'Restaurado');
      await this.verPapelera();
    } catch {
      // El interceptor ya mostró el error.
    }
  }

  eliminarDefinitivo(tipo: 'carpeta' | 'archivo', nombre: string, id: number): void {
    this.confirmar(
      'Eliminar para siempre',
      `«${nombre}» se borrará definitivamente${tipo === 'carpeta' ? ' con todo su contenido' : ''}. No se puede deshacer.`,
      async () => {
        await lastValueFrom(this.service.eliminarDefinitivo(tipo, id));
        this.alert.showSuccess('Listo', 'Eliminado definitivamente');
        await Promise.all([this.verPapelera(), this.cargarUso()]);
      },
    );
  }

  // ── Historial ──

  async historial(a: NubeArchivo | null): Promise<void> {
    this.historialTitulo = a ? `Historial de «${a.nombre}»` : 'Bitácora de la nube';
    this.eventos = [];
    this.dlgHistorial = true;
    this.cdr.markForCheck();
    try {
      this.eventos = (await lastValueFrom(this.service.eventos(a?.id ?? null))).data;
    } catch {
      this.dlgHistorial = false;
    }
    this.cdr.markForCheck();
  }

  // ── Más espacio ──

  abrirSolicitudEspacio(): void {
    this.cuotaPedida = this.opcionesEspacio[0]?.value ?? null;
    this.dlgEspacio = true;
  }

  async solicitarEspacio(): Promise<void> {
    if (!this.cuotaPedida) return;
    this.ocupado = true;
    try {
      const r = await lastValueFrom(this.service.solicitarEspacio(this.cuotaPedida));
      this.uso = r.data;
      this.dlgEspacio = false;
      this.alert.showSuccess('Solicitud enviada', 'Aura te contactará con el valor del espacio adicional.');
    } catch {
      // El interceptor ya mostró el error.
    } finally {
      this.ocupado = false;
      this.cdr.markForCheck();
    }
  }

  // ── Confirmación (diálogo propio, nunca confirm() del navegador) ──

  private confirmar(titulo: string, mensaje: string, accion: () => Promise<void>): void {
    this.confirmarTitulo = titulo;
    this.confirmarMensaje = mensaje;
    this.confirmarAccion = accion;
    this.dlgConfirmar = true;
    this.cdr.markForCheck();
  }

  async alConfirmar(): Promise<void> {
    const accion = this.confirmarAccion;
    this.ocupado = true;
    try {
      if (accion) await accion();
      this.dlgConfirmar = false;
    } catch {
      // El interceptor ya mostró el error.
    } finally {
      this.ocupado = false;
      this.confirmarAccion = this.dlgConfirmar ? accion : null;
      this.cdr.markForCheck();
    }
  }

  carpeta(c: NubeCarpeta): Elemento {
    return { tipo: 'carpeta', item: c };
  }

  archivo(a: NubeArchivo): Elemento {
    return { tipo: 'archivo', item: a };
  }

  trackId(_: number, x: { id: number }): number {
    return x.id;
  }
}
