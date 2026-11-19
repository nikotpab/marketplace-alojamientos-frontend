# Contrato OpenAPI

## Origen del archivo

`src/contract/openapi.json` es una copia del contrato que genera el backend
(rama `SCRUM-129-contrato-openapi`, archivo `docs/openapi.json`).
El backend es la única fuente de verdad.

## Cómo actualizarlo

Cuando el backend publique un nuevo `docs/openapi.json`:

1. Copia el archivo: `cp <backend>/docs/openapi.json src/contract/openapi.json`
2. Regenera los tipos: `npm run contrato:tipos`
3. Corre las pruebas: `npm test -- --watch=false --browsers=ChromeHeadless`

Si el paso 3 falla con errores de compilación en `contrato-tipos.spec.ts`,
hay una ruptura de contrato que el equipo de backend debe resolver antes de
hacer el merge.
