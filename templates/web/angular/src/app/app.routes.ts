import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "@seamless-auth/angular";
import {
  authRoutePaths,
  seamlessAuthRoutes,
} from "@seamless-auth/angular/routes";

import { About } from "./pages/about";
import { Beta } from "./pages/beta";
import { Home } from "./pages/home";
import { Layout } from "./layout";

// The screens that start a sign-in are for signed-out visitors only. The ones
// that finish one (a code, a link, a provider callback, passkey enrolment) are
// not guarded: the session can already exist by the time they render.
const entryScreens = new Set<string>([
  authRoutePaths.login,
  authRoutePaths.passkeyLogin,
  authRoutePaths.magicLinkSent,
]);

export const routes: Routes = [
  {
    path: "",
    component: Layout,
    children: [
      { path: "", component: Home, canActivate: [authGuard] },
      { path: "beta", component: Beta, canActivate: [authGuard] },
      { path: "about", component: About },
    ],
  },
  ...seamlessAuthRoutes.map((route) =>
    entryScreens.has(route.path ?? "")
      ? { ...route, canActivate: [guestGuard] }
      : route,
  ),
  { path: "**", redirectTo: "" },
];
