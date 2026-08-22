# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build      -> the `dev` target, tsx watch, full toolchain
#   docker build .                 -> the `runtime` target, compiled, no compiler
#
# The dependency layer is keyed on the lock file alone. That is deliberate: it
# means two projects scaffolded from this template share the layer, so the second
# image to build pushes only its own source.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

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
