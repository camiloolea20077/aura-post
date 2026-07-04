import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  LOCALE_ID,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import { routes } from './app.routes';

// ─── Tema AURA: color primario = azul de marca #2563eb ──────────────────────
const AuraBlue = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    colorScheme: {
      light: {
        primary: {
          color: '#2563eb',
          contrastColor: '#ffffff',
          hoverColor: '#1d4ed8',
          activeColor: '#1d4ed8',
        },
        highlight: {
          background: 'rgba(37, 99, 235, 0.12)',
          focusBackground: 'rgba(37, 99, 235, 0.2)',
          color: '#1d4ed8',
          focusColor: '#1d4ed8',
        },
      },
    },
  },
});
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { MessageService } from 'primeng/api';
import { GlobalInterceptor } from './core/interceptors/global.interceptor';
import {
  authInterceptor,
  DateInterceptorInterceptor,
} from './core/interceptors/';
import { provideServiceWorker } from '@angular/service-worker';

registerLocaleData(localeEsCO);
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-CO' },
    MessageService,
    provideHttpClient(
      withInterceptorsFromDi(),
      withInterceptors([authInterceptor, DateInterceptorInterceptor]),
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: AuraBlue,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GlobalInterceptor,
      multi: true,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
