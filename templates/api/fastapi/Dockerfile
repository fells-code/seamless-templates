# Two targets from one file, so dev and production cannot drift apart.
#
#   docker compose up --build        -> dev, uvicorn reloading on change
#   docker build .                   -> runtime, because it is the last stage
#   docker build --target dev .      -> dev
#
# `runtime` is deliberately last, which makes it the default: a plain
# `docker build .`, or a platform that builds the default stage, ships the
# production dependencies running as an unprivileged user with no reload.
# Anything that wants the dev stage (docker-compose.yml, the generated stack)
# selects it with `target: dev`. That stack bind-mounts the source over /app,
# which is why the virtualenv lives at /venv: the mount would hide one under /app.

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

FROM base AS dev
RUN uv sync --locked
# The generated stack bind-mounts the source over /app and runs this as root. On a
# Linux host, __pycache__ under /app would be root's and block removing the project.
ENV PYTHONPYCACHEPREFIX=/tmp/pycache
COPY . .
EXPOSE 3000
CMD ["uvicorn", "app.main:build", "--factory", "--reload", "--host", "0.0.0.0", "--port", "3000"]

# Last on purpose, so a plain `docker build .` produces the production image.
FROM base AS runtime
RUN uv sync --locked --no-dev
COPY . .
RUN useradd --system --no-create-home app
USER app
EXPOSE 3000
CMD ["uvicorn", "app.main:build", "--factory", "--host", "0.0.0.0", "--port", "3000"]
