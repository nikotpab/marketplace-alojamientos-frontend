import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AccesoDenegadoComponent } from './acceso-denegado.component';

describe('AccesoDenegadoComponent', () => {
  afterEach(() => sessionStorage.clear());

  function crear() {
    TestBed.configureTestingModule({
      imports: [AccesoDenegadoComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    TestBed.createComponent(AccesoDenegadoComponent).componentInstance.volver();
    return navegar;
  }

  it('sin sesión vuelve al inicio de sesión', () => {
    expect(crear()).toHaveBeenCalledWith('/auth');
  });

  it('con sesión vuelve al inicio', () => {
    sessionStorage.setItem('lr_sesion', JSON.stringify({ token: 't', usuario: { id: 'u1', nombre: 'Ana', correo: 'ana@correo.co', rol: 'HUESPED' } }));
    expect(crear()).toHaveBeenCalledWith('/');
  });
});
