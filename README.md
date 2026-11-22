# marketplace-alojamientos-frontend

Aplicación web en Angular 19, con componentes standalone y signals, que consume la API REST del backend.

## Requisitos

- Node.js 22 y npm.
- La API corriendo en `http://localhost:8080`; ver la sección "Arrancar" del README del backend.

## Arrancar

```bash
npm install
npm start      # http://localhost:4200
```

Los servicios llaman a `/api/...` y `core/version-api.interceptor.ts` agrega la versión (`/api/v1/...`). En desarrollo, `proxy.conf.json` reenvía `/api` al backend sin reescribir la ruta; si la API corre en otro puerto, se cambia `target` en ese archivo. En producción, el Caddyfile del backend reenvía `/api/*` tal cual.

El mapa de pantallas y endpoints, y una prueba de punta a punta, están en [docs/INTEGRACION.md](docs/INTEGRACION.md).

## Distribución del código

```
src
├── app
│   ├── core          Servicios HTTP, sesión, guards, interceptores (versión, token y correlación) y logs
│   ├── layout        Cabecera y pie que envuelven las pantallas
│   ├── pages         Una carpeta por pantalla, con su componente, plantilla, estilos y pruebas
│   ├── shared        Calendario, diálogos, campo de contraseña, validadores y la directiva de solo números
│   ├── testing       Verificación del contrato en las pruebas
│   ├── app.routes.ts Rutas, cargadas bajo demanda y protegidas por rol
│   └── app.config.ts Router, HttpClient con sus interceptores, idioma es-CO y manejador global de errores
├── contract          Copia de la especificación OpenAPI del backend y sus tipos generados
└── styles.scss       Estilos globales y variables de color
public                Favicon, logo y fuentes
docker/Caddyfile      Servidor de la imagen
docs                  Integración con el backend, contrato y logs
```

## Contrato con el backend

`src/contract/openapi.json` es una copia de `docs/openapi.json` del backend, y `src/contract/api.d.ts` sus tipos. Cuando el backend cambia la API:

```bash
cp ../marketplace-alojamientos-backend/docs/openapi.json src/contract/openapi.json
npm run contrato:tipos
```

Si un campo que el front lee deja de existir, `testing/contrato-tipos.spec.ts` no compila. Más detalle en [docs/CONTRATO.md](docs/CONTRATO.md).

## Pruebas

```bash
npm test                                               # Karma y Jasmine, repite al guardar
npm test -- --watch=false --browsers=ChromeHeadless    # una sola vez
npm test -- --watch=false --browsers=ChromeHeadless --code-coverage    # como en el CI, con cobertura
```

La cobertura queda en `coverage/marketplace-alojamientos-frontend`: `index.html` para verla y `lcov.info` para SonarQube Cloud.

## Construcción

```bash
npm run build    # dist/marketplace-alojamientos-frontend/browser
```

## Logs

Las llamadas a la API llevan la cabecera `X-Correlation-Id`, y los errores se escriben en la consola como una línea JSON, sin datos sensibles. Ver [docs/LOGS.md](docs/LOGS.md).

## Docker

```bash
docker build -t marketplace-web .
docker run --rm -p 8081:80 marketplace-web    # http://localhost:8081
```

La imagen sirve solo los archivos estáticos con Caddy; las llamadas a `/api` necesitan el backend detrás del Caddy principal (`deploy/compose.yaml` del backend).

## Integración continua y despliegue

`.github/workflows/ci.yml` corre en cada PR y en cada push a `main`:

- **`construir-y-probar`:** `npm ci`, `npm run build`, las pruebas en ChromeHeadless con cobertura y el análisis de [SonarQube Cloud](https://sonarcloud.io/project/overview?id=nikotpab_marketplace-alojamientos-frontend) (`sonar-project.properties`). En un PR, si el quality gate queda en ERROR, el job falla y el PR no se puede fusionar; en `main` solo actualiza el análisis. Necesita el secreto `SONAR_TOKEN` y el análisis automático apagado en SonarQube Cloud; sin el secreto, el paso se omite.
- **`desplegar`:** solo en `main`. Entra a AWS por OIDC, construye la imagen para ARM y la publica en ECR como `marketplace-web:<commit>`. Luego pide a la EC2, por SSM, que la despliegue: `deploy/desplegar.sh web <commit>` del backend copia `/srv` de la imagen a una carpeta por versión y cambia de una vez el enlace que sirve Caddy.

La preparación de una sola vez (el stack de CloudFormation y las variables `AWS_ROL_DESPLIEGUE`, `AWS_DOCUMENTO_DESPLIEGUE` y `AWS_INSTANCIA` de este repositorio) y cómo volver a una versión anterior están en "Despliegue en AWS" del README del backend. Sin esas variables el job no corre. Para desplegar `main` otra vez sin un commit nuevo: `gh workflow run CI --ref main`.
