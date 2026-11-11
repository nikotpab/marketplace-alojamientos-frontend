import { Component, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

/**
 * Ventana modal reutilizable. El contenido se proyecta; se cierra con Escape o con el fondo
 * (salvo que `bloqueado` esté activo mientras se procesa una acción).
 */
@Component({
  selector: 'app-dialogo',
  standalone: true,
  template: `
    <div class="fondo" (click)="!bloqueado() && cerrar.emit()"></div>
    <section class="dialogo" role="dialog" aria-modal="true" [attr.aria-label]="titulo()" tabindex="-1"
             (keydown.escape)="!bloqueado() && cerrar.emit()">
      <header>
        <h2>{{ titulo() }}</h2>
        <button type="button" class="x" aria-label="Cerrar" [disabled]="bloqueado()" (click)="cerrar.emit()">×</button>
      </header>
      <ng-content />
    </section>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 16px; }
    .fondo { position: absolute; inset: 0; background: rgba(20, 28, 14, .45); }
    .dialogo {
      position: relative; width: min(520px, 100%); max-height: calc(100vh - 32px); overflow: auto;
      background: #fff; border-radius: 18px; padding: 22px 24px; box-shadow: 0 20px 50px rgba(0, 0, 0, .2);
      &:focus { outline: none; }
    }
    header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
    h2 { margin: 0; font-size: 1.2rem; color: var(--verde); }
    .x { border: 0; background: none; font-size: 1.6rem; line-height: 1; cursor: pointer; color: #55574a; }
  `,
})
export class DialogoComponent {
  titulo = input.required<string>();
  bloqueado = input(false);
  cerrar = output<void>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() => el.nativeElement.querySelector<HTMLElement>('.dialogo')?.focus());
  }
}
