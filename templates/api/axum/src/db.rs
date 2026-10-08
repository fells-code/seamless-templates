//! Postgres: the connection, migrations, and the application's own record of
//! each Seamless Auth user.

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::migrate::MigrateDatabase;
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::{FromRow, Postgres};

/// Opens a pool, creating the database first if it does not exist yet (a fresh
/// local Postgres has only the default database), then runs every migration not
/// yet applied. The migrations are embedded in the binary, and the migrator
/// holds an advisory lock so replicas that boot together take turns.
pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    if !Postgres::database_exists(database_url).await? {
        tracing::info!("Database does not exist yet. Creating it.");
        Postgres::create_database(database_url).await?;
    }
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    tracing::info!("Database connection established.");
    Ok(pool)
}

/// The application's own record of a Seamless Auth user, keyed by the Seamless
/// Auth user id.
#[derive(Clone, Debug, FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// The local user for a Seamless Auth user id, if there is one.
pub async fn find_user(pool: &PgPool, id: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        "SELECT id, email, phone, created_at, updated_at FROM users WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// Records a Seamless Auth user on first sight and returns the record.
/// Concurrent first requests for one user both succeed.
pub async fn create_user(
    pool: &PgPool,
    id: &str,
    email: Option<&str>,
    phone: Option<&str>,
) -> Result<User, sqlx::Error> {
    sqlx::query(
        "INSERT INTO users (id, email, phone) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
    )
    .bind(id)
    .bind(email.map(str::to_lowercase))
    .bind(phone)
    .execute(pool)
    .await?;
    find_user(pool, id).await?.ok_or(sqlx::Error::RowNotFound)
}
