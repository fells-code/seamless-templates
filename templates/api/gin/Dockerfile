# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, rebuilt on change by air
#   docker build .                   -> runtime, because it is the last stage
#   docker build --target dev .      -> dev
#
# `runtime` is deliberately last, which makes it the default: a plain
# `docker build .`, or a platform that builds the default stage, ships a static
# binary on a distroless nonroot base. Anything that wants the dev stage
# (docker-compose.yml, the generated stack) selects it with `target: dev`. That
# stack bind-mounts the source over /app, which is why every build output lives
# outside /app (air builds into /tmp/air): the mount would hide anything built
# into it.

FROM golang:1.26-alpine AS deps
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

FROM deps AS build
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api .

FROM deps AS dev
RUN go install github.com/air-verse/air@v1.67.4
COPY . .
EXPOSE 3000
CMD ["air", "-c", ".air.toml"]

# Last on purpose, so a plain `docker build .` produces the production image.
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=build /out/api /api
EXPOSE 3000
ENTRYPOINT ["/api"]
