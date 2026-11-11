import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { versionApiInterceptor } from './version-api.interceptor';

describe('versionApiInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([versionApiInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('agrega la versión a las rutas de la API', () => {
    http.get('/api/reservas').subscribe();
    backend.expectOne('/api/v1/reservas').flush([]);
  });

  it('no duplica la versión ni toca otras rutas', () => {
    http.get('/api/v1/alojamientos').subscribe();
    http.get('/fonts/inter-400.woff').subscribe();
    backend.expectOne('/api/v1/alojamientos').flush({});
    backend.expectOne('/fonts/inter-400.woff').flush('');
  });
});
