import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type Rol = 'HUESPED' | 'ANFITRION';

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

  private fb = inject(FormBuilder);

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
    if (this.registro.invalid) return;
    // La llamada a la API se conecta en el siguiente commit
    console.log({ ...this.registro.getRawValue(), rol: this.rol() });
  }
}