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

describe('UsuariosComponent', () => {
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

describe('UsuariosComponent, búsqueda y restricción', () => {
  let fixture: ComponentFixture<UsuariosComponent>;
  let comp: UsuariosComponent;
  let http: HttpTestingController;
  const OTRO: UsuarioAdmin = { ...BASE, id: 'u2', nombre: 'Pedro', apellido: 'Díaz', correo: 'pedro@correo.co', cuentaActiva: false };

  function crear(responder: () => void = () => http.expectOne('/api/admin/usuarios').flush([BASE, OTRO])) {
    sessionStorage.setItem('lr_sesion', JSON.stringify({ token: 't', usuario: { id: 'u1', nombre: 'Laura', correo: 'laura@correo.co', rol: 'ADMINISTRADOR' } }));
    TestBed.configureTestingModule({
      imports: [UsuariosComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UsuariosComponent);
    comp = fixture.componentInstance;
    responder();
    fixture.detectChanges();
  }

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('busca por nombre, apellido o correo', () => {
    crear();
    comp.busqueda.set('  DÍAZ ');
    expect(comp.filtrados().map((u) => u.id)).toEqual(['u2']);
    comp.busqueda.set('laura@');
    expect(comp.filtrados().map((u) => u.id)).toEqual(['u1']);
  });

  it('reconoce al administrador en sesión para que no se restrinja a sí mismo', () => {
    crear();
    expect(comp.esYo(BASE)).toBeTrue();
    expect(comp.esYo(OTRO)).toBeFalse();
  });

  it('si no carga lo dice', () => {
    crear(() => http.expectOne('/api/admin/usuarios').flush(null, { status: 500, statusText: 'Server Error' }));
    expect(comp.error()).toContain('No pudimos cargar los usuarios');
  });

  it('restringe con el motivo y lo refleja en la lista', () => {
    crear();
    comp.aRestringir.set(OTRO);
    comp.restringir('Fraude');
    const post = http.expectOne('/api/admin/usuarios/u2/restriccion');
    expect(post.request.body).toEqual({ motivo: 'Fraude' });
    post.flush(null, { status: 204, statusText: 'No Content' });
    expect(comp.usuarios().find((u) => u.id === 'u2')!.restringido).toBeTrue();
    expect(comp.aRestringir()).toBeNull();
    expect(comp.aviso()).toBe('Pedro Díaz quedó restringido y no podrá iniciar sesión.');
  });

  it('si no restringe lo dice, y sin usuario elegido no hace nada', () => {
    crear();
    comp.restringir('Fraude');
    http.expectNone('/api/admin/usuarios/u2/restriccion');

    comp.aRestringir.set(OTRO);
    comp.restringir('Fraude');
    http.expectOne('/api/admin/usuarios/u2/restriccion').flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.errorAccion()).toContain('No pudimos restringir');
    expect(comp.procesando()).toBeFalse();
  });

  it('reactiva una cuenta desactivada y avisa si falla', () => {
    crear();
    comp.reactivar(OTRO);
    http.expectOne('/api/admin/usuarios/u2/reactivacion').flush(null, { status: 204, statusText: 'No Content' });
    expect(comp.usuarios().find((u) => u.id === 'u2')!.cuentaActiva).toBeTrue();
    expect(comp.aviso()).toContain('quedó activa de nuevo');

    comp.reactivar(OTRO);
    http.expectOne('/api/admin/usuarios/u2/reactivacion').flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.errorFila()).toContain('No pudimos reactivar');
    expect(comp.procesandoId()).toBeNull();
  });
});
