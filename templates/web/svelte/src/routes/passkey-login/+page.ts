import { signedOutOnly } from "#lib/auth.js";

// The screens that start a sign-in are for signed-out visitors only. The ones
// that finish one (a code, a link, a provider callback, passkey enrolment) are
// not guarded: the session can already exist by the time they render.
export const load = signedOutOnly;
