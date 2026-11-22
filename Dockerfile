# Etapa 1: compilar la aplicación Angular. Corre en la plataforma de quien construye: el CI publica la imagen
# para la EC2, que es ARM (t4g), sin emular la compilación.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app

# Copiar solo el manifiesto primero para aprovechar la caché de capas
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Compilar el bundle de producción
COPY . .
RUN npm run build

# Etapa 2: servir los archivos estáticos con Caddy. En el servidor, el despliegue copia /srv a la carpeta que sirve el
# Caddy principal del backend (deploy/desplegar.sh web).
FROM caddy:2-alpine
COPY --from=build /app/dist/marketplace-alojamientos-frontend/browser /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
