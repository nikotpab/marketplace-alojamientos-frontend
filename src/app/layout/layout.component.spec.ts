import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, discardPeriodicTasks, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService, RolUsuario } from '../core/auth.service';
import { NotificacionesService } from '../core/notificaciones.service';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  it('al salir cierra la sesión y lleva al inicio de sesión', () => {
    TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const cerrar = spyOn(TestBed.inject(AuthService), 'cerrarSesion');
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);

    TestBed.createComponent(LayoutComponent).componentInstance.salir();

    expect(cerrar).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith('/auth');
  });
});

describe('LayoutComponent según la sesión', () => {
  afterEach(() => sessionStorage.clear());

  function crear(rol: RolUsuario | null, nombre = 'ana maría ruiz') {
    sessionStorage.clear();
    if (rol) sessionStorage.setItem('lr_sesion', JSON.stringify({ token: 't', usuario: { id: 'u1', nombre, correo: 'a@a.co', rol } }));
    TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const notif = TestBed.inject(NotificacionesService);
    const cargar = spyOn(notif, 'cargar');
    const limpiar = spyOn(notif, 'limpiar');
    const fixture = TestBed.createComponent(LayoutComponent);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance, cargar, limpiar };
  }

  it('un visitante solo ve Explorar y no carga notificaciones', () => {
    const { comp, cargar, limpiar } = crear(null);
    expect(comp.enlaces().map((e) => e.ruta)).toEqual(['/buscar']);
    expect(comp.enlacesMas()).toEqual([]);
    expect(comp.etiquetaRol()).toBe('');
    expect(comp.iniciales()).toBe('');
    expect(cargar).not.toHaveBeenCalled();
    expect(limpiar).toHaveBeenCalled();
  });

  it('un huésped ve sus enlaces, su rol y sus iniciales, y carga sus notificaciones', () => {
    const { comp, cargar } = crear('HUESPED');
    expect(comp.enlaces().length).toBeGreaterThan(1);
    expect(comp.enlacesMas()).toEqual([]);
    expect(comp.etiquetaRol()).toBe('Huésped');
    expect(comp.iniciales()).toBe('AM');
    expect(cargar).toHaveBeenCalled();
  });

  it('un administrador ve también el menú Más', () => {
    const { fixture, comp } = crear('ADMINISTRADOR', 'Admin');
    expect(comp.enlacesMas().length).toBeGreaterThan(0);
    expect(comp.etiquetaRol()).toBe('Administrador');
    expect(comp.iniciales()).toBe('A');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Administrador');
  });

  it('refresca las notificaciones cada minuto mientras hay sesión', fakeAsync(() => {
    const { cargar } = crear('ANFITRION');
    cargar.calls.reset();
    tick(60_000);
    expect(cargar).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));
});
