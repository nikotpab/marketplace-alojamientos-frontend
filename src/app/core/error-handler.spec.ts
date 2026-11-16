import { TestBed } from '@angular/core/testing';
import { ManejadorErroresGlobal } from './error-handler';
import { LogService } from './log.service';

describe('ManejadorErroresGlobal', () => {
  let manejador: ManejadorErroresGlobal;
  let registrar: jasmine.Spy;

  beforeEach(() => {
    registrar = jasmine.createSpy('registrar');
    TestBed.configureTestingModule({
      providers: [
        ManejadorErroresGlobal,
        { provide: LogService, useValue: { registrar } },
      ],
    });
    manejador = TestBed.inject(ManejadorErroresGlobal);
  });

  it('handleError registra con nivel ERROR, evento ERROR_NO_CONTROLADO y el mensaje del error', () => {
    manejador.handleError(new Error('falla'));
    expect(registrar).toHaveBeenCalledWith(
      'ERROR',
      'ERROR_NO_CONTROLADO',
      jasmine.objectContaining({ mensaje: 'falla' }),
    );
    expect(registrar).toHaveBeenCalledTimes(1);
  });
});
