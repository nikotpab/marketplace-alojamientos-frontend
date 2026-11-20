/**
 * SCRUM-129 — Verificación de campos a nivel de tipos.
 *
 * Cada bloque de aserciones garantiza que los campos que el front lee
 * existen en el esquema del backend (src/contract/api.d.ts).
 * Si el backend renombra o elimina un campo, este archivo no compila
 * y el CI falla antes de llegar a runtime.
 *
 * Patrón:
 *   type _Check = 'campo' extends keyof Schema ? true : never;
 *   const _: _Check = true;   // ← error de compilación si el campo no existe
 */
import type { components } from '../../contract/api';

// ---------------------------------------------------------------------------
// AlojamientoResumen  (GET /api/alojamientos → PaginaAlojamientos.contenido[])
// ---------------------------------------------------------------------------
type _AR_id         = 'id'         extends keyof components['schemas']['AlojamientoResumen'] ? true : never;
type _AR_titulo     = 'titulo'     extends keyof components['schemas']['AlojamientoResumen'] ? true : never;
type _AR_ciudad     = 'ciudad'     extends keyof components['schemas']['AlojamientoResumen'] ? true : never;
type _AR_tipo       = 'tipo'       extends keyof components['schemas']['AlojamientoResumen'] ? true : never;
type _AR_capacidad  = 'capacidad'  extends keyof components['schemas']['AlojamientoResumen'] ? true : never;
type _AR_precio     = 'precioNoche' extends keyof components['schemas']['AlojamientoResumen'] ? true : never;
type _AR_calif      = 'calificacion' extends keyof components['schemas']['AlojamientoResumen'] ? true : never;
type _AR_imagen     = 'imagen'     extends keyof components['schemas']['AlojamientoResumen'] ? true : never;
type _AR_servicios  = 'servicios'  extends keyof components['schemas']['AlojamientoResumen'] ? true : never;

const _ar1: _AR_id        = true;
const _ar2: _AR_titulo    = true;
const _ar3: _AR_ciudad    = true;
const _ar4: _AR_tipo      = true;
const _ar5: _AR_capacidad = true;
const _ar6: _AR_precio    = true;
const _ar7: _AR_calif     = true;
const _ar8: _AR_imagen    = true;
const _ar9: _AR_servicios = true;

// ---------------------------------------------------------------------------
// Detalle  (GET /api/alojamientos/{id})
// ---------------------------------------------------------------------------
type _D_id           = 'id'                extends keyof components['schemas']['Detalle'] ? true : never;
type _D_titulo       = 'titulo'            extends keyof components['schemas']['Detalle'] ? true : never;
type _D_descripcion  = 'descripcion'       extends keyof components['schemas']['Detalle'] ? true : never;
type _D_ciudad       = 'ciudad'            extends keyof components['schemas']['Detalle'] ? true : never;
type _D_direccion    = 'direccion'         extends keyof components['schemas']['Detalle'] ? true : never;
type _D_tipo         = 'tipo'              extends keyof components['schemas']['Detalle'] ? true : never;
type _D_capacidad    = 'capacidad'         extends keyof components['schemas']['Detalle'] ? true : never;
type _D_precio       = 'precioNoche'       extends keyof components['schemas']['Detalle'] ? true : never;
type _D_servicios    = 'servicios'         extends keyof components['schemas']['Detalle'] ? true : never;
type _D_reglas       = 'reglas'            extends keyof components['schemas']['Detalle'] ? true : never;
type _D_politica     = 'politicaCancelacion' extends keyof components['schemas']['Detalle'] ? true : never;
type _D_imagenes     = 'imagenes'          extends keyof components['schemas']['Detalle'] ? true : never;
type _D_calif        = 'calificacionPromedio' extends keyof components['schemas']['Detalle'] ? true : never;
type _D_resenas      = 'resenas'           extends keyof components['schemas']['Detalle'] ? true : never;
type _D_estado       = 'estado'            extends keyof components['schemas']['Detalle'] ? true : never;
// DIFERENCIA: el contrato incluye 'fechasNoDisponibles' pero AlojamientoDetalle del front no lo mapea

const _d1:  _D_id          = true;
const _d2:  _D_titulo      = true;
const _d3:  _D_descripcion = true;
const _d4:  _D_ciudad      = true;
const _d5:  _D_direccion   = true;
const _d6:  _D_tipo        = true;
const _d7:  _D_capacidad   = true;
const _d8:  _D_precio      = true;
const _d9:  _D_servicios   = true;
const _d10: _D_reglas      = true;
const _d11: _D_politica    = true;
const _d12: _D_imagenes    = true;
const _d13: _D_calif       = true;
const _d14: _D_resenas     = true;
const _d15: _D_estado      = true;

// ---------------------------------------------------------------------------
// Desglose  (POST /api/cotizaciones — Cotizacion en el front)
// ---------------------------------------------------------------------------
type _Dg_noches     = 'noches'            extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_precio     = 'precioNoche'       extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_subtotal   = 'subtotal'          extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_limpieza   = 'tarifaLimpieza'    extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_pctSvc     = 'porcentajeServicio' extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_svc        = 'tarifaServicio'    extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_desc       = 'descuentos'        extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_add        = 'adicionales'       extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_total      = 'total'             extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_moneda     = 'moneda'            extends keyof components['schemas']['Desglose'] ? true : never;
type _Dg_addDisp    = 'adicionalesDisponibles' extends keyof components['schemas']['Desglose'] ? true : never;

const _dg1:  _Dg_noches  = true;
const _dg2:  _Dg_precio  = true;
const _dg3:  _Dg_subtotal = true;
const _dg4:  _Dg_limpieza = true;
const _dg5:  _Dg_pctSvc  = true;
const _dg6:  _Dg_svc     = true;
const _dg7:  _Dg_desc    = true;
const _dg8:  _Dg_add     = true;
const _dg9:  _Dg_total   = true;
const _dg10: _Dg_moneda  = true;
const _dg11: _Dg_addDisp = true;

// ---------------------------------------------------------------------------
// ReservaVista  (GET /api/reservas[] — Reserva en el front)
// ---------------------------------------------------------------------------
type _RV_id          = 'id'           extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_codigo      = 'codigo'       extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_estado      = 'estado'       extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_pubId       = 'publicacionId' extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_aloj        = 'alojamiento'  extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_llegada     = 'llegada'      extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_salida      = 'salida'       extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_huespedes   = 'huespedes'    extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_noches      = 'noches'       extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_total       = 'total'        extends keyof components['schemas']['ReservaVista'] ? true : never;
type _RV_contacto    = 'contactoHuesped' extends keyof components['schemas']['ReservaVista'] ? true : never;
// Nota: 'cancelacion' y 'resenada' son solo del front (no vienen del backend)

const _rv1:  _RV_id        = true;
const _rv2:  _RV_codigo    = true;
const _rv3:  _RV_estado    = true;
const _rv4:  _RV_pubId     = true;
const _rv5:  _RV_aloj      = true;
const _rv6:  _RV_llegada   = true;
const _rv7:  _RV_salida    = true;
const _rv8:  _RV_huespedes = true;
const _rv9:  _RV_noches    = true;
const _rv10: _RV_total     = true;
const _rv11: _RV_contacto  = true;

// ---------------------------------------------------------------------------
// Cancelacion  (POST /api/reservas/{id}/cancelacion)
// ---------------------------------------------------------------------------
type _C_id          = 'id'             extends keyof components['schemas']['Cancelacion'] ? true : never;
type _C_reservaId   = 'reservaId'      extends keyof components['schemas']['Cancelacion'] ? true : never;
type _C_usuarioId   = 'usuarioId'      extends keyof components['schemas']['Cancelacion'] ? true : never;
type _C_fecha       = 'fecha'          extends keyof components['schemas']['Cancelacion'] ? true : never;
type _C_motivo      = 'motivo'         extends keyof components['schemas']['Cancelacion'] ? true : never;
type _C_devolucion  = 'valorDevolucion' extends keyof components['schemas']['Cancelacion'] ? true : never;
type _C_estadoFinal = 'estadoFinal'    extends keyof components['schemas']['Cancelacion'] ? true : never;

const _c1: _C_id          = true;
const _c2: _C_reservaId   = true;
const _c3: _C_usuarioId   = true;
const _c4: _C_fecha       = true;
const _c5: _C_motivo      = true;
const _c6: _C_devolucion  = true;
const _c7: _C_estadoFinal = true;

// ---------------------------------------------------------------------------
// Sesion  (POST /api/auth/login)
// ---------------------------------------------------------------------------
type _S_token   = 'token'   extends keyof components['schemas']['Sesion'] ? true : never;
type _S_usuario = 'usuario' extends keyof components['schemas']['Sesion'] ? true : never;

const _s1: _S_token   = true;
const _s2: _S_usuario = true;

// UsuarioSesion (dentro de Sesion)
type _US_id     = 'id'     extends keyof components['schemas']['UsuarioSesion'] ? true : never;
type _US_nombre = 'nombre' extends keyof components['schemas']['UsuarioSesion'] ? true : never;
type _US_correo = 'correo' extends keyof components['schemas']['UsuarioSesion'] ? true : never;
type _US_rol    = 'rol'    extends keyof components['schemas']['UsuarioSesion'] ? true : never;

const _us1: _US_id     = true;
const _us2: _US_nombre = true;
const _us3: _US_correo = true;
const _us4: _US_rol    = true;

// ---------------------------------------------------------------------------
// PublicacionVista  (moderación: GET /api/admin/publicaciones)
// ---------------------------------------------------------------------------
type _PV_id      = 'id'               extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_titulo  = 'titulo'           extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_estado  = 'estado'           extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_ciudad  = 'ciudad'           extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_tipo    = 'tipo'             extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_cap     = 'capacidad'        extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_precio  = 'precioNoche'      extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_serv    = 'servicios'        extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_imgs    = 'imagenes'         extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_motRec  = 'motivoRechazo'    extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_motBlq  = 'motivoBloqueo'    extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_anfit   = 'anfitrion'        extends keyof components['schemas']['PublicacionVista'] ? true : never;
type _PV_upd     = 'actualizadaEn'    extends keyof components['schemas']['PublicacionVista'] ? true : never;

const _pv1:  _PV_id     = true;
const _pv2:  _PV_titulo = true;
const _pv3:  _PV_estado = true;
const _pv4:  _PV_ciudad = true;
const _pv5:  _PV_tipo   = true;
const _pv6:  _PV_cap    = true;
const _pv7:  _PV_precio = true;
const _pv8:  _PV_serv   = true;
const _pv9:  _PV_imgs   = true;
const _pv10: _PV_motRec = true;
const _pv11: _PV_motBlq = true;
const _pv12: _PV_anfit  = true;
const _pv13: _PV_upd    = true;

// ---------------------------------------------------------------------------
// Jasmine necesita al menos un describe/it para que Karma no lo reporte vacío
// ---------------------------------------------------------------------------
describe('Contrato: tipos (compilación)', () => {
  it('verifica campos a nivel de tipos — si este archivo compila, el contrato es compatible', () => {
    expect(true).toBeTrue();
  });
});
