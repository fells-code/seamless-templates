# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, uvicorn reloading on change
#   docker build .                   -> dev, because it is the last stage
#   docker build --target runtime .  -> production dependencies only, no reload
#
# `dev` is deliberately last, which makes it the default. Everything that
# consumes this template expects `build: .` to produce a reloading container and
# bind-mounts the source over /app. That is also why the virtualenv lives at
# /venv: the mount would hide one under /app.

FROM python:3.13-slim AS base
COPY --from=ghcr.io/astral-sh/uv:0.12.24 /uv /bin/uv
ENV UV_PROJECT_ENVIRONMENT=/venv \
    UV_PYTHON_DOWNLOADS=never \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY pyproject.toml uv.lock ./

FROM base AS runtime
RUN uv sync --locked --no-dev
COPY . .
RUN useradd --system --no-create-home app
USER app
EXPOSE 3000
CMD ["uvicorn", "app.main:build", "--factory", "--host", "0.0.0.0", "--port", "3000"]

# Last on purpose. See the note at the top of this file before moving it.
FROM base AS dev
RUN uv sync --locked
COPY . .
EXPOSE 3000
CMD ["uvicorn", "app.main:build", "--factory", "--reload", "--host", "0.0.0.0", "--port", "3000"]
