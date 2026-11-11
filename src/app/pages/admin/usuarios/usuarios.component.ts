import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, RolUsuario } from '../../../core/auth.service';
import { UsuarioAdmin, UsuariosAdminService } from '../../../core/usuarios-admin.service';
import { DialogoMotivoComponent } from '../../../shared/dialogo-motivo/dialogo-motivo.component';

const ROL_TEXTO: Record<RolUsuario, string> = {
  HUESPED: 'Huésped',
  ANFITRION: 'Anfitrión',
  ADMINISTRADOR: 'Administrador',
};

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [DatePipe, FormsModule, DialogoMotivoComponent],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  private api = inject(UsuariosAdminService);
  private auth = inject(AuthService);

  rolTexto = ROL_TEXTO;
  busqueda = '';
  usuarios = signal<UsuarioAdmin[]>([]);
  cargando = signal(true);
  error = signal('');
  aviso = signal('');

  aRestringir = signal<UsuarioAdmin | null>(null);
  procesando = signal(false);
  errorAccion = signal('');

  constructor() {
    this.buscar();
  }

  buscar() {
    this.cargando.set(true);
    this.error.set('');
    this.api.listar(this.busqueda).subscribe({
      next: (u) => {
        this.usuarios.set(u);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los usuarios. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  /** Un administrador no puede restringirse a sí mismo. */
  esYo(u: UsuarioAdmin) {
    return u.id === this.auth.usuario()?.id;
  }

  restringir(motivo: string) {
    const u = this.aRestringir();
    if (!u) return;
    this.procesando.set(true);
    this.errorAccion.set('');
    this.api.restringir(u.id, motivo).subscribe({
      next: (r) => {
        this.reemplazar(r);
        this.procesando.set(false);
        this.aRestringir.set(null);
        this.aviso.set(`${u.nombre} ${u.apellido} quedó restringido y no podrá iniciar sesión.`);
      },
      error: () => {
        this.procesando.set(false);
        this.errorAccion.set('No pudimos restringir al usuario. Intenta de nuevo.');
      },
    });
  }

  levantar(u: UsuarioAdmin) {
    this.aviso.set('');
    this.api.levantarRestriccion(u.id).subscribe({
      next: (r) => {
        this.reemplazar(r);
        this.aviso.set(`Se levantó la restricción de ${u.nombre} ${u.apellido}.`);
      },
      error: () => this.aviso.set('No pudimos levantar la restricción. Intenta de nuevo.'),
    });
  }

  private reemplazar(u: UsuarioAdmin) {
    this.usuarios.update((l) => l.map((x) => (x.id === u.id ? u : x)));
  }
}
