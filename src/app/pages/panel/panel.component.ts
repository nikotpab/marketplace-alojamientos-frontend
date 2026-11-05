import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-panel',
  standalone: true,
  template: `
    <main class="panel">
      <h1>{{ titulo }}</h1>
      <p>Hola, {{ auth.usuario()?.nombre }}. Esta sección se construye en las siguientes historias.</p>
    </main>
  `,
  styles: `
    .panel { padding: 48px 32px; max-width: 1100px; margin: 0 auto; }
    h1 { margin: 0 0 8px; color: var(--verde); }
    p { margin: 0; }
  `,
})
export class PanelComponent {
  auth = inject(AuthService);
  titulo = inject(ActivatedRoute).snapshot.data['titulo'] as string;
}
