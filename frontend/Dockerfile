# Build stage — produces the static bundle
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Default to same-origin /api/v1 so nginx reverse-proxy "just works".
# Override at build time with --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Serve stage — nginx with hardened config
FROM nginx:1.27-alpine

# Create non-root user for nginx worker (master still runs as root to bind :80)
RUN addgroup -S app 2>/dev/null || true \
 && adduser -S app -G app 2>/dev/null || true

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]