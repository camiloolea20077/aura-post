import { computed, Injectable, signal } from '@angular/core';

interface StateModel {
  windowWidth: number;
  isMobile: boolean;
}

const initialState: StateModel = {
  windowWidth: 1920,
  isMobile: false,
};

@Injectable({
  providedIn: 'root',
})
export class StateStore {
  constructor() {}

  private _state = signal<StateModel>(initialState);

  readonly state = computed(() => this._state());
  readonly isMobile = computed(() => this._state().isMobile);

  setWindowWidth(width: number) {
    this._state.update((state) => ({
      ...state,
      windowWidth: width,
      isMobile: width < 768,
    }));
  }
}
