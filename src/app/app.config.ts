import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { TitleStrategy, provideRouter } from '@angular/router';
import { TituloPorRuta } from './core/titulo.strategy';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth.interceptor';
import { correlacionInterceptor } from './core/correlacion.interceptor';
import { versionApiInterceptor } from './core/version-api.interceptor';
import { ManejadorErroresGlobal } from './core/error-handler';

import { routes } from './app.routes';

registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: TitleStrategy, useClass: TituloPorRuta },
    provideHttpClient(withInterceptors([versionApiInterceptor, correlacionInterceptor, authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: ErrorHandler, useClass: ManejadorErroresGlobal },
  ],
};
