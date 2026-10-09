import {
  authGuard,
  createSeamlessAuthRoutes,
  guestGuard,
} from "@seamless-auth/vue/router";
import { createRouter, createWebHistory } from "vue-router";

import AppLayout from "./layouts/AppLayout.vue";
import AboutView from "./views/AboutView.vue";
import BetaView from "./views/BetaView.vue";
import HomeView from "./views/HomeView.vue";

// The screens that start a sign-in are for signed-out visitors only. The ones
// that finish one (a code, a link, a provider callback, passkey enrolment) are
// not guarded: the session can already exist by the time they render.
const entryScreens = new Set(["/login", "/passkey-login", "/magic-link-sent"]);

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: AppLayout,
      children: [
        { path: "", component: HomeView, beforeEnter: authGuard },
        { path: "beta", component: BetaView, beforeEnter: authGuard },
        { path: "about", component: AboutView },
      ],
    },
    ...createSeamlessAuthRoutes().map((route) =>
      entryScreens.has(route.path)
        ? { ...route, beforeEnter: guestGuard }
        : route,
    ),
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
