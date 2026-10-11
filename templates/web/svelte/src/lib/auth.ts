import { createSeamlessAuth } from "@seamless-auth/svelte";
import { requireAuth, requireGuest } from "@seamless-auth/svelte/kit";

import { getApiUrl } from "./runtimeConfig";

export const apiHost = getApiUrl();

// The app renders only in the browser (ssr = false in the root layout), so one
// session for the module is one session for the visitor. Without an API origin
// the root layout shows the configuration error instead of any page.
export const auth = createSeamlessAuth({ apiHost: apiHost ?? "" });

// The route guards, for a +page.ts or +layout.ts `load`. Without an API origin
// there is no session to wait for, and a load that waited would keep the root
// layout, and so the configuration error, from ever rendering.
export const signedInOnly = apiHost ? requireAuth(auth) : async () => {};
export const signedOutOnly = apiHost ? requireGuest(auth) : async () => {};
