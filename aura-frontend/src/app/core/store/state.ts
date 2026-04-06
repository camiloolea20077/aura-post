import { computed, inject, Injectable, signal } from '@angular/core';
import { SidebarMenuGroup } from '../../shared/interfaces';
import { AuthService } from '../services/auth.service';
import { filtrarMenuPorPermisos } from '../../shared/utils/modules-fiilter';

interface StateModel {
  empleadoId: number | null;
  usuarioId: number | null;
  role: string;
  windowWidth: number;
  isMobile: boolean;
  menuGroups: SidebarMenuGroup[];
}

const initialState: StateModel = {
  windowWidth: 1920,
  isMobile: false,
  menuGroups: [],
  role: '',
  empleadoId: null,
  usuarioId: null,
};

@Injectable({
  providedIn: 'root',
})
export class StateStore {
  private authService = inject(AuthService);

  private _state = signal<StateModel>(initialState);

  readonly state = computed(() => this._state());
  readonly isMobile = computed(() => this._state().isMobile);
  readonly menuGroups = computed(() => this._state().menuGroups);
  readonly role = computed(() => this._state().role);
  readonly usuarioId = computed(() => this._state().usuarioId);

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

  updateMenuGroups(role: string = this.role()) {
    this.authService.getModulos().subscribe((res) => {
      this._state.update((state) => ({
        ...state,
        menuGroups: filtrarMenuPorPermisos(res.data, role),
      }));
    });
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
    this._state.set(initialState);
  }
}
