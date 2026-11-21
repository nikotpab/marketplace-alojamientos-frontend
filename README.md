# marketplace-alojamientos-frontend

Frontend en Angular del Marketplace de Alojamientos de Inversiones LR.

## Con el backend

1. Levanta el backend en `http://localhost:8080`, como explica su README (sección "Con el frontend y datos de demostración").
2. Instala las dependencias y arranca el frontend:

```bash
npm install
npm start
```

3. Abre `http://localhost:4200`.

Los servicios llaman a `/api/...` y `core/version-api.interceptor.ts` agrega la versión (`/api/v1/...`). En desarrollo, `proxy.conf.json` reenvía `/api` al backend; si corre en otro puerto, cambia `target` en ese archivo. En producción, el Caddyfile del backend reenvía `/api/*` tal cual.

El mapa completo de pantallas y endpoints, lo que el backend todavía no permite y una prueba de punta a punta están en [docs/INTEGRACION.md](docs/INTEGRACION.md). Los logs del front se explican en [docs/LOGS.md](docs/LOGS.md).

## Estructura de carpetas

Todo el código de la aplicación vive bajo `src/app/`:

- **`pages/`** — una subcarpeta por pantalla (auth, busqueda, detalle, reservas, admin, etc.). Cada una agrupa su componente, estilos y lógica local.
- **`core/`** — servicios, interceptores y guards de uso transversal: llamadas al backend, manejo de sesión, versión de la API y logs.
- **`shared/`** — componentes reutilizables entre páginas: calendario de disponibilidad, diálogos genéricos y la directiva de solo-números.
- **`layout/`** — cabecera y pie de página que envuelven las vistas de la aplicación.

## Pruebas

```bash
npm test
```

Ejecuta la suite con Karma en modo watch (el navegador se queda abierto y repite al guardar). Para ejecutarlas una sola vez:

```bash
npm test -- --watch=false
```

## Docker

```bash
docker build -t marketplace-web .
docker run --rm -p 8081:80 marketplace-web
```

Abre `http://localhost:8081`. La imagen sirve solo los archivos estáticos; las llamadas a `/api` necesitan el backend detrás del Caddy principal (ver `deploy/compose.yaml` en el repositorio del backend).

## Despliegue

Cada push a `main` que pasa el CI se despliega solo (SCRUM-121). El job `desplegar` de `.github/workflows/ci.yml` entra a AWS por OIDC, construye esta imagen para ARM y la publica en ECR como `marketplace-web:<commit>`. Luego pide a la EC2, por SSM, que la despliegue: `deploy/desplegar.sh web <commit>` del backend copia `/srv` de la imagen a una carpeta por versión y cambia de una vez el enlace que sirve Caddy.

La preparación de una sola vez (stack de CloudFormation y variables `AWS_ROL_DESPLIEGUE`, `AWS_DOCUMENTO_DESPLIEGUE` y `AWS_INSTANCIA` de este repositorio) y cómo volver a una versión anterior están en "Despliegue en AWS" del README del backend. Sin esas variables el job no corre. Para desplegar `main` otra vez sin un commit nuevo: `gh workflow run CI --ref main`.
