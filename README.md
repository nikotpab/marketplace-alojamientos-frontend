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

Los servicios llaman a `/api/...`. En desarrollo, `proxy.conf.json` reenvía esas llamadas al backend y las reescribe como `/api/v1/...`, la versión de la API que publica el backend. Si el backend corre en otro puerto, cambia `target` en ese archivo.
