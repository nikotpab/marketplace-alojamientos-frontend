# Integración del frontend con el backend

Contrato verificado contra `marketplace-alojamientos-backend` (controladores de `main`, 11 nov 2026). Swagger del backend: http://localhost:8080/swagger-ui.html.

## Cómo levantar todo en local

1. Backend (ver su README, sección "Con el frontend y datos de demostración"):
   ```bash
   cp .env.example .env
   docker compose up -d --wait db correo
   SPRING_PROFILES_ACTIVE=demo mvn spring-boot:run
   ```
2. Frontend: `npm install` y `npm start`, luego http://localhost:4200.
3. Correos de verificación y recuperación: http://localhost:8025 (Mailpit).
4. Primer administrador: regístrate y ejecuta en la base
   `UPDATE marketplace.usuario SET rol = 'ADMINISTRADOR' WHERE correo = '…'`; luego vuelve a iniciar sesión.

## Rutas y versión de la API

Los servicios del front llaman a `/api/...`. `core/version-api.interceptor.ts` agrega la versión: `/api/v1/...`.

- Desarrollo: `proxy.conf.json` reenvía `/api` a `http://localhost:8080` sin reescribir.
- Producción: `deploy/Caddyfile` del backend reenvía `/api/*` tal cual a la API y sirve el front para lo demás.

Cada petición lleva `Authorization: Bearer <token>` (si hay sesión) y `X-Correlation-Id` (ver `docs/LOGS.md`). Los errores llegan como ProblemDetail: `{ status, detail, codigo, campos, errores }`.

## Pantalla → endpoint

| Pantalla / acción | Método y ruta (`/api/v1`) | Historia |
|---|---|---|
| Registro | `POST /auth/register` | SCRUM-16 |
| Iniciar sesión | `POST /auth/login` (403 `CORREO_NO_VERIFICADO`, `CUENTA_RESTRINGIDA`, `CUENTA_DESACTIVADA`; 423 bloqueada) | SCRUM-17 |
| Verificar correo (`/verificar-correo?token=`) | `POST /auth/email/verify`, `POST /auth/email/resend` | SCRUM-109 |
| Recuperar contraseña (`/recuperar?token=`) | `POST /auth/password/recover`, `POST /auth/password/reset` | SCRUM-18, SCRUM-110 |
| Mi perfil / estado de la cuenta | `GET/PUT /usuarios/me`, `PATCH /usuarios/me/estado` | SCRUM-19, 20 |
| Búsqueda | `GET /alojamientos?ciudad&llegada&salida&huespedes&tipo&precioMin&precioMax&servicios&pagina&tamano` | SCRUM-29 |
| Detalle | `GET /alojamientos/{id}` | SCRUM-30 |
| Calendario | `GET /publicaciones/{id}/disponibilidad?desde&hasta` | SCRUM-31 |
| Cotización | `POST /cotizaciones` | SCRUM-32 |
| Confirmar y pagar | `POST /reservas` con `Idempotency-Key` (402 rechazado, 409 sin cupo, 503 pasarela) | SCRUM-33, 34, 36 |
| Mis reservas / Reservas del anfitrión | `GET /reservas` (el backend filtra por el rol del token) | SCRUM-35 |
| Cancelar reserva | `GET /reservas/{id}/cancelacion/estimacion`, `POST /reservas/{id}/cancelacion` | SCRUM-37, 38 |
| Calificar estadía | `POST /reservas/{id}/resena` con `{ calificacion, contenido }` | SCRUM-40 |
| Reseñas del detalle | `GET /publicaciones/{id}/resenas` | SCRUM-41 |
| Notificaciones | `GET /notificaciones`, `POST /notificaciones/{id}/lectura`, `POST /notificaciones/lectura` | SCRUM-39 |
| Mis alojamientos y formulario | `GET /publicaciones/mias`, `POST/PUT /publicaciones`, `GET /catalogos`, `GET /configuracion/tipos-alojamiento` | SCRUM-21 a 23 |
| Pausar / reactivar | `POST /publicaciones/{id}/pausar`, `POST /publicaciones/{id}/reactivar` | SCRUM-25 |
| Disponibilidad del anfitrión | `PUT /publicaciones/{id}/disponibilidad` con `{ desde, hasta, estado }` | SCRUM-27 |
| Admin: publicaciones y revisión | `GET /admin/publicaciones?estado`, `POST /admin/publicaciones/{id}/aprobar`, `…/rechazar` | SCRUM-24, 26 |
| Admin: bloquear publicación | `POST /admin/publicaciones/{id}/bloqueo` con `{ motivo }` | SCRUM-42 |
| Admin: usuarios | `GET /admin/usuarios`, `POST /admin/usuarios/{id}/restriccion` | SCRUM-43 |
| Admin: moderación | `GET /publicaciones/{id}/resenas`, `POST /admin/resenas/{id}/ocultamiento` | SCRUM-44 |
| Admin: auditoría | `GET /admin/auditoria?accion&entidad&desde&hasta&resultado&actorId` | SCRUM-45 |
| Admin: configuración de tarifas | `GET/PUT /admin/tarifas`; historial = auditoría `TarifasActualizadas` | SCRUM-47 |
| Admin: tipos de alojamiento | `GET/POST /admin/tipos-alojamiento`, `PUT /admin/tipos-alojamiento/{id}` | SCRUM-48 |
| Admin: panel | `GET /admin/dashboard?desde&hasta` (corte a los 10 s en el front) | SCRUM-49 |
| Admin: reportes | `GET /admin/reportes?tipo&formato&desde&hasta&ciudad` (archivo); historial = auditoría `ReporteExportado` | SCRUM-50 |

## Lo que el backend todavía no permite (el front ya se adaptó)

Vienen de las "Decisiones pendientes" del README del backend. Si el backend los agrega, el front tiene el lugar listo:

- **Reportar reseñas (pendiente 17):** no hay endpoint, así que el detalle no muestra "Reportar" y Moderación trabaja por publicación.
- **Reactivar una publicación bloqueada y levantar una restricción (pendiente 10):** no hay botón para esas acciones.
- **Historial de reservas:** `GET /reservas` no trae el motivo ni la devolución de las canceladas, ni si la reserva ya tiene reseña. El front muestra la cancelación justo después de hacerla, y si el huésped intenta reseñar dos veces el backend responde 409 con el mensaje correspondiente.
- **Nombre del huésped para el anfitrión:** solo llegan teléfono y correo (y solo en reservas confirmadas).
- **Políticas de cancelación:** solo la Flexible tiene reglas; con otra, la estimación y la cancelación responden 409 y el front muestra el mensaje del backend.
- **Tarifa de limpieza:** puede llegar en null hasta que el administrador la configure; el front la muestra como 0.
- **Método de pago (pendiente 2):** el backend usa `STRIPE_METODO_PAGO` y no lee `metodoPagoId`. El front lo envía igual, listo para cuando se use.

## Prueba rápida de punta a punta

1. Registrar un anfitrión y un huésped; verificar ambos correos en Mailpit.
2. Anfitrión: crear publicación (ubicación terminada en la ciudad, política Flexible) y solicitar activación.
3. Admin: aprobarla en Revisión.
4. Huésped: buscar por la ciudad, abrir el detalle, elegir fechas, cotizar, pagar con `4242 4242 4242 4242`.
5. Huésped: Mis reservas → cancelar (revisar la estimación). Anfitrión: Reservas.
6. Admin: Auditoría (deben aparecer los eventos), Panel, Reportes (descargar Excel) y Configuración.
