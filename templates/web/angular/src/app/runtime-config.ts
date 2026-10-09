declare global {
  interface Window {
    __SEAMLESS_CONFIG__?: {
      API_URL?: string;
    };
  }
}

export const MISSING_API_URL_MESSAGE =
  "API_URL is not set, so this app does not know where its API is. Copy .env.example to .env, set API_URL to your API origin (http://localhost:3000 for the scaffolded stack), then restart npm run dev. In a container, pass API_URL to the image instead.";

/**
 * Where the companion API lives, from `window.__SEAMLESS_CONFIG__` in
 * public/config.js. `npm run dev` writes that file from .env, and the container
 * entrypoint writes it from API_URL.
 *
 * Returns null when it is empty, so the app can say so rather than send every
 * auth request to its own origin, where each fails as a 404 that says nothing
 * about the missing configuration.
 */
export function getApiUrl(): string | null {
  const injected = window.__SEAMLESS_CONFIG__?.API_URL?.trim();
  return injected ? injected : null;
}
