import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RecuperarComponent } from './recuperar.component';

describe('RecuperarComponent', () => {
  let router: Router;

  function crear() {
    TestBed.configureTestingModule({
      imports: [RecuperarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
    return TestBed.createComponent(RecuperarComponent).componentInstance;
  }

  it('pedir otro enlace vuelve al primer paso y quita el token de la dirección', () => {
    const pagina = crear();
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);
    pagina.paso.set(2);

    pagina.pedirOtro();

    expect(pagina.paso()).toBe(1);
    expect(navegar).toHaveBeenCalledWith([], { queryParams: {} });
  });

  it('ir al inicio de sesión navega a /auth', () => {
    const pagina = crear();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    pagina.irALogin();

    expect(navegar).toHaveBeenCalledWith('/auth');
  });
});
