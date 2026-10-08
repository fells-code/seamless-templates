# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, rebuilt on change by watchexec
#   docker build .                   -> dev, because it is the last stage
#   docker build --target runtime .  -> a release binary on a distroless base
#
# `dev` is deliberately last, which makes it the default. Everything that
# consumes this template expects `build: .` to produce a reloading container and
# bind-mounts the source over /app. That is also why cargo builds into /target:
# the mount would hide anything built under /app.

FROM rust:1.99-bookworm AS base
WORKDIR /app
ENV CARGO_TARGET_DIR=/target
COPY Cargo.toml Cargo.lock ./
# Dependencies are compiled against a placeholder main, so a source change
# rebuilds only this crate.
RUN mkdir src && echo "fn main() {}" > src/main.rs

FROM base AS build
RUN cargo build --release --locked
COPY . .
RUN touch src/main.rs && cargo build --release --locked && cp /target/release/seamless-api /seamless-api

FROM gcr.io/distroless/cc-debian12:nonroot AS runtime
COPY --from=build /seamless-api /seamless-api
EXPOSE 3000
ENTRYPOINT ["/seamless-api"]

# Last on purpose. See the note at the top of this file before moving it.
FROM base AS dev
ARG TARGETARCH
ARG WATCHEXEC_VERSION=2.8.0
RUN case "$TARGETARCH" in arm64) arch=aarch64 ;; *) arch=x86_64 ;; esac \
    && curl -fsSL "https://github.com/watchexec/watchexec/releases/download/v${WATCHEXEC_VERSION}/watchexec-${WATCHEXEC_VERSION}-${arch}-unknown-linux-musl.tar.xz" \
    | tar -xJ --strip-components=1 -C /usr/local/bin "watchexec-${WATCHEXEC_VERSION}-${arch}-unknown-linux-musl/watchexec"
RUN cargo build --locked
COPY . .
EXPOSE 3000
CMD ["watchexec", "--restart", "--exts", "rs,toml,sql", "--", "cargo", "run", "--locked"]
