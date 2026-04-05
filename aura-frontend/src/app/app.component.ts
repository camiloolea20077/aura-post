import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StateStore } from './core/store/state';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly stateStore = inject(StateStore);
  title = 'aura-frontend';

  constructor() {
    this.stateStore.setWindowWidth(window.innerWidth);
    window.addEventListener('resize', () => {
      this.stateStore.setWindowWidth(window.innerWidth);
    });
  }
}
