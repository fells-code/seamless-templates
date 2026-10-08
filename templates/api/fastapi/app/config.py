"""This API's environment, checked once at boot."""

from __future__ import annotations

import logging
import os
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from urllib.parse import parse_qsl, quote, urlencode, urlsplit, urlunsplit

log = logging.getLogger(__name__)

REQUIRED = [
    (
        "AUTH_SERVER_URL",
        "The Seamless Auth instance this API trusts, for example http://localhost:5312.",
    ),
    ("COOKIE_SIGNING_KEY", "Any secret string. It signs the cookies this API issues."),
    (
        "API_SERVICE_TOKEN",
        "The secret shared with Seamless Auth. `seamless init` writes it for a local stack; "
        "managed applications issue it from the dashboard.",
    ),
    ("JWKS_KID", "The key id the auth server signs tokens with, for example dev-main."),
]
DISCRETE_DB_VARS = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"]
# `seamless init` writes a managed DATABASE_URL with these literal placeholders in
# place of the credentials, which only the dashboard can show.
CREDENTIAL_PLACEHOLDERS = {"USER", "PASSWORD"}


class ConfigError(Exception):
    """The environment cannot start the API."""


@dataclass(frozen=True)
class Config:
    auth_server_url: str
    cookie_signing_key: str = field(repr=False)
    api_service_token: str = field(repr=False)
    jwks_kid: str
    database_url: str = field(repr=False)
    auth_server_issuer: str | None = None
    development: bool = False
    port: int = 3000
    cookie_domain: str | None = None
    cookie_prefix: str = "seamless-"
    serve_admin_console: bool = False
    ui_origins: tuple[str, ...] = ()

    @property
    def audience(self) -> str:
        """The aud the adapter expects: the auth server signs its issuer into aud as
        well as iss."""
        return self.auth_server_issuer or self.auth_server_url


def load(env: Mapping[str, str] | None = None) -> Config:
    """Reads the environment and refuses to start on any problem, naming every one
    at once: a missing value would otherwise surface as a 500 on the first
    authenticated request rather than as a failure to boot."""
    values: Mapping[str, str] = os.environ if env is None else env

    def get(name: str) -> str:
        return (values.get(name) or "").strip()

    problems = [f"{name} is not set. {hint}" for name, hint in REQUIRED if not get(name)]
    database_url, problem = resolve_database_url(get)
    if problem:
        problems.append(problem)
    port = get("PORT") or "3000"
    if not port.isdigit():
        problems.append("PORT is not a port number.")

    if problems:
        heading = (
            "Cannot start: 1 environment problem."
            if len(problems) == 1
            else f"Cannot start: {len(problems)} environment problems."
        )
        listed = "\n".join(f"  - {p}" for p in problems)
        raise ConfigError(
            f"\n{heading}\n\n{listed}\n\n"
            "Copy .env.example to .env and fill these in, then start the API again.\n"
        )

    origins = tuple(o.strip() for o in get("UI_ORIGINS").split(",") if o.strip())
    if not origins:
        log.warning(
            "UI_ORIGINS is empty, so CORS will reject every browser request from another "
            "origin. Set it to your web app origin, for example http://localhost:5173."
        )

    return Config(
        auth_server_url=get("AUTH_SERVER_URL"),
        auth_server_issuer=get("AUTH_SERVER_ISSUER") or None,
        cookie_signing_key=values.get("COOKIE_SIGNING_KEY", ""),
        api_service_token=values.get("API_SERVICE_TOKEN", ""),
        jwks_kid=get("JWKS_KID"),
        database_url=database_url,
        development=get("APP_ENV") == "development",
        port=int(port),
        cookie_domain=get("COOKIE_DOMAIN") or None,
        cookie_prefix=get("AUTH_COOKIE_PREFIX") or "seamless-",
        serve_admin_console=get("SERVE_ADMIN_CONSOLE") == "true",
        ui_origins=origins,
    )


def resolve_database_url(get: Callable[[str], str]) -> tuple[str, str | None]:
    """Where this API's database lives, and what is wrong with it, if anything.

    DATABASE_URL wins when set: a managed Seamless database is handed out as a
    connection string. Everything else is built from the discrete DB_* variables
    the local Docker stack uses.

    TLS keeps certificate verification on: sslmode=require (what a managed database
    asks for) becomes verify-full, unless DB_SSL_REJECT_UNAUTHORIZED is false, for a
    database whose certificate does not chain to a public CA.
    """
    raw = get("DATABASE_URL")
    if not raw:
        missing = [name for name in DISCRETE_DB_VARS if not get(name)]
        if missing:
            listed = f"Set DATABASE_URL, or all of {', '.join(DISCRETE_DB_VARS)}"
            if len(missing) == len(DISCRETE_DB_VARS):
                return "", f"{listed}."
            return "", f"{listed} (missing {', '.join(missing)})."
        user = quote(get("DB_USER"), safe="")
        password = quote(get("DB_PASSWORD"), safe="")
        host = f"{get('DB_HOST')}:{get('DB_PORT')}"
        return f"postgresql://{user}:{password}@{host}/{get('DB_NAME')}?sslmode=disable", None

    parts = urlsplit(raw)
    if parts.scheme not in ("postgres", "postgresql") or not parts.hostname:
        return "", (
            "DATABASE_URL is not a valid connection string. "
            "Expected postgres://user:password@host:port/database."
        )
    if parts.username in CREDENTIAL_PLACEHOLDERS or parts.password in CREDENTIAL_PLACEHOLDERS:
        return "", (
            "DATABASE_URL still carries the USER and PASSWORD placeholders that `seamless "
            "init` wrote. Copy the real credentials from the Seamless dashboard."
        )

    query = parse_qsl(parts.query, keep_blank_values=True)
    kept = {"disable", "allow", "prefer", "verify-ca", "verify-full"}
    if any(k == "sslmode" and v not in kept for k, v in query):
        mode = "require" if get("DB_SSL_REJECT_UNAUTHORIZED") == "false" else "verify-full"
        query = [(k, mode if k == "sslmode" else v) for k, v in query]
        return urlunsplit(parts._replace(query=urlencode(query))), None
    return raw, None
