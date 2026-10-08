from __future__ import annotations

import pytest

from app import config


def complete() -> dict[str, str]:
    return {
        "AUTH_SERVER_URL": "http://localhost:5312",
        "COOKIE_SIGNING_KEY": "cookie-secret-cookie-secret-cookie-secret",
        "API_SERVICE_TOKEN": "service-secret-service-secret-service-secret",
        "JWKS_KID": "dev-main",
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "seamless_api",
        "DB_USER": "myuser",
        "DB_PASSWORD": "my pass@word",
        "UI_ORIGINS": "http://localhost:5173, http://localhost:5174",
    }


def test_a_complete_environment_loads() -> None:
    cfg = config.load(complete())
    assert cfg.port == 3000
    assert cfg.cookie_prefix == "seamless-"
    assert not cfg.serve_admin_console and not cfg.development
    assert cfg.ui_origins == ("http://localhost:5173", "http://localhost:5174")
    assert cfg.database_url == (
        "postgresql://myuser:my%20pass%40word@localhost:5432/seamless_api?sslmode=disable"
    )
    assert cfg.audience == "http://localhost:5312"
    assert "cookie-secret" not in repr(cfg)


def test_every_problem_is_reported_at_once() -> None:
    with pytest.raises(config.ConfigError) as err:
        config.load({})
    for want in [
        "5 environment problems",
        "AUTH_SERVER_URL",
        "COOKIE_SIGNING_KEY",
        "API_SERVICE_TOKEN",
        "JWKS_KID",
        "Set DATABASE_URL, or all of",
    ]:
        assert want in str(err.value)


def test_a_partial_database_configuration_names_what_is_missing() -> None:
    values = complete()
    del values["DB_NAME"]
    with pytest.raises(config.ConfigError, match=r"\(missing DB_NAME\)"):
        config.load(values)


def test_the_issuer_is_the_audience_when_set() -> None:
    assert config.load({**complete(), "AUTH_SERVER_ISSUER": "http://auth:5312"}).audience == (
        "http://auth:5312"
    )


@pytest.mark.parametrize(
    ("url", "reject", "want", "problem"),
    [
        ("postgres://a:b@db.example:5432/app", "", "postgres://a:b@db.example:5432/app", None),
        (
            "postgres://a:b@db.example/app?sslmode=require",
            "",
            "postgres://a:b@db.example/app?sslmode=verify-full",
            None,
        ),
        (
            "postgres://a:b@db.example/app?sslmode=require",
            "false",
            "postgres://a:b@db.example/app?sslmode=require",
            None,
        ),
        (
            "postgres://a:b@db.example/app?sslmode=verify-ca",
            "",
            "postgres://a:b@db.example/app?sslmode=verify-ca",
            None,
        ),
        ("postgres://USER:PASSWORD@db.example/app", "", None, "placeholders"),
        ("mysql://x", "", None, "not a valid connection string"),
    ],
)
def test_database_urls(url: str, reject: str, want: str | None, problem: str | None) -> None:
    values = {**complete(), "DATABASE_URL": url, "DB_SSL_REJECT_UNAUTHORIZED": reject}
    got, found = config.resolve_database_url(lambda name: values.get(name, "").strip())
    if problem:
        assert found is not None and problem in found
    else:
        assert found is None and got == want
