import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '../core/auth.service';
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
