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
    let resultado: unknown;
    http.get('/api/reservas').subscribe(r => resultado = r);
    const req = backend.expectOne('/api/v1/reservas');
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toBe('/api/v1/reservas');
    req.flush([]);
    expect(resultado).toEqual([]);
  });

  it('no duplica la versión ni toca otras rutas', () => {
    let resApi: unknown, resFont: unknown;
    http.get('/api/v1/alojamientos').subscribe(r => resApi = r);
    http.get('/fonts/inter-400.woff').subscribe(r => resFont = r);
    const reqApi  = backend.expectOne('/api/v1/alojamientos');
    const reqFont = backend.expectOne('/fonts/inter-400.woff');
    expect(reqApi.request.url).toBe('/api/v1/alojamientos');
    expect(reqFont.request.url).toBe('/fonts/inter-400.woff');
    reqApi.flush({});
    reqFont.flush('');
    expect(resApi).toEqual({});
    expect(resFont).toBe('');
  });
});
