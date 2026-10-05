import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, lastValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SidebarMenuGroup } from '../../shared/interfaces';
import { AuthService } from '../services/auth.service';
import { PermisosService } from '../services/permisos.service';
import { AccionPermiso, PermisosUsuario } from '../models/permisos.model';
import { filtrarMenuPorPermisos } from '../../shared/utils/modules-fiilter';

interface StateModel {
  empleadoId: number | null;
  usuarioId: number | null;
  role: string;
  windowWidth: number;
  isMobile: boolean;
  menuGroups: SidebarMenuGroup[];
  /** Permisos por perfil del usuario logueado (null = aún no cargan). */
  permisos: PermisosUsuario | null;
}

const initialState: StateModel = {
  windowWidth: 1920,
  isMobile: false,
  menuGroups: [],
  role: '',
  empleadoId: null,
  usuarioId: null,
  permisos: null,
};

@Injectable({
  providedIn: 'root',
})
export class StateStore {
  private authService = inject(AuthService);
  private permisosService = inject(PermisosService);

  private _state = signal<StateModel>(initialState);
  private cargaPermisos: Promise<PermisosUsuario | null> | null = null;

  readonly state = computed(() => this._state());
  readonly isMobile = computed(() => this._state().isMobile);
  readonly menuGroups = computed(() => this._state().menuGroups);
  readonly role = computed(() => this._state().role);
  readonly usuarioId = computed(() => this._state().usuarioId);
  readonly permisos = computed(() => this._state().permisos);

  setWindowWidth(width: number) {
    this._state.update((state) => ({
      ...state,
      windowWidth: width,
      isMobile: width < 768,
    }));
  }

  setRole(role: string) {
    this._state.update((state) => ({
      ...state,
      role,
    }));
  }

  /**
   * Arma el menú con los módulos de la empresa y los permisos del perfil del
   * usuario. Se llama al iniciar sesión y al recargar la app.
   */
  updateMenuGroups(role: string = this.role()) {
    this.cargaPermisos = null;
    forkJoin({
      modulos: this.authService.getModulos(),
      permisos: this.permisosService.mios().pipe(catchError(() => of(null))),
    }).subscribe(({ modulos, permisos }) => {
      const p = permisos?.data ?? null;
      this.cargaPermisos = Promise.resolve(p);
      this._state.update((state) => ({
        ...state,
        permisos: p,
        menuGroups: filtrarMenuPorPermisos(modulos.data, role, p),
      }));
    });
  }

  /** Los permisos del usuario; si aún no cargan, los pide (lo usa el guard de rutas). */
  asegurarPermisos(): Promise<PermisosUsuario | null> {
    const actuales = this._state().permisos;
    if (actuales) return Promise.resolve(actuales);
    if (!this.cargaPermisos) {
      this.cargaPermisos = lastValueFrom(this.permisosService.mios())
        .then((res) => {
          const p = res?.data ?? null;
          this._state.update((state) => ({ ...state, permisos: p }));
          return p;
        })
        .catch(() => null);
    }
    return this.cargaPermisos;
  }

  /**
   * ¿El usuario puede hacer la acción en el submódulo "modulo.submodulo"?
   * Mientras no cargan los permisos responde que sí: el back es quien bloquea, y
   * así un botón no parpadea apagado al abrir la pantalla.
   */
  puede(clave: string, accion: AccionPermiso | string = 'VER'): boolean {
    const p = this._state().permisos;
    if (!p) return true;
    // Acción especial (REABRIR, APROBAR…): "modulo.submodulo:CODIGO" (V192).
    if (!['VER', 'CREAR', 'EDITAR', 'ANULAR'].includes(accion)) {
      return (p.especiales ?? []).includes(`${clave}:${accion}`);
    }
    return (p.permisos[clave] ?? []).includes(accion as AccionPermiso);
  }

  setEmpleadoAndUsuarioId(
    usuarioId: number,
    rol: string,
    empleadoId: number | null,
  ) {
    this._state.update((state) => ({
      ...state,
      usuarioId,
      rol,
      empleadoId,
    }));
  }

  clearState() {
    this.cargaPermisos = null;
    this._state.set(initialState);
  }
}
