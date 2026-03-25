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

import { routes } from './app.routes';
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
        preset: Aura,
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
