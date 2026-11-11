import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const NOMBRE_SITIO = 'Inversiones LR';

/** Cada ruta declara su `title`; aquí se le agrega el nombre del sitio ("Mis reservas · Inversiones LR"). */
@Injectable({ providedIn: 'root' })
export class TituloPorRuta extends TitleStrategy {
  private titulo = inject(Title);

  override updateTitle(estado: RouterStateSnapshot): void {
    const propio = this.buildTitle(estado);
    this.titulo.setTitle(propio ? `${propio} · ${NOMBRE_SITIO}` : `${NOMBRE_SITIO} · Marketplace de alojamientos`);
  }
}
