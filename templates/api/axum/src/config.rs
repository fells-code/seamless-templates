//! This API's environment, checked once at boot.

use url::Url;

/// Everything the API reads from its environment.
#[derive(Clone, Debug)]
pub struct Config {
    pub development: bool,
    pub port: u16,
    pub auth_server_url: String,
    pub auth_server_issuer: Option<String>,
    pub cookie_signing_key: String,
    pub api_service_token: String,
    pub jwks_kid: String,
    pub cookie_domain: Option<String>,
    pub cookie_prefix: String,
    pub serve_admin_console: bool,
    pub ui_origins: Vec<String>,
    pub database_url: String,
}

const REQUIRED: &[(&str, &str)] = &[
    (
        "AUTH_SERVER_URL",
        "The Seamless Auth instance this API trusts, for example http://localhost:5312.",
    ),
    (
        "COOKIE_SIGNING_KEY",
        "Any secret string. It signs the cookies this API issues.",
    ),
    (
        "API_SERVICE_TOKEN",
        "The secret shared with Seamless Auth. `seamless init` writes it for a local stack; managed applications issue it from the dashboard.",
    ),
    (
        "JWKS_KID",
        "The key id the auth server signs tokens with, for example dev-main.",
    ),
];

const DISCRETE_DB_VARS: &[&str] = &["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER"];

// `seamless init` writes a managed DATABASE_URL with these literal placeholders
// in place of the credentials, which only the dashboard can show.
const CREDENTIAL_PLACEHOLDERS: &[&str] = &["USER", "PASSWORD"];

impl Config {
    /// Reads the environment and refuses to start on any problem, naming every
    /// one at once: a missing value would otherwise surface as a 500 on the first
    /// authenticated request rather than as a failure to boot.
    pub fn load(env: impl Fn(&str) -> Option<String>) -> Result<Config, String> {
        let get = |name: &str| {
            env(name)
                .map(|v| v.trim().to_string())
                .filter(|v| !v.is_empty())
        };

        let mut problems: Vec<String> = REQUIRED
            .iter()
            .filter(|(name, _)| get(name).is_none())
            .map(|(name, hint)| format!("{name} is not set. {hint}"))
            .collect();
        let database_url = match database_url(&env) {
            Ok(url) => Some(url),
            Err(problem) => {
                problems.push(problem);
                None
            }
        };
        let port = match get("PORT").map(|p| p.parse::<u16>()) {
            None => 3000,
            Some(Ok(port)) => port,
            Some(Err(_)) => {
                problems.push("PORT is not a port number.".into());
                3000
            }
        };

        if !problems.is_empty() {
            let heading = if problems.len() == 1 {
                "Cannot start: 1 environment problem.".to_string()
            } else {
                format!("Cannot start: {} environment problems.", problems.len())
            };
            let listed: Vec<String> = problems.iter().map(|p| format!("  - {p}")).collect();
            return Err(format!(
                "\n{heading}\n\n{}\n\nCopy .env.example to .env and fill these in, then start the API again.\n",
                listed.join("\n")
            ));
        }

        let ui_origins: Vec<String> = env("UI_ORIGINS")
            .unwrap_or_default()
            .split(',')
            .map(str::trim)
            .filter(|o| !o.is_empty())
            .map(str::to_string)
            .collect();
        if ui_origins.is_empty() {
            tracing::warn!(
                "UI_ORIGINS is empty, so CORS will reject every browser request from another origin. Set it to your web app origin, for example http://localhost:5173."
            );
        }

        Ok(Config {
            development: get("APP_ENV").as_deref() == Some("development"),
            port,
            auth_server_url: get("AUTH_SERVER_URL").unwrap_or_default(),
            auth_server_issuer: get("AUTH_SERVER_ISSUER"),
            cookie_signing_key: env("COOKIE_SIGNING_KEY").unwrap_or_default(),
            api_service_token: env("API_SERVICE_TOKEN").unwrap_or_default(),
            jwks_kid: get("JWKS_KID").unwrap_or_default(),
            cookie_domain: get("COOKIE_DOMAIN"),
            cookie_prefix: get("AUTH_COOKIE_PREFIX").unwrap_or_else(|| "seamless-".into()),
            serve_admin_console: get("SERVE_ADMIN_CONSOLE").as_deref() == Some("true"),
            ui_origins,
            database_url: database_url.unwrap_or_default(),
        })
    }

    /// The aud the adapter expects: the auth server signs its issuer into aud as
    /// well as iss.
    pub fn audience(&self) -> &str {
        self.auth_server_issuer
            .as_deref()
            .unwrap_or(&self.auth_server_url)
    }
}

/// Where this API's database lives. DATABASE_URL wins when set: a managed
/// Seamless database is handed out as a connection string. Everything else is
/// built from the discrete DB_* variables the local Docker stack uses.
///
/// TLS keeps certificate verification on: sslmode=require (what a managed
/// database asks for) becomes verify-full, unless DB_SSL_REJECT_UNAUTHORIZED is
/// false, for a database whose certificate does not chain to a public CA.
pub fn database_url(env: &impl Fn(&str) -> Option<String>) -> Result<String, String> {
    let get = |name: &str| {
        env(name)
            .map(|v| v.trim().to_string())
            .filter(|v| !v.is_empty())
    };

    let Some(raw) = get("DATABASE_URL") else {
        let missing: Vec<&str> = DISCRETE_DB_VARS
            .iter()
            .copied()
            .filter(|n| get(n).is_none())
            .collect();
        if !missing.is_empty() {
            let listed = format!(
                "Set DATABASE_URL, or all of {}",
                DISCRETE_DB_VARS.join(", ")
            );
            return Err(if missing.len() == DISCRETE_DB_VARS.len() {
                format!("{listed}.")
            } else {
                format!("{listed} (missing {}).", missing.join(", "))
            });
        }
        let mut url = Url::parse("postgres://localhost/").expect("a valid base");
        let host = get("DB_HOST").unwrap_or_default();
        url.set_host(Some(&host))
            .map_err(|_| "DB_HOST is not a host name.".to_string())?;
        url.set_port(get("DB_PORT").and_then(|p| p.parse().ok()))
            .map_err(|_| "DB_PORT is not a port number.".to_string())?;
        url.set_username(&get("DB_USER").unwrap_or_default()).ok();
        url.set_password(env("DB_PASSWORD").as_deref()).ok();
        url.set_path(&get("DB_NAME").unwrap_or_default());
        url.set_query(Some("sslmode=disable"));
        return Ok(url.to_string());
    };

    let invalid = "DATABASE_URL is not a valid connection string. Expected postgres://user:password@host:port/database.";
    let mut url = Url::parse(&raw).map_err(|_| invalid.to_string())?;
    if !matches!(url.scheme(), "postgres" | "postgresql") || url.host_str().is_none() {
        return Err(invalid.into());
    }
    if CREDENTIAL_PLACEHOLDERS.contains(&url.username())
        || url
            .password()
            .is_some_and(|p| CREDENTIAL_PLACEHOLDERS.contains(&p))
    {
        return Err(
            "DATABASE_URL still carries the USER and PASSWORD placeholders that `seamless init` wrote. Copy the real credentials from the Seamless dashboard."
                .into(),
        );
    }

    let sslmode = url
        .query_pairs()
        .find(|(k, _)| k == "sslmode")
        .map(|(_, v)| v.into_owned());
    if let Some(mode) = sslmode
        && !matches!(
            mode.as_str(),
            "disable" | "allow" | "prefer" | "verify-ca" | "verify-full"
        )
    {
        let replacement = if get("DB_SSL_REJECT_UNAUTHORIZED").as_deref() == Some("false") {
            "require"
        } else {
            "verify-full"
        };
        let pairs: Vec<(String, String)> = url
            .query_pairs()
            .map(|(k, v)| {
                let value = if k == "sslmode" {
                    replacement.to_string()
                } else {
                    v.into_owned()
                };
                (k.into_owned(), value)
            })
            .collect();
        url.query_pairs_mut().clear().extend_pairs(pairs);
    }
    Ok(url.to_string())
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;

    fn env<'a>(
        values: &'a HashMap<&'static str, &'static str>,
    ) -> impl Fn(&str) -> Option<String> + 'a {
        move |name| values.get(name).map(|v| v.to_string())
    }

    fn complete() -> HashMap<&'static str, &'static str> {
        HashMap::from([
            ("AUTH_SERVER_URL", "http://localhost:5312"),
            (
                "COOKIE_SIGNING_KEY",
                "cookie-secret-cookie-secret-cookie-secret",
            ),
            (
                "API_SERVICE_TOKEN",
                "service-secret-service-secret-service-secret",
            ),
            ("JWKS_KID", "dev-main"),
            ("DB_HOST", "localhost"),
            ("DB_PORT", "5432"),
            ("DB_NAME", "seamless_api"),
            ("DB_USER", "myuser"),
            ("DB_PASSWORD", "my pass@word"),
            ("UI_ORIGINS", "http://localhost:5173, http://localhost:5174"),
        ])
    }

    #[test]
    fn a_complete_environment_loads() {
        let values = complete();
        let cfg = Config::load(env(&values)).unwrap();
        assert_eq!(cfg.port, 3000);
        assert_eq!(cfg.cookie_prefix, "seamless-");
        assert!(!cfg.serve_admin_console && !cfg.development);
        assert_eq!(
            cfg.ui_origins,
            ["http://localhost:5173", "http://localhost:5174"]
        );
        assert_eq!(
            cfg.database_url,
            "postgres://myuser:my%20pass%40word@localhost:5432/seamless_api?sslmode=disable"
        );
        assert_eq!(cfg.audience(), "http://localhost:5312");
    }

    #[test]
    fn every_problem_is_reported_at_once() {
        let values = HashMap::new();
        let err = Config::load(env(&values)).unwrap_err();
        for want in [
            "5 environment problems",
            "AUTH_SERVER_URL",
            "COOKIE_SIGNING_KEY",
            "API_SERVICE_TOKEN",
            "JWKS_KID",
            "Set DATABASE_URL, or all of",
        ] {
            assert!(err.contains(want), "missing {want:?} in {err}");
        }
    }

    #[test]
    fn a_partial_database_configuration_names_what_is_missing() {
        let mut values = complete();
        values.remove("DB_NAME");
        assert!(
            Config::load(env(&values))
                .unwrap_err()
                .contains("(missing DB_NAME)")
        );
    }

    #[test]
    fn the_issuer_is_the_audience_when_set() {
        let mut values = complete();
        values.insert("AUTH_SERVER_ISSUER", "http://auth:5312");
        assert_eq!(
            Config::load(env(&values)).unwrap().audience(),
            "http://auth:5312"
        );
    }

    #[test]
    fn database_urls() {
        for (url, reject, want) in [
            (
                "postgres://a:b@db.example:5432/app",
                "",
                Ok("postgres://a:b@db.example:5432/app"),
            ),
            (
                "postgres://a:b@db.example/app?sslmode=require",
                "",
                Ok("postgres://a:b@db.example/app?sslmode=verify-full"),
            ),
            (
                "postgres://a:b@db.example/app?sslmode=require",
                "false",
                Ok("postgres://a:b@db.example/app?sslmode=require"),
            ),
            (
                "postgres://a:b@db.example/app?sslmode=verify-ca",
                "",
                Ok("postgres://a:b@db.example/app?sslmode=verify-ca"),
            ),
            (
                "postgres://USER:PASSWORD@db.example/app",
                "",
                Err("placeholders"),
            ),
            ("mysql://x", "", Err("not a valid connection string")),
        ] {
            let mut values = complete();
            values.insert("DATABASE_URL", url);
            values.insert("DB_SSL_REJECT_UNAUTHORIZED", reject);
            match (database_url(&env(&values)), want) {
                (Ok(got), Ok(want)) => assert_eq!(got, want, "{url}"),
                (Err(got), Err(want)) => assert!(got.contains(want), "{url}: {got}"),
                (got, want) => panic!("{url}: got {got:?}, want {want:?}"),
            }
        }
    }
}
