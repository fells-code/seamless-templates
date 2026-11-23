# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, tsx watch, full toolchain
#   docker build .                   -> runtime, because it is the last stage
#   docker build --target dev .      -> dev
#
# `runtime` is deliberately last, which makes it the default: a plain
# `docker build .`, or a platform that builds the default stage, ships the
# compiled server running as `node` with NODE_ENV=production. The dev stage runs
# as root with development messaging, which logs one-time codes and magic links,
# so it is never the default. Anything that wants it (docker-compose.yml, the
# generated stack) selects it with `target: dev`. That stack bind-mounts the
# source over /app for reload, which would mask the runtime image's compiled
# dist.
#
# The dependency layer is keyed on the lock file alone. That is deliberate: two
# projects scaffolded from this template share the layer, so the second image to
# build pushes only its own source.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Last on purpose, so a plain `docker build .` produces the production image.
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
# sequelize-cli resolves its config, migrations and models from the source tree
# through .sequelizerc rather than from dist, so these four ship as source. See
# scripts/runMigrations.js, which npm start runs before the server listens.
COPY config ./config
COPY migrations ./migrations
COPY models ./models
COPY scripts ./scripts
COPY .sequelizerc ./

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
