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
