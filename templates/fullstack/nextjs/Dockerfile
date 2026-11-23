# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, next dev with reload
#   docker build .                   -> runtime, because it is the last stage
#   docker build --target dev .      -> dev
#
# `runtime` is deliberately last, which makes it the default: a plain
# `docker build .`, or a platform that builds the default stage, ships the
# standalone server running as `node` with NODE_ENV=production. The dev stage
# runs next dev as root, and its messaging handlers in src/lib/config.ts print
# one-time codes and magic links to its logs, so it is never the default. The
# local stack selects it with `target: dev` and bind-mounts the source over
# /app for reload.
#
# Port 8080 and /health are what the generated compose file expects of the web
# container, in both targets. 8080 rather than 80 so the runtime target, which
# runs as the unprivileged node user, needs no privileged port.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM deps AS dev
COPY . .
EXPOSE 8080
HEALTHCHECK CMD node -e "fetch('http://localhost:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "dev", "--port", "8080", "--hostname", "0.0.0.0"]

# Last on purpose, so a plain `docker build .` produces the production image.
# The standalone output is a self-contained server with only the dependencies it
# uses, so this image carries no node_modules of its own.
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# node owns /app so the server can write its cache under .next at runtime.
RUN chown node:node /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 8080
HEALTHCHECK CMD node -e "fetch('http://localhost:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
