# Logs estructurados del front (SCRUM-46 · RF-31)

## Qué se registra
- Cada llamada a `/api` lleva el encabezado `X-Correlation-Id` (UUID). El backend lo usa en sus logs, así una falla reportada se sigue de punta a punta con un solo identificador.
- Errores HTTP (`HTTP_ERROR`) y errores no controlados (`ERROR_NO_CONTROLADO`) se escriben en la consola como **una línea JSON**:

```json
{"timestamp":"2026-11-11T21:40:02.118Z","nivel":"ERROR","evento":"HTTP_ERROR","correlationId":"7b1e…","usuarioId":"12","rol":"HUESPED","ruta":"/alojamientos/4/cotizar","tipoEvento":"RESERVA","metodo":"POST","url":"/api/reservas","estado":503,"codigo":null,"duracionMs":7004}
```

## Datos sensibles
`enmascarar()` (`core/log.service.ts`) oculta antes de registrar: claves como contraseña, token, authorization, tarjeta o CVC (`[OCULTO]`), JWT dentro de textos (`[TOKEN]`) y números de 13 a 19 dígitos (`[TARJETA]`). No se registra el cuerpo de las peticiones.

## Cómo consultarlos
1. En el navegador: DevTools → Console, filtrar por `"evento":"HTTP_ERROR"`, por `"tipoEvento":"RESERVA"`, por `"usuarioId":"12"` o por la fecha del `timestamp`.
2. Copiar el `correlationId` y buscarlo en los logs JSON del backend (mismo valor en el campo `correlationId`) para ver la causa en el servidor.
