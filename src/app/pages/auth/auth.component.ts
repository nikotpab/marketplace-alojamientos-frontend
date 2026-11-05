import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, Rol } from '../../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  pestana = signal<'login' | 'registro'>('registro');
  rol = signal<Rol>('HUESPED');
  enviado = signal(false);
  cargando = signal(false);
  correoDuplicado = signal(false);
  errorGeneral = signal('');
  exito = signal(false);

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  registro = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
  });

  invalido(campo: string) {
    const c = this.registro.get(campo);
    return !!c && c.invalid && (c.touched || this.enviado());
  }

  registrar() {
    this.enviado.set(true);
    this.correoDuplicado.set(false);
    this.errorGeneral.set('');
    if (this.registro.invalid) return;

    this.cargando.set(true);
    this.auth.registrar({ ...this.registro.getRawValue(), rol: this.rol() }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);
        this.registro.reset();
        this.enviado.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        if (e.status === 409) this.correoDuplicado.set(true);
        else this.errorGeneral.set('No se pudo completar el registro. Intenta de nuevo.');
      },
    });
  }
}
