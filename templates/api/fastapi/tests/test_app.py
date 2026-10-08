from __future__ import annotations

import httpx2
from fastapi.testclient import TestClient

from app import config
from app.main import create_app


def upstream(request: httpx2.Request) -> httpx2.Response:
    """Stands in for the auth API."""
    if request.url.path == "/console":
        return httpx2.Response(
            200, text="<html>console</html>", headers={"content-type": "text/html"}
        )
    if request.url.path == "/login":
        return httpx2.Response(400, json={"error": "invalid_request"})
    return httpx2.Response(404, json={"error": "not_found"})


def client(serve_console: bool = True) -> TestClient:
    cfg = config.Config(
        auth_server_url="http://auth.test",
        cookie_signing_key="cookie-secret-cookie-secret-cookie-secret",
        api_service_token="service-secret-service-secret-service-secret",
        jwks_kid="dev-main",
        database_url="",
        serve_admin_console=serve_console,
        ui_origins=("http://localhost:5173",),
    )
    http = httpx2.Client(transport=httpx2.MockTransport(upstream))
    # No lifespan, so no database: nothing here gets past the session guard.
    app = create_app(cfg, http_client=http, connect=lambda _url: None)  # type: ignore[arg-type,return-value]
    return TestClient(app)


def test_the_root_answers() -> None:
    r = client().get("/")
    assert (r.status_code, r.text) == (200, "Seamless API is running.")


def test_the_auth_routes_reach_the_auth_api() -> None:
    r = client().post("/auth/login", json={})
    assert r.status_code == 400
    assert r.json()["error"] == "invalid_request"


def test_the_console_is_served_when_enabled() -> None:
    for target in ("/console", "/console/"):
        r = client().get(target, headers={"origin": "http://elsewhere.example"})
        assert (r.status_code, r.text) == (200, "<html>console</html>"), target
    assert client(serve_console=False).get("/console/").status_code == 404


def test_app_routes_need_a_session() -> None:
    r = client().get("/beta_users")
    assert r.status_code == 401


def test_cors() -> None:
    preflight = {
        "origin": "http://localhost:5173",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
    }
    r = client().options("/auth/login", headers=preflight)
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert r.headers["access-control-allow-credentials"] == "true"

    r = client().options(
        "/auth/login",
        headers={"origin": "http://evil.example", "access-control-request-method": "POST"},
    )
    assert "access-control-allow-origin" not in r.headers
