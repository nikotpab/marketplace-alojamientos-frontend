import { ESTADO_RESERVA_TEXTO, EstadoReserva } from './reservas.service';
import { ESTADO_TEXTO, EstadoPublicacion } from './publicaciones.service';
import { TIPO_NOTIFICACION_TEXTO } from './notificaciones.service';

describe('ESTADO_RESERVA_TEXTO', () => {
  const estados: EstadoReserva[] = ['CONFIRMADA', 'COMPLETADA', 'CANCELADA', 'EN_REVISION'];

  it('tiene texto para cada estado de reserva', () => {
    for (const e of estados) {
      expect(ESTADO_RESERVA_TEXTO[e]).withContext(e).toBeTruthy();
    }
  });

  it('no deja ningún estado sin etiqueta legible', () => {
    for (const e of estados) {
      expect(ESTADO_RESERVA_TEXTO[e]).withContext(e).not.toBe(e);
    }
  });
});

describe('ESTADO_TEXTO (publicaciones)', () => {
  const estados: EstadoPublicacion[] = ['BORRADOR', 'PENDIENTE_REVISION', 'ACTIVA', 'PAUSADA', 'BLOQUEADA'];

  it('tiene texto para cada estado de publicación', () => {
    for (const e of estados) {
      expect(ESTADO_TEXTO[e]).withContext(e).toBeTruthy();
    }
  });
});

describe('TIPO_NOTIFICACION_TEXTO', () => {
  it('mapea los tipos principales de notificación', () => {
    expect(TIPO_NOTIFICACION_TEXTO['ReservaConfirmada']).toBeTruthy();
    expect(TIPO_NOTIFICACION_TEXTO['ReservaCancelada']).toBeTruthy();
    expect(TIPO_NOTIFICACION_TEXTO['PublicacionAprobada']).toBeTruthy();
    expect(TIPO_NOTIFICACION_TEXTO['PublicacionRechazada']).toBeTruthy();
  });
});
