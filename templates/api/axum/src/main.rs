//! The Seamless Auth Axum starter API.

mod config;
mod db;
mod server;

use std::io::IsTerminal;
use std::net::SocketAddr;

use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() {
    if let Err(err) = run().await {
        eprintln!("{err}");
        std::process::exit(1);
    }
}

async fn run() -> Result<(), String> {
    // A missing .env is fine: in Docker the variables come from the environment.
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        // Colour only on a terminal: container logs keep plain text.
        .with_ansi(std::io::stdout().is_terminal())
        .init();

    let cfg = config::Config::load(|name| std::env::var(name).ok())?;
    let auth = server::adapter(&cfg).map_err(|e| e.to_string())?;
    let pool = db::connect(&cfg.database_url)
        .await
        .map_err(|e| format!("Could not connect to the database: {e}"))?;
    let app = server::router(&cfg, &auth, pool);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", cfg.port))
        .await
        .map_err(|e| format!("Could not listen on port {}: {e}", cfg.port))?;
    tracing::info!("API running at http://localhost:{}", cfg.port);
    // Connect info gives the adapter the peer address to forward to the auth API.
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown())
    .await
    .map_err(|e| e.to_string())
}

async fn shutdown() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    #[cfg(unix)]
    let term = async {
        if let Ok(mut signal) =
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        {
            signal.recv().await;
        }
    };
    #[cfg(not(unix))]
    let term = std::future::pending::<()>();
    tokio::select! {
        () = ctrl_c => {}
        () = term => {}
    }
}
