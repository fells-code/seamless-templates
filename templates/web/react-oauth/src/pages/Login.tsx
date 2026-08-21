import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@seamless-auth/react";
import type { OAuthProvider } from "@seamless-auth/react";
import { AuthFrame, PrimaryButton } from "../components/kit";

// The callback route reads this to know which provider to finish the login with.
export const OAUTH_PROVIDER_STORAGE_KEY = "seamless:oauth:provider";

export default function Login() {
  const { isAuthenticated, loading, listOAuthProviders, startOAuthLogin } =
    useAuth();
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    listOAuthProviders()
      .then(({ data, error }) => {
        if (active) setProviders(error ? [] : (data.providers ?? []));
      })
      .finally(() => {
        if (active) setLoadingProviders(false);
      });

    return () => {
      active = false;
    };
  }, [listOAuthProviders]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-ink-muted">
        Checking session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Kick off the provider redirect. startOAuthLogin returns the IdP authorization
  // URL; the provider sends the user back to /oauth/callback when they are done.
  const handleSelect = async (providerId: string) => {
    setError("");
    sessionStorage.setItem(OAUTH_PROVIDER_STORAGE_KEY, providerId);

    const { data, error } = await startOAuthLogin({
      providerId,
      redirectUri: `${window.location.origin}/oauth/callback`,
    });

    if (error) {
      setError("Could not start sign-in with this provider.");
      return;
    }

    window.location.assign(data.authorizationUrl);
  };

  return (
    <AuthFrame
      title="Sign in with OAuth"
      pitch="An OAuth-first reference template. The provider buttons come from the auth server's configured providers, so the same UI works for Google, GitHub, or any OIDC provider you enable."
      points={[
        "Providers are configured on the auth server, not in this app",
        "The auth server completes the login on the callback route",
        "Roles enforced in the API and reflected in the UI",
      ]}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="title text-ink">Continue to your account</h2>
          <p className="text-sm text-ink-muted">
            Choose a provider to sign in.
          </p>
        </div>

        {loadingProviders ? (
          <p className="text-sm text-ink-muted">Loading sign-in options...</p>
        ) : providers.length === 0 ? (
          <div className="rounded-card border border-line bg-surface-raised p-4 text-sm text-ink-muted">
            <p className="font-medium text-ink">
              No OAuth providers are configured yet.
            </p>
            <p className="mt-2">
              Add a provider to your Seamless Auth server (for example Google or
              GitHub) to enable sign-in here. See{" "}
              <a
                href="https://docs.seamlessauth.com"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                the documentation
              </a>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <PrimaryButton
                key={provider.id}
                variant="quiet"
                full
                onClick={() => void handleSelect(provider.id)}
              >
                Continue with {provider.name}
              </PrimaryButton>
            ))}
          </div>
        )}

        {/* The palette has no danger role on purpose, so a failure keeps a literal
            red rather than inventing a token a generated theme would not define. */}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-center text-xs text-ink-muted">
          Authentication and session management provided by Seamless Auth.
        </p>
      </div>
    </AuthFrame>
  );
}
