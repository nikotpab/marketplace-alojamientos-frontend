import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampoContrasenaComponent } from './campo-contrasena.component';

@Component({
  standalone: true,
  imports: [CampoContrasenaComponent],
  template: `
    <label for="clave">Contraseña</label>
    <app-campo-contrasena><input id="clave" type="password" autocomplete="new-password" value="secreta-123" /></app-campo-contrasena>
  `,
})
class PantallaDePrueba {}

describe('CampoContrasenaComponent', () => {
  let fixture: ComponentFixture<PantallaDePrueba>;
  let raiz: HTMLElement;
  const campo = () => raiz.querySelector<HTMLInputElement>('#clave')!;
  const boton = () => raiz.querySelector<HTMLButtonElement>('app-campo-contrasena button')!;

  beforeEach(() => {
    fixture = TestBed.createComponent(PantallaDePrueba);
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('empieza oculta y el botón no envía formularios', () => {
    expect(campo().type).toBe('password');
    expect(boton().type).toBe('button');
    expect(boton().getAttribute('aria-label')).toBe('Mostrar contraseña');
    expect(boton().getAttribute('aria-pressed')).toBe('false');
  });

  it('el botón la muestra y la vuelve a ocultar, sin tocar el valor ni el autocomplete', () => {
    boton().click();
    fixture.detectChanges();
    expect(campo().type).toBe('text');
    expect(boton().getAttribute('aria-pressed')).toBe('true');
    expect(boton().title).toBe('Ocultar contraseña');

    boton().click();
    fixture.detectChanges();
    expect(campo().type).toBe('password');
    expect(boton().getAttribute('aria-pressed')).toBe('false');

    expect(campo().value).toBe('secreta-123');
    expect(campo().autocomplete).toBe('new-password');
  });

  it('la etiqueta queda fuera: el botón no forma parte del nombre del campo', () => {
    expect(campo().labels![0].textContent!.trim()).toBe('Contraseña');
    expect(campo().labels![0].contains(boton())).toBeFalse();
  });
});
