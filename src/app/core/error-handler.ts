import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LogService } from './log.service';

/** Errores no controlados del front, registrados en JSON y enmascarados. */
@Injectable()
export class ManejadorErroresGlobal implements ErrorHandler {
  private log = inject(LogService);

  handleError(error: unknown): void {
    const e = error as { name?: string; message?: string; stack?: string };
    this.log.registrar('ERROR', 'ERROR_NO_CONTROLADO', {
      tipoEvento: 'ERROR',
      nombre: e?.name ?? 'Error',
      mensaje: e?.message ?? String(error),
      stack: e?.stack?.split('\n').slice(0, 5).join(' | ') ?? null,
    });
  }
}
