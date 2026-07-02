import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@seamless-auth/react";
import type { OAuthProvider, OAuthProvidersResult } from "@seamless-auth/react";

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
      .then((result: OAuthProvidersResult) => {
        if (active) setProviders(result.providers ?? []);
      })
      .catch(() => {
        if (active) setProviders([]);
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
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-400">
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
    try {
      sessionStorage.setItem(OAUTH_PROVIDER_STORAGE_KEY, providerId);

      const { authorizationUrl } = await startOAuthLogin({
        providerId,
        redirectUri: `${window.location.origin}/oauth/callback`,
      });

      window.location.assign(authorizationUrl);
    } catch {
      setError("Could not start sign-in with this provider.");
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-black">
      <div
        className="hidden lg:flex flex-col justify-center px-20 w-1/2
        bg-gradient-to-b from-[#2169a8] to-black text-white"
      >
        <div className="max-w-xl space-y-8">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Sign in with OAuth
          </h1>
          <p className="text-xl font-light leading-relaxed opacity-90">
            This example shows an OAuth-first login built on Seamless Auth. The
            provider buttons come from the auth server's configured OAuth
            providers, so the same UI works for Google, GitHub, or any OIDC
            provider you enable.
          </p>
          <p className="text-lg leading-relaxed opacity-90">
            Selecting a provider redirects to it, and the auth server completes
            the login on the callback route. Your app keeps control of protected
            routes and API access.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6 sm:px-10">
        <div className="max-w-md w-full space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Continue to your account
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose a provider to sign in.
            </p>
          </div>

          {loadingProviders ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading sign-in options...
            </p>
          ) : providers.length === 0 ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium">
                No OAuth providers are configured yet.
              </p>
              <p className="mt-2">
                Add a provider to your Seamless Auth server (for example Google
                or GitHub) to enable sign-in here. See{" "}
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
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => handleSelect(provider.id)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Continue with {provider.name}
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <p className="text-xs text-center text-gray-500 dark:text-gray-500">
            Authentication and session management provided by Seamless Auth.
          </p>
        </div>
      </div>
    </div>
  );
}
