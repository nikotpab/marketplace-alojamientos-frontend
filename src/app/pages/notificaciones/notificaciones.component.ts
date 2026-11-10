import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NotificacionesService, TIPO_NOTIFICACION_TEXTO } from '../../core/notificaciones.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss',
})
export class NotificacionesComponent {
  api = inject(NotificacionesService);
  tipoTexto = TIPO_NOTIFICACION_TEXTO;

  constructor() {
    this.api.cargar();
  }
}
