# Integración del frontend con el backend

El contrato está en `src/contract/openapi.json` (ver [CONTRATO.md](CONTRATO.md)). Swagger del backend: http://localhost:8080/swagger-ui.html.

## Cómo levantar todo en local

1. Backend (ver la sección "Arrancar" de su README):
   ```bash
   cp .env.example .env
   docker compose up -d --wait db correo
   SPRING_PROFILES_ACTIVE=demo mvn spring-boot:run
   ```
2. Frontend: `npm install` y `npm start`, luego http://localhost:4200.
3. Correos con el código de registro y de recuperación: http://localhost:8025 (Mailpit).
4. Primer administrador: regístrate y ejecuta en la base
   `UPDATE marketplace.usuario SET rol = 'ADMINISTRADOR' WHERE correo = '…'`; luego vuelve a iniciar sesión.

## Rutas y versión de la API

Los servicios del front llaman a `/api/...`. `core/version-api.interceptor.ts` agrega la versión: `/api/v1/...`.

- Desarrollo: `proxy.conf.json` reenvía `/api` a `http://localhost:8080` sin reescribir.
- Producción: `deploy/caddy/Caddyfile` del backend reenvía `/api/*` tal cual a la API y sirve el front para lo demás.

Cada petición lleva `Authorization: Bearer <token>` (si hay sesión) y `X-Correlation-Id` (ver `docs/LOGS.md`). Los errores llegan como ProblemDetail: `{ status, detail, codigo, campos, errores }`.

## Pantalla → endpoint

| Pantalla / acción | Método y ruta (`/api/v1`) |
|---|---|
| Registro, con la ventana del código que llega al correo | `POST /auth/register/code`, luego `POST /auth/register` con `codigo`; al acertar inicia sesión con `POST /auth/login` |
| Iniciar sesión | `POST /auth/login` (403 `CORREO_NO_VERIFICADO`, `CUENTA_RESTRINGIDA`, `CUENTA_DESACTIVADA`; 423 bloqueada) |
| Recuperar contraseña (`/recuperar?token=`) | `POST /auth/password/recover`, `POST /auth/password/reset` |
| Mi perfil / estado de la cuenta | `GET/PUT /usuarios/me`, `PATCH /usuarios/me/estado` |
| Búsqueda | `GET /alojamientos?ciudad&llegada&salida&huespedes&tipo&precioMin&precioMax&servicios&pagina&tamano` |
| Detalle | `GET /alojamientos/{id}` |
| Calendario | `GET /publicaciones/{id}/disponibilidad?desde&hasta` |
| Cotización | `POST /cotizaciones` |
| Confirmar y pagar | `POST /reservas` con `Idempotency-Key` (402 rechazado, 409 sin cupo, 503 pasarela) |
| Mis reservas / Reservas del anfitrión | `GET /reservas` (el backend filtra por el rol del token) |
| Cancelar reserva | `GET /reservas/{id}/cancelacion/estimacion`, `POST /reservas/{id}/cancelacion`; también una `EN_REVISION`, con devolución total |
| Calificar estadía | `POST /reservas/{id}/resena` con `{ calificacion, contenido }` |
| Reseñas del detalle | `GET /publicaciones/{id}/resenas` |
| Notificaciones | `GET /notificaciones`, `POST /notificaciones/{id}/lectura`, `POST /notificaciones/lectura` |
| Mis alojamientos y formulario | `GET /publicaciones/mias`, `POST/PUT /publicaciones`, `GET /catalogos`, `GET /configuracion/tipos-alojamiento`; el payload incluye `ciudad`; si el anfitrión edita una `ACTIVA` o `PAUSADA`, vuelve a `PENDIENTE_REVISION` |
| Pausar / reactivar | `POST /publicaciones/{id}/pausar`, `POST /publicaciones/{id}/reactivar` |
| Disponibilidad del anfitrión | `PUT /publicaciones/{id}/disponibilidad` con `{ desde, hasta, estado }` |
| Admin: publicaciones y revisión | `GET /admin/publicaciones?estado`, `POST /admin/publicaciones/{id}/aprobar`, `…/rechazar` |
| Admin: bloquear publicación | `POST /admin/publicaciones/{id}/bloqueo` con `{ motivo }`; desbloquear con `POST /admin/publicaciones/{id}/desbloqueo` |
| Admin: usuarios | `GET /admin/usuarios`, `POST /admin/usuarios/{id}/restriccion`; levantarla con `DELETE` en la misma ruta; reactivar con `POST /admin/usuarios/{id}/reactivacion` |
| Reportar una reseña (detalle) | `POST /resenas/{id}/reportes` con `{ motivo, comentario? }` (409 si repite o es la propia) |
| Admin: moderación | `GET /admin/resenas/reportadas`, `GET /publicaciones/{id}/resenas`, `POST /admin/resenas/{id}/ocultamiento` |
| Admin: auditoría | `GET /admin/auditoria?accion&entidad&desde&hasta&resultado&actorId` |
| Admin: configuración de tarifas | `GET/PUT /admin/tarifas`; historial = auditoría `TarifasActualizadas` |
| Admin: tipos de alojamiento | `GET/POST /admin/tipos-alojamiento`, `PUT /admin/tipos-alojamiento/{id}` |
| Admin: panel | `GET /admin/dashboard?desde&hasta` (corte a los 10 s en el front) |
| Admin: reportes | `GET /admin/reportes?tipo&formato&desde&hasta&ciudad` (archivo); historial = auditoría `ReporteExportado` |

## Prueba rápida de punta a punta

1. Registrar un anfitrión y un huésped con el código que llega a Mailpit.
2. Anfitrión: crear publicación (dirección y ciudad en sus campos respectivos, política Flexible) y solicitar activación.
3. Admin: aprobarla en Revisión.
4. Huésped: buscar por la ciudad, abrir el detalle, elegir fechas, cotizar, pagar con `4242 4242 4242 4242`.
5. Huésped: Mis reservas → cancelar (revisar la estimación). Anfitrión: Reservas.
6. Admin: Auditoría (deben aparecer los eventos), Panel, Reportes (descargar Excel) y Configuración.
