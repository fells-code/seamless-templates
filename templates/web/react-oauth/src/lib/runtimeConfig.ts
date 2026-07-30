/*
 * Copyright © 2026 Fells Code, LLC
 * Licensed under the GNU Affero General Public License v3.0
 * See LICENSE file in the project root for full license information
 */

declare global {
  interface Window {
    __SEAMLESS_CONFIG__?: {
      API_URL: string;
    };
  }
}

export const MISSING_API_URL_MESSAGE =
  "VITE_API_URL is not set, so this app does not know where its API is. Copy .env.example to .env, set VITE_API_URL to your API origin (http://localhost:3000 for the scaffolded stack), then restart the dev server. In a container, pass API_URL to the image instead.";

/**
 * Where the companion API lives. A container build injects it at runtime through
 * `window.__SEAMLESS_CONFIG__`, and a local `npm run dev` reads it from .env.
 *
 * Returns null when neither supplies a value, including the empty string the
 * container entrypoint writes when API_URL is unset. Without that check every
 * auth request would resolve against the page's own origin and fail as a 404
 * that says nothing about the missing configuration.
 */
export function getApiUrl(): string | null {
  const injected = window.__SEAMLESS_CONFIG__?.API_URL?.trim();
  if (injected) {
    return injected;
  }

  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

  return fromEnv ? fromEnv : null;
}
