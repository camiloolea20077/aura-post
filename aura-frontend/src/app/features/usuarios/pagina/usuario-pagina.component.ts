import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SkeletonModule } from 'primeng/skeleton';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { lastValueFrom } from 'rxjs';

import {
  AccionEspecial,
  EspecialValor,
  NodoArbol,
  PerfilFila,
  Permiso,
  PermisoExcepcion,
  PermisosDeUsuario,
} from '../../../core/models/permisos.model';
import { SucursalDto } from '../../../core/models/sucursal.model';
import { TerceroTableModel } from '../../../core/models/tercero.model';
import {
  ROLES_OPTIONS,
  SucursalAsignacion,
  UsuarioModel,
} from '../../../core/models/usuario.model';
import { PermisosService } from '../../../core/services/permisos.service';
import { SucursalService } from '../../../core/services/sucursal.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { StateStore } from '../../../core/store/state';
import { AccionesEspecialesComponent } from '../../../shared/components/acciones-especiales/acciones-especiales.component';
import { MatrizPermisosComponent } from '../../../shared/components/matriz-permisos/matriz-permisos.component';
import { TerceroAutocompleteComponent } from '../../../shared/components/tercero-autocomplete/tercero-autocomplete.component';
import { PuedeDirective } from '../../../shared/directives/puede.directive';
import { AlertService } from '../../../shared/pipes/alert.service';
import { FormTerceroComponent } from '../../terceros/form/form-tercero.component';

/** Perfil de sistema que corresponde a cada tipo de usuario (espejo de PerfilesSistema.java). */
const PERFIL_DEL_ROL: Record<string, string> = {
  SUPER_ADMIN: 'ADMINISTRADOR',
  ADMIN: 'ADMINISTRADOR',
  CAJERO: 'CAJERO',
  VENDEDOR: 'VENDEDOR',
  SUPERVISOR: 'SUPERVISOR',
};

/**
 * Crear o editar un usuario en una sola página (reemplaza el diálogo y la
 * pantalla aparte de permisos). Pestañas: Datos y acceso · Sedes · Permisos ·
 * Descuentos y acciones especiales. La persona es un tercero que ya existe
 * (obligatorio): así el usuario queda relacionado con el empleado, vendedor o
 * cliente que ya es.
 */
@Component({
  selector: 'app-usuario-pagina',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    PasswordModule,
    SkeletonModule,
    TabViewModule,
    TooltipModule,
    TerceroAutocompleteComponent,
    FormTerceroComponent,
    MatrizPermisosComponent,
    AccionesEspecialesComponent,
    PuedeDirective,
  ],
  templateUrl: './usuario-pagina.component.html',
  styleUrls: ['./usuario-pagina.component.scss'],
})
export class UsuarioPaginaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usuarioService = inject(UsuarioService);
  private readonly permisosService = inject(PermisosService);
  private readonly sucursalService = inject(SucursalService);
  private readonly alert = inject(AlertService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly store = inject(StateStore);

  id: number | null = null;
  cargando = true;
  guardando = false;
  cerrando = false;
  tab = 0;
  intentoGuardar = false;

  // ── Datos y acceso ──
  terceroId: number | null = null;
  terceroLabel: string | null = null;
  tercero: { documento: string | null; email: string | null; telefono: string | null } | null = null;
  username = '';
  password = '';
  pin = '';
  rol = 'CAJERO';
  perfilId: number | null = null;
  activo = true;
  mostrarNuevoTercero = false;

  // ── Sedes ──
  sucursalesOpts: SucursalDto[] = [];
  sedes: number[] = [];
  sedeDefault: number | null = null;

  // ── Permisos, límites y especiales ──
  arbol: NodoArbol[] = [];
  catalogo: AccionEspecial[] = [];
  perfiles: PerfilFila[] = [];
  datosPermisos: PermisosDeUsuario | null = null;
  /** Lo que da el perfil elegido (para mostrar lo heredado al crear o al cambiar de perfil). */
  delPerfil: Permiso[] = [];
  perfilAccesoTotal = false;
  especialesPerfil: EspecialValor[] = [];
  excepciones: PermisoExcepcion[] = [];
  especiales: EspecialValor[] = [];
  descuentoMaxPct: number | null = null;
  rebajaPrecioMaxPct: number | null = null;

  readonly rolesOpts = ROLES_OPTIONS;

  get esNuevo(): boolean {
    return this.id === null;
  }

  get perfilesOpts(): { value: number; label: string }[] {
    return this.perfiles
      .filter((p) => p.activo)
      .map((p) => ({
        value: p.id,
        label: p.nombre + (p.accesoTotal ? ' (acceso total)' : ''),
      }));
  }

  get perfilElegido(): PerfilFila | null {
    return this.perfiles.find((p) => p.id === this.perfilId) ?? null;
  }

  /** Permisos y límites solo los toca quien administra usuarios o perfiles. */
  get puedeAjustarPermisos(): boolean {
    return (
      this.store.puede('caja.usuarios', 'EDITAR') ||
      this.store.puede('caja.perfiles', 'EDITAR')
    );
  }

  async ngOnInit(): Promise<void> {
    const param = this.route.snapshot.paramMap.get('id');
    this.id = param && param !== 'nuevo' ? Number(param) : null;
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'permisos') this.tab = 2;
    try {
      const [sucursales, perfiles, arbol, catalogo] = await Promise.all([
        lastValueFrom(this.sucursalService.getActivas()),
        lastValueFrom(this.permisosService.opciones()),
        lastValueFrom(this.permisosService.arbol()),
        lastValueFrom(this.permisosService.especiales()),
      ]);
      this.sucursalesOpts = sucursales?.data ?? [];
      this.perfiles = perfiles?.data ?? [];
      this.arbol = arbol?.data ?? [];
      this.catalogo = catalogo?.data ?? [];

      if (this.id) {
        const u = (await lastValueFrom(this.usuarioService.getById(this.id)))?.data;
        if (u) this.cargarUsuario(u);
        const d = (await lastValueFrom(this.permisosService.permisosDeUsuario(this.id)))?.data;
        this.aplicarPermisos(d ?? null);
      } else {
        this.perfilPorRol();
      }
      await this.cargarPerfil();
    } catch {
      /* el interceptor muestra el error */
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  private cargarUsuario(u: UsuarioModel): void {
    this.terceroId = u.terceroId ?? null;
    this.terceroLabel = [u.nombres, u.apellidos].filter((x) => !!x).join(' ') || null;
    this.tercero = {
      documento: u.numeroDocumento ? `${u.tipoDocumento ?? ''} ${u.numeroDocumento}`.trim() : null,
      email: u.email,
      telefono: u.telefono,
    };
    this.username = u.username;
    this.rol = u.rol;
    this.perfilId = u.perfilId ?? null;
    this.activo = u.activo;
    this.sedes = (u.sucursales ?? []).map((s) => s.sucursalId);
    this.sedeDefault =
      (u.sucursales ?? []).find((s) => s.esDefault)?.sucursalId ?? this.sedes[0] ?? null;
  }

  private aplicarPermisos(d: PermisosDeUsuario | null): void {
    this.datosPermisos = d;
    this.excepciones = d?.excepciones ?? [];
    this.especiales = d?.excepcionesEspeciales ?? [];
    this.descuentoMaxPct = d?.descuentoMaxPct ?? null;
    this.rebajaPrecioMaxPct = d?.rebajaPrecioMaxPct ?? null;
  }

  // ── Tercero ───────────────────────────────────────────────
  onTercero(t: TerceroTableModel | null): void {
    this.terceroId = t?.id ?? null;
    this.terceroLabel = t?.nombreCompleto ?? null;
    this.tercero = t
      ? {
          documento: `${t.tipoDocumento ?? ''} ${t.numeroDocumento ?? ''}`.trim(),
          email: t.email,
          telefono: t.telefono,
        }
      : null;
    // El usuario de acceso, por defecto, es el correo del tercero.
    if (this.esNuevo && !this.username && t?.email) this.username = t.email;
    this.cdr.markForCheck();
  }

  onTerceroCreado(t: any): void {
    this.mostrarNuevoTercero = false;
    if (!t?.id) return;
    const nombre =
      t.razonSocial || [t.nombres, t.apellidos].filter((x: string) => !!x).join(' ');
    this.onTercero({
      id: t.id,
      tipoDocumento: t.tipoDocumento,
      numeroDocumento: t.numeroDocumento,
      nombreCompleto: nombre,
      telefono: t.telefono ?? null,
      email: t.email ?? null,
      esCliente: !!t.esCliente,
      esProveedor: !!t.esProveedor,
      esEmpleado: !!t.esEmpleado,
      activo: true,
    });
  }

  // ── Perfil ────────────────────────────────────────────────
  /** Al crear, el perfil por defecto es el de sistema de su tipo de usuario. */
  private perfilPorRol(): void {
    const codigo = PERFIL_DEL_ROL[this.rol] ?? 'BASICO';
    this.perfilId = this.perfiles.find((p) => p.codigo === codigo)?.id ?? null;
  }

  async onRol(): Promise<void> {
    if (this.esNuevo) {
      this.perfilPorRol();
      await this.cargarPerfil();
    }
  }

  /** Lo que da el perfil elegido, para mostrar lo heredado en Permisos y Especiales. */
  async cargarPerfil(): Promise<void> {
    const p = this.perfilElegido;
    this.perfilAccesoTotal = !!p?.accesoTotal;
    this.delPerfil = [];
    this.especialesPerfil = [];
    if (p && !p.accesoTotal) {
      try {
        const d = (await lastValueFrom(this.permisosService.detalle(p.id)))?.data;
        this.delPerfil = d?.permisos ?? [];
        this.especialesPerfil = d?.especiales ?? [];
      } catch {
        /* sin permiso de ver perfiles: se muestra sin lo heredado */
      }
    }
    this.cdr.markForCheck();
  }

  // ── Sedes ─────────────────────────────────────────────────
  tieneSede(id: number): boolean {
    return this.sedes.includes(id);
  }

  toggleSede(id: number, marcada: boolean): void {
    this.sedes = marcada
      ? [...this.sedes, id]
      : this.sedes.filter((s) => s !== id);
    if (marcada && this.sedes.length === 1) this.sedeDefault = id;
    if (!marcada && this.sedeDefault === id) this.sedeDefault = this.sedes[0] ?? null;
  }

  // ── Permisos y especiales ─────────────────────────────────
  onExcepciones(e: PermisoExcepcion[]): void {
    this.excepciones = e;
  }

  onEspeciales(v: EspecialValor[]): void {
    this.especiales = v;
  }

  /** Pantallas que verá con su perfil y sus ajustes. */
  get visibles(): Set<number> {
    const s = new Set<number>();
    for (const n of this.arbol) {
      const exc = this.excepciones.find((e) => e.submoduloId === n.submoduloId);
      const del = this.delPerfil.find((p) => p.submoduloId === n.submoduloId);
      if (exc?.ver ?? (this.perfilAccesoTotal || !!del?.ver)) s.add(n.submoduloId);
    }
    return s;
  }

  /** Lo que le daría el perfil en cada acción especial: explícito o heredado de su acción base. */
  get baseEspeciales(): Record<number, boolean> {
    const r: Record<number, boolean> = {};
    for (const a of this.catalogo) {
      const explicito = this.especialesPerfil.find((e) => e.accionId === a.id);
      if (this.perfilAccesoTotal) {
        r[a.id] = true;
      } else if (explicito && explicito.permitido !== null) {
        r[a.id] = explicito.permitido;
      } else {
        const p = this.delPerfil.find((x) => x.submoduloId === a.submoduloId);
        const accion = a.heredaDe?.toLowerCase() as keyof Permiso | undefined;
        r[a.id] = !!p && !!accion && p[accion] === true;
      }
    }
    return r;
  }

  limite(v: number | null | undefined): string {
    return v === null || v === undefined ? 'sin límite' : `${v}%`;
  }

  // ── Guardar ───────────────────────────────────────────────
  private validar(): string | null {
    if (!this.terceroId) {
      this.tab = 0;
      return 'Elija el tercero del usuario (o créelo con "Nuevo tercero").';
    }
    if (this.esNuevo && !this.username.trim() && !this.tercero?.email) {
      this.tab = 0;
      return 'Escriba el usuario de acceso: el tercero no tiene correo.';
    }
    if (this.esNuevo && this.password.length < 6) {
      this.tab = 0;
      return 'La contraseña debe tener mínimo 6 caracteres.';
    }
    if (!this.esNuevo && this.password && this.password.length < 6) {
      this.tab = 0;
      return 'La contraseña nueva debe tener mínimo 6 caracteres.';
    }
    if (!this.sedes.length) {
      this.tab = 1;
      return 'Asigne al menos una sede.';
    }
    return null;
  }

  private sucursalesDto(): SucursalAsignacion[] {
    return this.sedes.map((s) => ({ sucursalId: s, esDefault: s === this.sedeDefault }));
  }

  async guardar(): Promise<void> {
    this.intentoGuardar = true;
    const error = this.validar();
    if (error) {
      this.alert.showError('Falta información', error);
      this.cdr.markForCheck();
      return;
    }
    this.guardando = true;
    this.cdr.markForCheck();
    try {
      let id = this.id;
      if (this.esNuevo) {
        const res = await lastValueFrom(
          this.usuarioService.create({
            terceroId: this.terceroId!,
            username: this.username.trim() || null,
            password: this.password,
            pinAccesoRapido: this.pin || null,
            rol: this.rol,
            perfilId: this.perfilId,
            sucursales: this.sucursalesDto(),
          }),
        );
        id = res?.data?.id ?? null;
      } else {
        const dto: any = {
          terceroId: this.terceroId,
          rol: this.rol,
          perfilId: this.perfilId,
          activo: this.activo,
          sucursales: this.sucursalesDto(),
        };
        if (this.password) dto.password = this.password;
        if (this.pin) dto.pinAccesoRapido = this.pin;
        await lastValueFrom(this.usuarioService.update(this.id!, dto));
      }

      // Permisos propios, límites y acciones especiales, en el mismo Guardar.
      if (id && this.puedeAjustarPermisos) {
        const res = await lastValueFrom(
          this.permisosService.guardarExcepciones(id, {
            excepciones: this.excepciones,
            especiales: this.especiales,
            descuentoMaxPct: this.descuentoMaxPct,
            rebajaPrecioMaxPct: this.rebajaPrecioMaxPct,
          }),
        );
        this.aplicarPermisos(res?.data ?? null);
      }

      this.alert.showSuccess(
        this.esNuevo ? 'Usuario creado' : 'Usuario actualizado',
        'Los cambios de permisos se ven al recargar la aplicación.',
      );
      if (id === this.store.usuarioId()) this.store.updateMenuGroups();
      this.password = '';
      this.pin = '';
      if (this.esNuevo && id) {
        this.router.navigate(['/admin/usuarios', id], { replaceUrl: true });
        this.id = id;
      }
    } catch (err: any) {
      this.alert.showError(
        'No se pudo guardar',
        err?.error?.message ?? err?.message ?? 'Intente de nuevo.',
      );
    } finally {
      this.guardando = false;
      this.cdr.markForCheck();
    }
  }

  async cerrarSesiones(): Promise<void> {
    if (!this.id) return;
    this.cerrando = true;
    this.cdr.markForCheck();
    try {
      await lastValueFrom(this.permisosService.cerrarSesiones(this.id));
      this.alert.showSuccess(
        'Sesiones cerradas',
        'Tendrá que volver a iniciar sesión en todos sus equipos.',
      );
    } catch {
      /* el interceptor muestra el error */
    } finally {
      this.cerrando = false;
      this.cdr.markForCheck();
    }
  }

  volver(): void {
    this.router.navigate(['/admin/usuarios']);
  }
}
