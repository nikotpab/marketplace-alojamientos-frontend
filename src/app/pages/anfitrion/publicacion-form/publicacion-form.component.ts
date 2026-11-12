import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SERVICIOS } from '../../../core/alojamientos.service';
import { DatosPublicacion, ESTADO_TEXTO, Publicacion, PublicacionesService, TipoConfigurado } from '../../../core/publicaciones.service';
import { SoloNumerosDirective } from '../../../shared/solo-numeros.directive';

/** Vacío es válido (borrador); si hay valor, debe ser mayor que 0. */
function mayorQueCero(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v === '' || v === null) return null;
  return Number(v) > 0 ? null : { noPositivo: true };
}

type CampoActivacion =
  | 'titulo' | 'descripcion' | 'ubicacion' | 'tipo'
  | 'capacidad' | 'precioNoche' | 'imagenes' | 'politicaCancelacion';

/** Información mínima para pedir la activación (RF-08). */
function validarActivacion(d: DatosPublicacion): Partial<Record<CampoActivacion, string>> {
  const e: Partial<Record<CampoActivacion, string>> = {};
  if (!d.titulo) e.titulo = 'Agrega un título para la publicación.';
  if (!d.descripcion) e.descripcion = 'Agrega una descripción del alojamiento.';
  if (!d.ubicacion) e.ubicacion = 'Indica la ubicación del alojamiento.';
  if (!d.tipo) e.tipo = 'Selecciona el tipo de alojamiento.';
  if (!d.capacidad || d.capacidad <= 0) e.capacidad = 'Indica una capacidad mayor que 0 (mínimo 1 huésped).';
  if (!d.precioNoche || d.precioNoche <= 0) e.precioNoche = 'Indica un precio por noche mayor que 0.';
  if (!d.imagenes.length) e.imagenes = 'Agrega al menos una referencia de imagen (URL).';
  if (!d.politicaCancelacion) e.politicaCancelacion = 'Elige la política de cancelación.';
  return e;
}

const lineas = (texto: string) =>
  texto.split('\n').map((l) => l.trim()).filter(Boolean);

@Component({
  selector: 'app-publicacion-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, SoloNumerosDirective],
  templateUrl: './publicacion-form.component.html',
  styleUrl: './publicacion-form.component.scss',
})
export class PublicacionFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(PublicacionesService);
  private router = inject(Router);

  /** Si la ruta trae :id, el formulario está en modo edición. */
  id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  estados = ESTADO_TEXTO;
  publicacion = signal<Publicacion | null>(null);
  cargando = signal(false);
  errorCarga = signal('');
  erroresActivacion = signal<Partial<Record<CampoActivacion, string>>>({});
  totalErrores = computed(() => Object.keys(this.erroresActivacion()).length);
  exito = signal('');

  /** Solo se puede pedir activación desde BORRADOR (incluye las rechazadas, que vuelven a borrador). */
  puedeSolicitar = computed(() => !!this.id && this.publicacion()?.estado === 'BORRADOR');

  /** Servicios del catálogo del backend; la lista fija solo se usa si el catálogo no responde. */
  servicios = signal<string[]>(SERVICIOS);
  tipos = signal<TipoConfigurado[]>([]);
  errorTipos = signal('');
  /** Políticas de cancelación del backend; se envía su nombre (ajuste 8 del README del backend). */
  politicas = signal<string[]>([]);
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
    this.api.catalogos().subscribe({
      next: (c) => {
        this.politicas.set(c.politicas.map((p) => p.nombre));
        if (c.servicios.length) this.servicios.set(c.servicios.map((s) => s.nombre));
      },
      error: () => this.politicas.set([]),
    });
    if (this.id) this.cargar(this.id);
    // Si ya se mostraron errores de activación, se actualizan mientras el anfitrión corrige
    this.form.valueChanges.subscribe(() => {
      if (this.totalErrores()) this.erroresActivacion.set(validarActivacion(this.datos()));
    });
  }

  errorActivacion(campo: CampoActivacion) {
    return this.erroresActivacion()[campo] ?? '';
  }

  solicitarActivacion() {
    if (!this.id) return;
    this.exito.set('');
    this.error.set('');
    const errores = validarActivacion(this.datos());
    this.erroresActivacion.set(errores);
    if (Object.keys(errores).length) return;

    const id = this.id;
    this.guardando.set(true);
    // Primero guarda los cambios y luego pide la activación
    this.api
      .actualizar(id, this.datos())
      .pipe(switchMap(() => this.api.solicitarActivacion(id)))
      .subscribe({
        next: (p) => {
          this.publicacion.set(p);
          this.exito.set('Solicitud enviada. Un administrador revisará tu publicación antes de que aparezca en búsquedas.');
          this.guardando.set(false);
        },
        error: (e) => {
          this.guardando.set(false);
          if (e.status === 403) return;
          if (e.status === 422 && e.error?.errores) {
            this.erroresActivacion.set(e.error.errores);
            return;
          }
          this.error.set('No pudimos enviar la solicitud. Intenta de nuevo.');
        },
      });
  }

  private cargar(id: string) {
    this.cargando.set(true);
    this.api.obtener(id).subscribe({
      next: (p) => {
        this.publicacion.set(p);
        this.form.patchValue({
          titulo: p.titulo ?? '',
          descripcion: p.descripcion ?? '',
          ubicacion: p.ubicacion ?? '',
          tipo: p.tipo ?? '',
          capacidad: p.capacidad != null ? String(p.capacidad) : '',
          precioNoche: p.precioNoche != null ? String(p.precioNoche) : '',
          reglas: (p.reglas ?? []).join('\n'),
          imagenes: (p.imagenes ?? []).join('\n'),
          politicaCancelacion: p.politicaCancelacion ?? '',
        });
        this.seleccionados.set(p.servicios ?? []);
        this.cargando.set(false);
      },
      // 403 (no es el propietario ni administrador) lo redirige el interceptor a /acceso-denegado
      error: (e) => {
        this.errorCarga.set(
          e.status === 404 ? 'La publicación no existe.' : 'No pudimos cargar la publicación. Intenta de nuevo.',
        );
        this.cargando.set(false);
      },
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
    const peticion = this.id ? this.api.actualizar(this.id, this.datos()) : this.api.crear(this.datos());
    peticion.subscribe({
      next: () => this.router.navigate(['/anfitrion'], { queryParams: { guardada: 1 } }),
      error: (e) => {
        if (e.status === 403) return; // el interceptor lleva a /acceso-denegado
        this.error.set('No pudimos guardar los cambios. Revisa tu conexión e intenta de nuevo.');
        this.guardando.set(false);
      },
    });
  }
}
