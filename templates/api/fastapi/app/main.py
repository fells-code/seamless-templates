"""The HTTP API: the Seamless Auth routes, the admin console, CORS, and the
application's own routes behind the session guard.

    uvicorn app.main:build --factory --port 3000
"""

from __future__ import annotations

import logging
import os
import sys
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from typing import Any

import httpx2
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from psycopg_pool import ConnectionPool
from seamless_auth import Adapter, Delivery, User
from seamless_auth.fastapi import RequireUser, auth_router, console_router

from . import config, db

log = logging.getLogger("app")


def build_adapter(cfg: config.Config, http_client: httpx2.Client | None = None) -> Adapter:
    """Configures the Seamless Auth adapter from the environment."""

    # Delivering OTPs and magic links from this API lets you read the code straight
    # from these logs without a mail or SMS provider. Swap this for real transports
    # before deploying, and never log a live token in production.
    def dev_deliver(d: Delivery) -> None:
        if d.magic_link_url:
            log.info("Dev magic link to=%s url=%s", d.to, d.magic_link_url)
        else:
            log.info("Dev OTP to=%s code=%s", d.to, d.token)

    prefix = cfg.cookie_prefix
    return Adapter(
        auth_server_url=cfg.auth_server_url,
        auth_server_issuer=cfg.auth_server_issuer,
        audience=cfg.audience,
        cookie_secret=cfg.cookie_signing_key,
        service_secret=cfg.api_service_token,
        jwks_kid=cfg.jwks_kid,
        cookie_domain=cfg.cookie_domain,
        access_cookie_name=f"{prefix}access",
        refresh_cookie_name=f"{prefix}refresh",
        registration_cookie_name=f"{prefix}ephemeral",
        pre_auth_cookie_name=f"{prefix}ephemeral",
        deliver=dev_deliver if cfg.development else None,
        http_client=http_client,
    )


class ProfileClient:
    """Reads the signed-in user's profile from the auth API."""

    def __init__(self, auth_server_url: str, client: httpx2.Client | None = None) -> None:
        self._url = auth_server_url.rstrip("/") + "/users/me"
        self._client = client or httpx2.Client(timeout=10.0, follow_redirects=False)

    def fetch(self, token: str) -> dict[str, Any]:
        res = self._client.get(self._url, headers={"authorization": f"Bearer {token}"})
        res.raise_for_status()
        user = res.json().get("user")
        return user if isinstance(user, dict) else {}


def create_app(
    cfg: config.Config,
    *,
    connect: Callable[[str], ConnectionPool] = db.connect,
    http_client: httpx2.Client | None = None,
) -> FastAPI:
    auth = build_adapter(cfg, http_client)
    profiles = ProfileClient(cfg.auth_server_url, http_client)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.pool = connect(cfg.database_url)
        log.info("API running at http://localhost:%s", cfg.port)
        yield
        app.state.pool.close()

    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
    # Browsers never apply CORS to a same-origin request, so the admin console at
    # /console needs no entry here. A disallowed origin gets no CORS headers and
    # the browser blocks the response.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(cfg.ui_origins),
        allow_credentials=True,
        allow_methods=["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
        allow_headers=["*"],
    )

    @app.get("/", response_class=PlainTextResponse)
    def health() -> str:
        return "Seamless API is running."

    # Serves the Seamless admin dashboard from this API's own origin, so the SPA
    # shares the cookie scope of the /auth routes. It has to load for a signed-out
    # admin, who then signs in through /auth; the dashboard's own routes enforce the
    # admin role. Serving it here requires this API's origin in the auth server's
    # ORIGINS so passkey ceremonies started in the console verify (see README).
    if cfg.serve_admin_console:
        app.include_router(console_router(auth))
    app.include_router(auth_router(auth))

    # The guard accepts the session cookie, or the auth API's access token as a
    # bearer credential, which is how the mobile starter signs its requests.
    session_user = RequireUser(auth)

    def app_user(request: Request, session: User = Depends(session_user)) -> db.User:  # noqa: B008
        """Finds or creates the application's own record of the signed-in user, keyed
        by the Seamless Auth user id. A new record takes its email and phone from the
        auth API's profile: an access token carries neither, so a bearer session would
        otherwise create a user with no contact details."""
        pool: ConnectionPool = request.app.state.pool
        try:
            user = db.find_user(pool, session.id)
            if user is not None:
                return user
            email, phone = session.email, session.phone
            try:
                profile = profiles.fetch(session.token)
                email, phone = profile.get("email"), profile.get("phone")
            except (httpx2.HTTPError, ValueError) as err:
                log.warning(
                    "Could not fetch the user profile; recording the session's details: %s",
                    type(err).__name__,
                )
            return db.create_user(pool, session.id, email, phone)
        except Exception:
            log.exception("Could not resolve the local user")
            raise HTTPException(status_code=400, detail="Failed to create user") from None

    def require_role(role: str) -> Callable[[User], User]:
        def check(session: User = Depends(session_user)) -> User:  # noqa: B008
            if role not in session.roles:
                raise HTTPException(status_code=403, detail="forbidden")
            return session

        return check

    @app.get("/beta_users", dependencies=[Depends(require_role("betaUser"))])
    def beta_users(user: db.User = Depends(app_user)) -> dict[str, Any]:  # noqa: B008
        return {
            "message": "Welcome to the beta program!",
            "access": "You have beta_user privileges.",
            "user": user.as_json(),
        }

    return app


def build() -> FastAPI:
    """The app from the environment, for `uvicorn app.main:build --factory`. A
    missing .env is fine: in Docker the variables come from the environment."""
    load_dotenv()
    logging.basicConfig(
        level=os.environ.get("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    try:
        cfg = config.load()
    except config.ConfigError as err:
        print(err, file=sys.stderr)
        raise SystemExit(1) from None
    return create_app(cfg)
