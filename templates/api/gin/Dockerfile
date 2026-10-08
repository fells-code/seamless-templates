# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, rebuilt on change by air
#   docker build .                   -> dev, because it is the last stage
#   docker build --target runtime .  -> a static binary on a distroless base
#
# `dev` is deliberately last, which makes it the default. Everything that
# consumes this template expects `build: .` to produce a reloading container and
# bind-mounts the source over /app. That is also why every build output lives
# outside /app (air builds into /tmp/air): the mount would hide anything built
# into it.

FROM golang:1.26-alpine AS deps
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

FROM deps AS build
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api .

FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=build /out/api /api
EXPOSE 3000
ENTRYPOINT ["/api"]

# Last on purpose. See the note at the top of this file before moving it.
FROM deps AS dev
RUN go install github.com/air-verse/air@v1.67.4
COPY . .
EXPOSE 3000
CMD ["air", "-c", ".air.toml"]
