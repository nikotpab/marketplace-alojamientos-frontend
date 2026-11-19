import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { verificarContratoInterceptor } from '../testing/contrato';
import { AlojamientosService, TAMANO_PAGINA } from './alojamientos.service';

describe('AlojamientosService', () => {
  let svc: AlojamientosService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([verificarContratoInterceptor])), provideHttpClientTesting()] });
    svc = TestBed.inject(AlojamientosService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('buscar GET /api/alojamientos con parámetros base', () => {
    svc.buscar({}).subscribe();
    const r = backend.expectOne((req) => req.url === '/api/alojamientos');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.get('pagina')).toBe('0');
    expect(r.request.params.get('tamano')).toBe(String(TAMANO_PAGINA));
    expect(r.request.params.get('orden')).toBe('relevancia');
    r.flush({ contenido: [], total: 0, pagina: 0, totalPaginas: 0 });
  });

  it('envía filtros opcionales cuando se proporcionan', () => {
    svc.buscar({ ciudad: 'Cartagena', huespedes: 3, tipo: 'CASA', pagina: 1 }).subscribe();
    const r = backend.expectOne((req) => req.url === '/api/alojamientos');
    expect(r.request.params.get('ciudad')).toBe('Cartagena');
    expect(r.request.params.get('huespedes')).toBe('3');
    expect(r.request.params.get('tipo')).toBe('CASA');
    expect(r.request.params.get('pagina')).toBe('1');
    r.flush({ contenido: [], total: 0, pagina: 1, totalPaginas: 0 });
  });

  it('envía rango de precio cuando se proporciona', () => {
    svc.buscar({ precioMin: 50000, precioMax: 300000 }).subscribe();
    const r = backend.expectOne((req) => req.url === '/api/alojamientos');
    expect(r.request.params.get('precioMin')).toBe('50000');
    expect(r.request.params.get('precioMax')).toBe('300000');
    r.flush({ contenido: [], total: 0, pagina: 0, totalPaginas: 0 });
  });

  it('envía servicios como lista separada por comas', () => {
    svc.buscar({ servicios: ['WiFi', 'Piscina'] }).subscribe();
    const r = backend.expectOne((req) => req.url === '/api/alojamientos');
    expect(r.request.params.get('servicios')).toBe('WiFi,Piscina');
    r.flush({ contenido: [], total: 0, pagina: 0, totalPaginas: 0 });
  });

  it('no envía filtros vacíos u opcionales no provistos', () => {
    svc.buscar({ ciudad: '', tipo: '' }).subscribe();
    const r = backend.expectOne((req) => req.url === '/api/alojamientos');
    expect(r.request.params.has('ciudad')).toBeFalse();
    expect(r.request.params.has('tipo')).toBeFalse();
    r.flush({ contenido: [], total: 0, pagina: 0, totalPaginas: 0 });
  });
});
