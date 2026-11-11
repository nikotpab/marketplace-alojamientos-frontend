import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

type Estado = 'verificando' | 'verificado' | 'invalido';

/** Destino del enlace que llega por correo al registrarse: /verificar-correo?token=… (SCRUM-109). */
@Component({
  selector: 'app-verificar-correo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, FormsModule, RouterLink],
  templateUrl: './verificar-correo.component.html',
  styleUrl: '../recuperar/recuperar.component.scss',
})
export class VerificarCorreoComponent {
  private auth = inject(AuthService);

  estado = signal<Estado>('verificando');
  correo = '';
  reenviado = signal(false);

  constructor() {
    const token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado.set('invalido');
      return;
    }
    this.auth.verificarCorreo(token).subscribe({
      next: () => this.estado.set('verificado'),
      error: () => this.estado.set('invalido'),
    });
  }

  reenviar() {
    if (!this.correo.trim()) return;
    this.auth.reenviarVerificacion(this.correo.trim()).subscribe({
      next: () => this.reenviado.set(true),
      error: () => this.reenviado.set(true),
    });
  }
}
