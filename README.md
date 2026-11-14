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

## Despliegue

```bash
npm run build
```

Genera el bundle en `dist/marketplace-alojamientos-frontend/browser/`. Copia ese contenido a la carpeta `marketplace-web/` que está junto a `deploy/compose.yaml` en el repositorio del backend; desde ahí Caddy lo sirve como archivos estáticos y reenvía `/api/*` al Spring Boot.
