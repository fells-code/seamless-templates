<script setup lang="ts">
import { useSeamlessAuth } from "@seamless-auth/vue";
import { computed, ref } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";

const auth = useSeamlessAuth();
const router = useRouter();
const accountOpen = ref(false);

const appName = "Seamless Auth - Template";
const links = [
  { label: "Home", to: "/" },
  { label: "Beta Access", to: "/beta" },
  { label: "About", to: "/about" },
];

const identity = computed(() => {
  const user = auth.user.value;
  return user?.email || user?.phone || user?.id || "";
});
const initial = computed(
  () => (identity.value || appName).trim()[0]?.toUpperCase() ?? "A",
);

async function logout() {
  accountOpen.value = false;
  await auth.logout();
  await router.push("/login");
}
</script>

<!--
  The account control's accessible names are a cross-repo contract: the
  conformance suite in seamless-cli signs out by clicking "Open account menu" and
  then "Logout".
-->
<template>
  <div class="min-h-screen bg-surface text-ink">
    <header
      class="sticky top-0 z-30 border-b border-shell-line bg-shell text-shell-ink-muted"
    >
      <div class="shell-bar flex items-center justify-between gap-6 py-3">
        <RouterLink to="/" class="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            class="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-accent font-display text-sm text-accent-ink"
          >
            {{ appName[0] }}
          </span>
          <span
            class="truncate font-display text-base tracking-display text-shell-ink"
          >
            {{ appName }}
          </span>
        </RouterLink>

        <div class="flex min-w-0 items-center gap-6">
          <nav aria-label="Main" class="hidden sm:block">
            <ul class="flex items-center gap-1">
              <li v-for="link in links" :key="link.to">
                <RouterLink
                  :to="link.to"
                  class="nav-item"
                  exact-active-class="nav-item-active"
                >
                  {{ link.label }}
                </RouterLink>
              </li>
            </ul>
          </nav>

          <div v-if="auth.isAuthenticated.value" class="relative shrink-0">
            <button
              type="button"
              aria-label="Open account menu"
              :aria-expanded="accountOpen"
              class="grid h-8 w-8 place-items-center rounded-full bg-shell-active text-xs font-semibold text-shell-ink"
              @click="accountOpen = !accountOpen"
            >
              {{ initial }}
            </button>
            <div
              v-if="accountOpen"
              class="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-control border border-shell-line bg-shell shadow-lifted"
            >
              <p
                class="truncate border-b border-shell-line px-3 py-2 text-xs text-shell-ink-muted"
              >
                {{ identity }}
              </p>
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm text-shell-ink hover:bg-shell-active"
                @click="logout"
              >
                Logout
              </button>
            </div>
          </div>
          <RouterLink
            v-else
            to="/login"
            class="rounded-control bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
          >
            Sign in
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="shell-bar py-12">
      <RouterView />
    </main>
  </div>
</template>
