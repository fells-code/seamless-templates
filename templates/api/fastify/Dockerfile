# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, tsx watch, full toolchain
#   docker build .                   -> dev, because it is the last stage
#   docker build --target runtime .  -> compiled, no compiler, runs npm start
#
# `dev` is deliberately last, which makes it the default. Everything that already
# consumes this template expects `build: .` to produce a watchable container and
# bind-mounts the source over /app to get reload. A production image under that
# mount has its compiled dist masked by a source tree that has no dist, and dies
# with MODULE_NOT_FOUND before it listens. Production is therefore opt-in, chosen
# by the thing doing the deploying, and the default stays what every existing
# caller already assumes.
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

# Last on purpose. See the note at the top of this file before moving it.
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
