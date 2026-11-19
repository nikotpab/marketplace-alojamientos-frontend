import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let cerrarSesion: jasmine.Spy;
  let navigateByUrl: jasmine.Spy;
  let tokenSignal: WritableSignal<string | null>;

  beforeEach(() => {
    tokenSignal = signal<string | null>(null);
    cerrarSesion = jasmine.createSpy('cerrarSesion');
    navigateByUrl = jasmine.createSpy('navigateByUrl');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { token: tokenSignal, cerrarSesion } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('con token adjunta Authorization: Bearer', () => {
    tokenSignal.set('abc123');
    http.get('/api/reservas').subscribe();
    const req = backend.expectOne('/api/reservas');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
    req.flush({});
  });

  it('sin token no incluye el encabezado Authorization', () => {
    http.get('/api/reservas').subscribe();
    const req = backend.expectOne('/api/reservas');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('403 fuera de /auth/ navega a /acceso-denegado y relanza el error', () => {
    let err: { status: number } | undefined;
    http.get('/api/reservas').subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/reservas').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(navigateByUrl).toHaveBeenCalledWith('/acceso-denegado');
    expect(navigateByUrl).toHaveBeenCalledTimes(1);
    expect(err?.status).toBe(403);
  });

  it('401 fuera de /auth/ cierra sesión, navega a /auth y relanza el error', () => {
    let err: { status: number } | undefined;
    http.get('/api/reservas').subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/reservas').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
    expect(navigateByUrl).toHaveBeenCalledWith('/auth');
    expect(navigateByUrl).toHaveBeenCalledTimes(1);
    expect(err?.status).toBe(401);
  });

  it('401 y 403 en rutas de /auth/ no cierran sesión ni navegan y relanza el error', () => {
    let err401: { status: number } | undefined;
    let err403: { status: number } | undefined;
    http.get('/api/auth/login').subscribe({ error: (e) => (err401 = e) });
    backend.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });
    http.get('/api/auth/login').subscribe({ error: (e) => (err403 = e) });
    backend.expectOne('/api/auth/login').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(cerrarSesion).not.toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(err401?.status).toBe(401);
    expect(err403?.status).toBe(403);
  });
});
