import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, Perfil, RolUsuario } from '../../core/auth.service';

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  HUESPED: 'Huésped',
  ANFITRION: 'Anfitrión',
  ADMINISTRADOR: 'Administrador',
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  perfil = signal<Perfil | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  enviado = signal(false);
  error = signal('');
  exito = signal(false);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
  });

  nombreCompleto = computed(() => {
    const p = this.perfil();
    return p ? `${p.nombre} ${p.apellido}`.trim() : '';
  });

  iniciales = computed(() =>
    this.nombreCompleto()
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join(''),
  );

  etiquetaRol = computed(() => {
    const p = this.perfil();
    return p ? ETIQUETA_ROL[p.rol] : '';
  });

  ngOnInit() {
    this.auth.obtenerPerfil().subscribe({
      next: (p) => {
        this.cargarPerfil(p);
        this.cargando.set(false);
      },
      error: () => {
        // Sin conexión con la API se muestran los datos de la sesión
        const u = this.auth.usuario();
        if (u) this.cargarPerfil({ nombre: u.nombre, apellido: '', correo: u.correo, telefono: '', rol: u.rol });
        this.error.set('No se pudo cargar tu perfil completo. Intenta de nuevo más tarde.');
        this.cargando.set(false);
      },
    });
  }

  invalido(campo: string) {
    const c = this.form.get(campo);
    return !!c && c.invalid && (c.touched || this.enviado());
  }

  guardar() {
    this.enviado.set(true);
    this.error.set('');
    this.exito.set(false);
    if (this.form.invalid) return;

    this.guardando.set(true);
    this.auth.actualizarPerfil(this.form.getRawValue()).subscribe({
      next: (p) => {
        this.guardando.set(false);
        this.cargarPerfil(p);
        this.enviado.set(false);
        this.exito.set(true);
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(
          e.status === 400
            ? 'Revisa los datos ingresados.'
            : 'No se pudieron guardar los cambios. Intenta de nuevo.',
        );
      },
    });
  }

  cambiarContrasena() {
    this.router.navigateByUrl('/recuperar');
  }

  private cargarPerfil(p: Perfil) {
    this.perfil.set(p);
    this.form.reset({ nombre: p.nombre, apellido: p.apellido, telefono: p.telefono });
  }
}
