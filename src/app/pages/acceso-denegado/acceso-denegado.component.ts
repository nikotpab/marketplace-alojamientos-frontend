import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="aviso">
      <h1>403</h1>
      <h2>No tienes permiso para acceder a esta página</h2>
      <p>Tu rol actual no permite realizar esta acción.</p>
      <button type="button" (click)="volver()">Volver al inicio</button>
    </main>
  `,
  styles: `
    .aviso { min-height: 100vh; display: grid; place-content: center; text-align: center; gap: 8px; padding: 24px; }
    h1 { margin: 0; font-size: 4rem; color: var(--rojo); }
    h2 { margin: 0; color: var(--verde); }
    p { margin: 0 0 16px; }
    button { justify-self: center; background: var(--rojo); color: #fff; border: 0; padding: 12px 24px; border-radius: var(--radio); font-weight: 700; cursor: pointer; }
  `,
})
export class AccesoDenegadoComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  volver() {
    this.router.navigateByUrl(this.auth.autenticado() ? '/' : '/auth');
  }
}
