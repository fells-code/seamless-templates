"""Postgres: the connection, migrations, and the application's own record of each
Seamless Auth user."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

import psycopg
from psycopg import sql
from psycopg.conninfo import conninfo_to_dict, make_conninfo
from psycopg.rows import class_row
from psycopg_pool import ConnectionPool

log = logging.getLogger(__name__)

MIGRATIONS = Path(__file__).resolve().parent.parent / "migrations"
# Serializes migrations across replicas that boot together.
MIGRATION_LOCK = 73_651_002


def connect(database_url: str) -> ConnectionPool:
    """Opens a pool, creating the database first if it does not exist yet (a fresh
    local Postgres has only the default database), then runs every migration not
    yet applied."""
    try:
        psycopg.connect(database_url, connect_timeout=10).close()
    except psycopg.OperationalError as err:
        if "does not exist" not in str(err):
            raise
        log.info("Database does not exist yet. Creating it.")
        _create_database(database_url)

    pool = ConnectionPool(database_url, min_size=1, max_size=10, open=True)
    with pool.connection() as conn:
        _migrate(conn)
    log.info("Database connection established.")
    return pool


def _create_database(database_url: str) -> None:
    params: dict[str, Any] = conninfo_to_dict(database_url)
    name = params.pop("dbname")
    with psycopg.connect(
        make_conninfo(**{**params, "dbname": "postgres"}), autocommit=True
    ) as conn:
        conn.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(name)))


def _migrate(conn: psycopg.Connection[Any]) -> None:
    conn.execute("SELECT pg_advisory_lock(%s)", (MIGRATION_LOCK,))
    try:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS schema_migrations (
                name       TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"""
        )
        conn.commit()
        for path in sorted(MIGRATIONS.glob("*.sql")):
            row = conn.execute("SELECT 1 FROM schema_migrations WHERE name = %s", (path.name,))
            if row.fetchone():
                continue
            with conn.transaction():
                conn.execute(path.read_text())
                conn.execute("INSERT INTO schema_migrations (name) VALUES (%s)", (path.name,))
            log.info("Applied migration %s", path.name)
    finally:
        conn.execute("SELECT pg_advisory_unlock(%s)", (MIGRATION_LOCK,))
        conn.commit()


@dataclass(frozen=True)
class User:
    """The application's own record of a Seamless Auth user, keyed by the Seamless
    Auth user id."""

    id: str
    email: str | None
    phone: str | None
    created_at: datetime
    updated_at: datetime

    def as_json(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "phone": self.phone,
            "createdAt": self.created_at.isoformat(),
            "updatedAt": self.updated_at.isoformat(),
        }


def find_user(pool: ConnectionPool, user_id: str) -> User | None:
    with pool.connection() as conn, conn.cursor(row_factory=class_row(User)) as cur:
        cur.execute(
            "SELECT id, email, phone, created_at, updated_at FROM users WHERE id = %s",
            (user_id,),
        )
        return cur.fetchone()


def create_user(pool: ConnectionPool, user_id: str, email: str | None, phone: str | None) -> User:
    """Records a Seamless Auth user on first sight and returns the record.
    Concurrent first requests for one user both succeed."""
    with pool.connection() as conn:
        conn.execute(
            "INSERT INTO users (id, email, phone) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING",
            (user_id, email.lower() if email else None, phone),
        )
    user = find_user(pool, user_id)
    if user is None:
        raise LookupError(f"user {user_id} vanished after insert")
    return user
