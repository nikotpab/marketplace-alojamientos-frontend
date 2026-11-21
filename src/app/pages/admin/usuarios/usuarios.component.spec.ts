import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UsuarioAdmin } from '../../../core/usuarios-admin.service';
import { UsuariosComponent } from './usuarios.component';

const BASE: UsuarioAdmin = {
  id: 'u1', nombre: 'Laura', apellido: 'Gómez', correo: 'laura@correo.co', telefono: '3001234567',
  rol: 'HUESPED', cuentaActiva: true, restringido: false, correoVerificado: true,
};

describe('UsuariosComponent (SCRUM-112)', () => {
  let fixture: ComponentFixture<UsuariosComponent>;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const boton = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto));

  function cargar(usuarios: UsuarioAdmin[]) {
    http.expectOne('/api/admin/usuarios').flush(usuarios);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UsuariosComponent);
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('levanta la restricción de un usuario restringido', () => {
    cargar([{ ...BASE, restringido: true }]);
    expect(boton('Restringir')).toBeUndefined();

    boton('Levantar restricción')!.click();
    const peticion = http.expectOne('/api/admin/usuarios/u1/restriccion');
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(raiz.textContent).toContain('ya puede volver a iniciar sesión');
    expect(raiz.querySelector('.chip-estado')!.textContent).toContain('Activo');
    expect(boton('Restringir')).toBeDefined();
  });

  it('reactiva una cuenta desactivada', () => {
    cargar([{ ...BASE, cuentaActiva: false }]);

    boton('Reactivar cuenta')!.click();
    const peticion = http.expectOne('/api/admin/usuarios/u1/reactivacion');
    expect(peticion.request.method).toBe('POST');
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(raiz.textContent).toContain('quedó activa de nuevo');
    expect(boton('Reactivar cuenta')).toBeUndefined();
  });

  it('si el backend falla, avisa y no cambia el estado', () => {
    cargar([{ ...BASE, restringido: true }]);

    boton('Levantar restricción')!.click();
    http.expectOne('/api/admin/usuarios/u1/restriccion').flush({}, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('No pudimos levantar la restricción');
    expect(raiz.querySelector('.chip-estado')!.textContent).toContain('Restringido');
  });

  it('un usuario activo no muestra acciones para revertir', () => {
    cargar([BASE]);
    expect(boton('Levantar restricción')).toBeUndefined();
    expect(boton('Reactivar cuenta')).toBeUndefined();
  });
});
