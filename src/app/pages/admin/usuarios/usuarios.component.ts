import { Component, computed, inject, signal } from '@angular/core';
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
  imports: [FormsModule, DialogoMotivoComponent],
  templateUrl: './usuarios.component.html',
})
export class UsuariosComponent {
  private api = inject(UsuariosAdminService);
  private auth = inject(AuthService);

  rolTexto = ROL_TEXTO;
  busqueda = signal('');
  usuarios = signal<UsuarioAdmin[]>([]);
  cargando = signal(true);
  error = signal('');
  aviso = signal('');

  aRestringir = signal<UsuarioAdmin | null>(null);
  procesando = signal(false);
  errorAccion = signal('');

  filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    if (!q) return this.usuarios();
    return this.usuarios().filter((u) => `${u.nombre} ${u.apellido} ${u.correo}`.toLowerCase().includes(q));
  });

  constructor() {
    this.api.listar().subscribe({
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
      next: () => {
        this.usuarios.update((l) => l.map((x) => (x.id === u.id ? { ...x, restringido: true } : x)));
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
}
