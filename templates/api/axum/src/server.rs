//! The HTTP API: the Seamless Auth routes, the admin console, CORS, and the
//! application's own routes behind the session guard.

use std::time::Duration;

use axum::extract::{Request, State};
use axum::http::{HeaderMap, HeaderValue, Method, StatusCode, header::HOST};
use axum::middleware::{self, Next};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Extension, Json, Router};
use seamless_auth::{Adapter, BuildError, Delivery};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use tower_http::cors::{AllowHeaders, AllowOrigin, CorsLayer};

use crate::config::Config;
use crate::db;

/// Configures the Seamless Auth adapter from the environment.
pub fn adapter(cfg: &Config) -> Result<Adapter, BuildError> {
    let prefix = &cfg.cookie_prefix;
    let mut builder = Adapter::builder(&cfg.auth_server_url)
        .audience(cfg.audience())
        .cookie_secret(&cfg.cookie_signing_key)
        .service_secret(&cfg.api_service_token)
        .jwks_kid(&cfg.jwks_kid)
        .session_cookie_names(format!("{prefix}access"), format!("{prefix}refresh"))
        .flow_cookie_names(format!("{prefix}ephemeral"), format!("{prefix}ephemeral"));
    if let Some(issuer) = &cfg.auth_server_issuer {
        builder = builder.auth_server_issuer(issuer);
    }
    if let Some(domain) = &cfg.cookie_domain {
        builder = builder.cookie_domain(domain);
    }
    // Delivering OTPs and magic links from this API lets you read the code
    // straight from these logs without a mail or SMS provider. Swap this for real
    // transports before deploying, and never log a live token in production.
    if cfg.development {
        builder = builder.deliver(|d: Delivery| async move {
            match &d.magic_link_url {
                Some(url) => tracing::info!(to = %d.to, url = %url, "Dev magic link"),
                None => {
                    tracing::info!(to = %d.to, code = %d.token.as_deref().unwrap_or(""), "Dev OTP")
                }
            }
            Ok::<_, std::convert::Infallible>(())
        });
    }
    builder.build()
}

#[derive(Clone)]
struct AppState {
    pool: PgPool,
    profiles: ProfileClient,
}

/// Builds the router.
pub fn router(cfg: &Config, auth: &Adapter, pool: PgPool) -> Router {
    let state = AppState {
        pool,
        profiles: ProfileClient::new(&cfg.auth_server_url),
    };

    // The guard accepts the session cookie, or the auth API's access token as a
    // bearer credential, which is how the mobile starter signs its requests. A
    // layer added later runs first: the session, then the local user, then roles.
    let app = Router::new()
        .route(
            "/beta_users",
            get(beta_content).route_layer(middleware::from_fn(|req, next| {
                require_role("betaUser", req, next)
            })),
        )
        .route_layer(middleware::from_fn_with_state(state.clone(), require_user))
        .route_layer(auth.require_auth())
        .with_state(state);

    let api = Router::new()
        .nest("/auth", auth.router())
        .merge(app)
        .layer(cors(cfg.ui_origins.clone()));

    let mut root = Router::new().route("/", get(|| async { "Seamless API is running." }));
    // Serves the Seamless admin dashboard from this API's own origin, so the SPA
    // shares the cookie scope of the /auth routes.
    //
    // Outside CORS on purpose. The console is same-origin static content served
    // by this API, not a cross-origin API call, so gating it on UI_ORIGINS would
    // reject the SPA's own asset requests (its module script is crossorigin, so
    // the browser sends an Origin header). It also has to load for a signed-out
    // admin, who then signs in through /auth; the dashboard's own routes enforce
    // the admin role. Serving it here requires this API's origin in the auth
    // server's ORIGINS so passkey ceremonies started in the console verify.
    if cfg.serve_admin_console {
        root = root.merge(auth.console_router());
    }
    root.merge(api)
}

async fn beta_content(Extension(user): Extension<db::User>) -> Json<serde_json::Value> {
    Json(json!({
        "message": "Welcome to the beta program!",
        "access": "You have beta_user privileges.",
        "user": user,
    }))
}

/// Finds or creates the application's own record of the signed-in user, keyed by
/// the Seamless Auth user id. A new record takes its email and phone from the
/// auth API's profile: an access token carries neither, so a bearer session would
/// otherwise create a user with no contact details.
async fn require_user(State(state): State<AppState>, mut req: Request, next: Next) -> Response {
    let Some(session) = req.extensions().get::<seamless_auth::User>().cloned() else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "unauthenticated" })),
        )
            .into_response();
    };

    let user = match db::find_user(&state.pool, &session.id).await {
        Ok(Some(user)) => Ok(user),
        Ok(None) => {
            let (mut email, mut phone) = (session.email.clone(), session.phone.clone());
            match state.profiles.fetch(&session.token).await {
                Ok(profile) => (email, phone) = (profile.email, profile.phone),
                Err(err) => tracing::warn!(
                    "Could not fetch the user profile; recording the session's details: {err}"
                ),
            }
            db::create_user(&state.pool, &session.id, email.as_deref(), phone.as_deref()).await
        }
        Err(err) => Err(err),
    };

    match user {
        Ok(user) => {
            req.extensions_mut().insert(user);
            next.run(req).await
        }
        Err(err) => {
            tracing::error!("Could not resolve the local user: {err}");
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "message": "Failed to create user" })),
            )
                .into_response()
        }
    }
}

async fn require_role(role: &'static str, req: Request, next: Next) -> Response {
    let allowed = req
        .extensions()
        .get::<seamless_auth::User>()
        .is_some_and(|user| has_role(&user.roles, role));
    if !allowed {
        return (StatusCode::FORBIDDEN, Json(json!({ "error": "forbidden" }))).into_response();
    }
    next.run(req).await
}

fn has_role(roles: &[String], role: &str) -> bool {
    roles.iter().any(|r| r == role)
}

/// Allows credentialed requests from the configured web origins. A request whose
/// Origin is this server's own host is same-origin and was never a CORS concern:
/// browsers send Origin on a same-origin POST, so the console's writes would
/// otherwise be refused. A disallowed origin gets no CORS headers, and the browser
/// blocks the response.
fn cors(allowed: Vec<String>) -> CorsLayer {
    CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(
            move |origin: &HeaderValue, parts| {
                let ok = origin
                    .to_str()
                    .is_ok_and(|o| allowed.iter().any(|a| a == o))
                    || same_origin(origin, &parts.headers);
                if !ok {
                    tracing::warn!(origin = ?origin, "Unknown CORS origin");
                }
                ok
            },
        ))
        .allow_credentials(true)
        .allow_methods([
            Method::GET,
            Method::HEAD,
            Method::PUT,
            Method::PATCH,
            Method::POST,
            Method::DELETE,
        ])
        .allow_headers(AllowHeaders::mirror_request())
}

/// Compares hosts rather than full origins, so it holds behind a TLS-terminating
/// proxy where the request arrives over plain HTTP.
fn same_origin(origin: &HeaderValue, headers: &HeaderMap) -> bool {
    let (Ok(origin), Some(host)) = (
        origin.to_str(),
        headers.get(HOST).and_then(|h| h.to_str().ok()),
    ) else {
        return false;
    };
    url::Url::parse(origin).is_ok_and(|u| {
        let origin_host = match u.port() {
            Some(port) => format!("{}:{port}", u.host_str().unwrap_or_default()),
            None => u.host_str().unwrap_or_default().to_string(),
        };
        origin_host.eq_ignore_ascii_case(host)
    })
}

/// Reads the signed-in user's profile from the auth API.
#[derive(Clone)]
struct ProfileClient {
    url: String,
    client: reqwest::Client,
}

#[derive(Deserialize)]
struct Profile {
    email: Option<String>,
    phone: Option<String>,
}

impl ProfileClient {
    fn new(auth_server_url: &str) -> Self {
        ProfileClient {
            url: format!("{}/users/me", auth_server_url.trim_end_matches('/')),
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(10))
                .redirect(reqwest::redirect::Policy::none())
                .build()
                .expect("an HTTP client"),
        }
    }

    async fn fetch(&self, token: &str) -> Result<Profile, String> {
        #[derive(Deserialize)]
        struct Body {
            user: Profile,
        }
        let res = self
            .client
            .get(&self.url)
            .bearer_auth(token)
            .send()
            .await
            .map_err(|e| e.without_url().to_string())?;
        if !res.status().is_success() {
            return Err(format!("profile: HTTP {}", res.status().as_u16()));
        }
        res.json::<Body>()
            .await
            .map(|b| b.user)
            .map_err(|e| e.without_url().to_string())
    }
}

#[cfg(test)]
mod tests {
    use axum::body::{Body, to_bytes};
    use axum::http::Request;
    use sqlx::postgres::PgPoolOptions;
    use tower::ServiceExt;

    use super::*;

    /// Stands in for the auth API.
    async fn upstream() -> String {
        let app = Router::new()
            .route(
                "/console",
                get(|| async { ([("content-type", "text/html")], "<html>console</html>") }),
            )
            .route(
                "/login",
                axum::routing::post(|| async {
                    (
                        StatusCode::BAD_REQUEST,
                        Json(json!({ "error": "invalid_request" })),
                    )
                }),
            );
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", listener.local_addr().unwrap());
        tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
        url
    }

    async fn app(serve_console: bool) -> Router {
        let cfg = Config {
            development: false,
            port: 3000,
            auth_server_url: upstream().await,
            auth_server_issuer: None,
            cookie_signing_key: "cookie-secret-cookie-secret-cookie-secret".into(),
            api_service_token: "service-secret-service-secret-service-secret".into(),
            jwks_kid: "dev-main".into(),
            cookie_domain: None,
            cookie_prefix: "seamless-".into(),
            serve_admin_console: serve_console,
            ui_origins: vec!["http://localhost:5173".into()],
            database_url: String::new(),
        };
        let auth = adapter(&cfg).unwrap();
        // Never connected: nothing in these tests gets past the session guard.
        let pool = PgPoolOptions::new()
            .connect_lazy("postgres://u:p@127.0.0.1:1/none")
            .unwrap();
        router(&cfg, &auth, pool)
    }

    async fn send(
        app: Router,
        method: &str,
        uri: &str,
        headers: &[(&str, &str)],
        body: &str,
    ) -> (StatusCode, HeaderMap, String) {
        let mut req = Request::builder().method(method).uri(uri);
        for (k, v) in headers {
            req = req.header(*k, *v);
        }
        let res = app
            .oneshot(req.body(Body::from(body.to_string())).unwrap())
            .await
            .unwrap();
        let (parts, body) = res.into_parts();
        let text = String::from_utf8(to_bytes(body, usize::MAX).await.unwrap().to_vec()).unwrap();
        (parts.status, parts.headers, text)
    }

    #[tokio::test]
    async fn the_root_answers() {
        let (status, _, text) = send(app(false).await, "GET", "/", &[], "").await;
        assert_eq!(
            (status.as_u16(), text.as_str()),
            (200, "Seamless API is running.")
        );
    }

    #[tokio::test]
    async fn the_auth_routes_reach_the_auth_api() {
        let (status, _, text) = send(
            app(false).await,
            "POST",
            "/auth/login",
            &[("content-type", "application/json")],
            "{}",
        )
        .await;
        assert_eq!(status, 400);
        assert!(text.contains("invalid_request"), "{text}");
    }

    #[tokio::test]
    async fn the_console_is_served_when_enabled() {
        for target in ["/console", "/console/"] {
            let (status, _, text) = send(
                app(true).await,
                "GET",
                target,
                &[("origin", "http://elsewhere.example")],
                "",
            )
            .await;
            assert_eq!(
                (status.as_u16(), text.as_str()),
                (200, "<html>console</html>"),
                "{target}"
            );
        }
        let (status, _, _) = send(app(false).await, "GET", "/console/", &[], "").await;
        assert_ne!(status, 200, "served the console while it is turned off");
    }

    #[tokio::test]
    async fn app_routes_need_a_session() {
        let (status, _, text) = send(app(false).await, "GET", "/beta_users", &[], "").await;
        assert_eq!(status, 401);
        assert!(text.contains("unauthenticated"), "{text}");
    }

    #[tokio::test]
    async fn cors() {
        let preflight = [
            ("origin", "http://localhost:5173"),
            ("access-control-request-method", "POST"),
            ("access-control-request-headers", "content-type"),
        ];
        let (_, headers, _) =
            send(app(false).await, "OPTIONS", "/auth/login", &preflight, "").await;
        assert_eq!(
            headers["access-control-allow-origin"],
            "http://localhost:5173"
        );
        assert_eq!(headers["access-control-allow-credentials"], "true");

        let (_, headers, _) = send(
            app(false).await,
            "OPTIONS",
            "/auth/login",
            &[
                ("origin", "http://evil.example"),
                ("access-control-request-method", "POST"),
            ],
            "",
        )
        .await;
        assert!(
            headers.get("access-control-allow-origin").is_none(),
            "a foreign origin got CORS headers"
        );

        let (_, headers, _) = send(
            app(false).await,
            "POST",
            "/auth/login",
            &[
                ("origin", "http://api.example:3000"),
                ("host", "api.example:3000"),
                ("content-type", "application/json"),
            ],
            "{}",
        )
        .await;
        assert_eq!(
            headers["access-control-allow-origin"], "http://api.example:3000",
            "a same-origin request was refused"
        );
    }

    #[test]
    fn the_role_gate() {
        let roles = |r: &[&str]| r.iter().map(|s| s.to_string()).collect::<Vec<_>>();
        assert!(has_role(&roles(&["user", "betaUser"]), "betaUser"));
        assert!(!has_role(&roles(&["user"]), "betaUser"));
        assert!(!has_role(&[], "betaUser"));
    }
}
