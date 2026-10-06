# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, next dev with reload
#   docker build .                   -> dev, because it is the last stage
#   docker build --target runtime .  -> production, the standalone server
#
# `dev` is deliberately last, which makes it the default, as in the Express
# starter. The local stack bind-mounts the source over /app for reload, and
# runs this container in development so the messaging handlers in
# src/lib/config.ts print one-time codes and magic links to its logs: the local
# auth server sends neither in development. Production is opt-in, chosen by the
# thing doing the deploying.
#
# Port 80 and /health are what the generated compose file expects of the web
# container, in both targets.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

# The standalone output is a self-contained server with only the dependencies it
# uses, so this image carries no node_modules of its own.
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 80
HEALTHCHECK CMD node -e "fetch('http://localhost/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

# Last on purpose. See the note at the top of this file before moving it.
FROM deps AS dev
COPY . .
EXPOSE 80
HEALTHCHECK CMD node -e "fetch('http://localhost/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npx", "next", "dev", "--port", "80", "--hostname", "0.0.0.0"]
