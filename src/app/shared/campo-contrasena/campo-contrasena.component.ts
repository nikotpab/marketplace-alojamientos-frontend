import { ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation, inject, signal } from '@angular/core';

/**
 * Campo de contraseña con un botón para mostrarla u ocultarla (SCRUM-153). El input se proyecta, así que sigue
 * en el formulario de la pantalla con su etiqueta, su `autocomplete` y sus validaciones. La etiqueta debe ir fuera
 * (con `for`), para que el nombre del botón no se sume al del campo.
 */
@Component({
  selector: 'app-campo-contrasena',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-content />
    <button type="button" class="ojo" aria-label="Mostrar contraseña" [attr.aria-pressed]="visible()"
            [title]="visible() ? 'Ocultar contraseña' : 'Mostrar contraseña'" (click)="alternar()">
      @if (visible()) {
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
          <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7a9.6 9.6 0 0 0 5.4-1.6"/>
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>
        </svg>
      }
    </button>
  `,
  styles: `
    app-campo-contrasena { position: relative; display: block; }
    /* Más específico que los estilos de cada pantalla, para dejar espacio al botón */
    app-campo-contrasena input[type] { width: 100%; padding-right: 48px; }
    app-campo-contrasena .ojo {
      position: absolute; top: 50%; right: 4px; transform: translateY(-50%);
      width: 40px; height: 40px; display: grid; place-items: center; padding: 0;
      border: 0; border-radius: var(--radio-sm); background: none; color: var(--texto-suave); cursor: pointer;
      &:hover { color: var(--marca); }
      &:focus-visible { outline: 2px solid var(--marca); outline-offset: 0; }
    }
  `,
})
export class CampoContrasenaComponent {
  visible = signal(false);

  private host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  alternar() {
    const campo = this.host.querySelector('input');
    if (!campo) return;
    this.visible.update((v) => !v);
    campo.type = this.visible() ? 'text' : 'password';
  }
}
