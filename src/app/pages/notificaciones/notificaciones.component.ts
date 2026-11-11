import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificacionesService, TIPO_NOTIFICACION_TEXTO } from '../../core/notificaciones.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss',
})
export class NotificacionesComponent {
  api = inject(NotificacionesService);
  textoTipo(tipo: string) {
    return TIPO_NOTIFICACION_TEXTO[tipo] ?? 'Aviso';
  }

  constructor() {
    this.api.cargar();
  }
}
