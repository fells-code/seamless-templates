import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@seamless-auth/react";

import { OAUTH_PROVIDER_STORAGE_KEY } from "./Login";

// The provider redirects here with `code` and `state`. We hand both, plus the
// provider we started with, to the auth server to finish the login and issue a
// session, then send the user into the app.
export default function OAuthCallback() {
  const { finishOAuthLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const providerId = sessionStorage.getItem(OAUTH_PROVIDER_STORAGE_KEY);

    if (!code || !state || !providerId) {
      setError("This sign-in link is missing required information.");
      return;
    }

    finishOAuthLogin({ providerId, code, state })
      .then(() => {
        sessionStorage.removeItem(OAUTH_PROVIDER_STORAGE_KEY);
        navigate("/");
      })
      .catch(() => {
        setError("We could not complete sign-in. Please try again.");
      });
  }, [finishOAuthLogin, navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {error ? "Sign-in failed" : "Completing sign-in..."}
      </h2>
      {error && (
        <>
          <p className="mt-3 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 px-4 py-2 rounded-md bg-[#2169a8] text-white hover:bg-[#1a568a] transition"
          >
            Back to login
          </button>
        </>
      )}
    </div>
  );
}
