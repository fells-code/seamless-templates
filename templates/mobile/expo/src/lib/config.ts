/**
 * The companion API origin, from the environment Expo inlines at build time.
 * Missing means the app was built without a `.env`, which every screen should
 * say rather than fail on the first request.
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "";

export const MISSING_API_URL_MESSAGE =
  "EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env and point it at the companion API.";
