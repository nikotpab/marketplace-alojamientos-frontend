import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TipoAlojamientoConfig, TiposAlojamientoService } from '../../../core/tipos-alojamiento.service';

@Component({
  selector: 'app-tipos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tipos.component.html',
  styleUrl: './tipos.component.scss',
})
export class TiposComponent {
  private api = inject(TiposAlojamientoService);

  tipos = signal<TipoAlojamientoConfig[]>([]);
  cargando = signal(true);
  error = signal('');
  aviso = signal('');
  nuevo = '';
  creando = signal(false);
  editando = signal<string | null>(null);
  nombreEditado = '';

  constructor() {
    this.api.todos().subscribe({
      next: (t) => {
        this.tipos.set(t);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los tipos de alojamiento.');
        this.cargando.set(false);
      },
    });
  }

  crear() {
    const nombre = this.nuevo.trim();
    if (nombre.length < 3 || this.creando()) return;
    this.creando.set(true);
    this.aviso.set('');
    this.api.crear(nombre).subscribe({
      next: (t) => {
        this.tipos.update((l) => [...l, t]);
        this.nuevo = '';
        this.creando.set(false);
        this.aviso.set(`Tipo "${t.nombre}" agregado. Ya aparece en publicaciones y filtros de búsqueda.`);
      },
      error: (e) => {
        this.creando.set(false);
        this.aviso.set(e.status === 409 ? 'Ya existe un tipo con ese nombre.' : 'No pudimos agregar el tipo. Intenta de nuevo.');
      },
    });
  }

  editar(t: TipoAlojamientoConfig) {
    this.editando.set(t.id);
    this.nombreEditado = t.nombre;
  }

  guardarNombre(t: TipoAlojamientoConfig) {
    const nombre = this.nombreEditado.trim();
    if (nombre.length < 3) return;
    this.actualizar(t, { nombre }, 'Nombre actualizado.');
  }

  alternar(t: TipoAlojamientoConfig) {
    this.actualizar(
      t,
      { activo: !t.activo },
      t.activo
        ? `"${t.nombre}" desactivado: deja de ofrecerse en publicaciones nuevas y filtros.`
        : `"${t.nombre}" activado.`,
    );
  }

  private actualizar(t: TipoAlojamientoConfig, cambios: Partial<TipoAlojamientoConfig>, mensaje: string) {
    this.aviso.set('');
    this.api.actualizar(t, cambios).subscribe({
      next: (r) => {
        this.tipos.update((l) => l.map((x) => (x.id === r.id ? r : x)));
        this.editando.set(null);
        this.aviso.set(mensaje);
      },
      error: () => this.aviso.set('No pudimos guardar el cambio. Intenta de nuevo.'),
    });
  }
}
