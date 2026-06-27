FROM node:20-alpine

# Set timezone to UTC and install tzdata to prevent log clock skew
RUN apk add --no-cache tzdata
ENV TZ=UTC

# Create a non-root user to run the app. Reduces blast radius of any RCE.
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source and hand ownership to non-root user
COPY --chown=app:app src ./src

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R app:app /app

ENV NODE_ENV=production
EXPOSE 5000

USER app

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["node", "src/server.js"]