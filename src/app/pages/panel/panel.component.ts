import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
    <main class="panel">
      <h1>{{ titulo }}</h1>
      <p>Hola, {{ auth.usuario()?.nombre }}. Esta sección se construye en las siguientes historias.</p>
      <button type="button" (click)="salir()">Cerrar sesión</button>
    </main>
  `,
  styles: `
    .panel { min-height: 100vh; display: grid; place-content: center; text-align: center; gap: 12px; padding: 24px; }
    h1 { margin: 0; color: var(--verde); }
    p { margin: 0; }
    button { justify-self: center; background: var(--verde); color: #fff; border: 0; padding: 12px 24px; border-radius: var(--radio); font-weight: 700; cursor: pointer; }
  `,
})
export class PanelComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  titulo = inject(ActivatedRoute).snapshot.data['titulo'] as string;

  salir() {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/auth');
  }
}
