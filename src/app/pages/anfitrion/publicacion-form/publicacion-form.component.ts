import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SERVICIOS } from '../../../core/alojamientos.service';
import { DatosPublicacion, PublicacionesService, TipoConfigurado } from '../../../core/publicaciones.service';
import { SoloNumerosDirective } from '../../../shared/solo-numeros.directive';

/** Vacío es válido (borrador); si hay valor, debe ser mayor que 0. */
function mayorQueCero(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v === '' || v === null) return null;
  return Number(v) > 0 ? null : { noPositivo: true };
}

const lineas = (texto: string) =>
  texto.split('\n').map((l) => l.trim()).filter(Boolean);

@Component({
  selector: 'app-publicacion-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SoloNumerosDirective],
  templateUrl: './publicacion-form.component.html',
  styleUrl: './publicacion-form.component.scss',
})
export class PublicacionFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(PublicacionesService);
  private router = inject(Router);

  servicios = SERVICIOS;
  tipos = signal<TipoConfigurado[]>([]);
  errorTipos = signal('');
  seleccionados = signal<string[]>([]);
  guardando = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    tipo: '',
    capacidad: ['', [mayorQueCero]],
    precioNoche: ['', [mayorQueCero]],
    reglas: '',
    imagenes: '',
    politicaCancelacion: '',
  });

  constructor() {
    this.api.tiposActivos().subscribe({
      next: (t) => this.tipos.set(t),
      error: () => this.errorTipos.set('No pudimos cargar los tipos de alojamiento. Recarga la página.'),
    });
  }

  invalido(campo: 'capacidad' | 'precioNoche') {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  alternarServicio(s: string) {
    this.seleccionados.update((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  }

  private datos(): DatosPublicacion {
    const v = this.form.getRawValue();
    return {
      titulo: v.titulo.trim(),
      descripcion: v.descripcion.trim(),
      ubicacion: v.ubicacion.trim(),
      tipo: v.tipo,
      capacidad: v.capacidad === '' ? null : Number(v.capacidad),
      precioNoche: v.precioNoche === '' ? null : Number(v.precioNoche),
      servicios: this.seleccionados(),
      reglas: lineas(v.reglas),
      imagenes: lineas(v.imagenes),
      politicaCancelacion: v.politicaCancelacion.trim(),
    };
  }

  guardarBorrador() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.error.set('');
    this.api.crear(this.datos()).subscribe({
      next: () => this.router.navigate(['/anfitrion'], { queryParams: { guardada: 1 } }),
      error: () => {
        this.error.set('No pudimos guardar el borrador. Revisa tu conexión e intenta de nuevo.');
        this.guardando.set(false);
      },
    });
  }
}
