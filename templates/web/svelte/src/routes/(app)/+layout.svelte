<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { getSeamlessAuth } from "@seamless-auth/svelte";

  let { children } = $props();

  const auth = getSeamlessAuth();
  let accountOpen = $state(false);

  const appName = "Seamless Auth - Template";
  // resolve() takes route ids, which carry the (app) group; the path is what the
  // address bar shows, for marking the current link.
  const links = [
    { label: "Home", route: "/(app)", path: "/" },
    { label: "Beta Access", route: "/(app)/beta", path: "/beta" },
    { label: "About", route: "/(app)/about", path: "/about" },
  ] as const;

  const identity = $derived(
    auth.user?.email || auth.user?.phone || auth.user?.id || "",
  );
  const initial = $derived(
    (identity || appName).trim()[0]?.toUpperCase() ?? "A",
  );

  async function logout() {
    accountOpen = false;
    await auth.logout();
    await goto(resolve("/login"));
  }
</script>

<!--
  The account control's accessible names are a cross-repo contract: the
  conformance suite in seamless-cli signs out by clicking "Open account menu" and
  then "Logout".
-->
<div class="min-h-screen bg-surface text-ink">
  <header
    class="sticky top-0 z-30 border-b border-shell-line bg-shell text-shell-ink-muted"
  >
    <div class="shell-bar flex items-center justify-between gap-6 py-3">
      <a href={resolve("/(app)")} class="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          class="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-accent font-display text-sm text-accent-ink"
        >
          {appName[0]}
        </span>
        <span
          class="truncate font-display text-base tracking-display text-shell-ink"
        >
          {appName}
        </span>
      </a>

      <div class="flex min-w-0 items-center gap-6">
        <nav aria-label="Main" class="hidden sm:block">
          <ul class="flex items-center gap-1">
            {#each links as link (link.route)}
              <li>
                <a
                  href={resolve(link.route)}
                  class={page.url.pathname === link.path
                    ? "nav-item nav-item-active"
                    : "nav-item"}
                >
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
        </nav>

        {#if auth.isAuthenticated}
          <div class="relative shrink-0">
            <button
              type="button"
              aria-label="Open account menu"
              aria-expanded={accountOpen}
              class="grid h-8 w-8 place-items-center rounded-full bg-shell-active text-xs font-semibold text-shell-ink"
              onclick={() => (accountOpen = !accountOpen)}
            >
              {initial}
            </button>
            {#if accountOpen}
              <div
                class="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-control border border-shell-line bg-shell shadow-lifted"
              >
                <p
                  class="truncate border-b border-shell-line px-3 py-2 text-xs text-shell-ink-muted"
                >
                  {identity}
                </p>
                <button
                  type="button"
                  class="w-full px-3 py-2 text-left text-sm text-shell-ink hover:bg-shell-active"
                  onclick={logout}
                >
                  Logout
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <a
            href={resolve("/login")}
            class="rounded-control bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
          >
            Sign in
          </a>
        {/if}
      </div>
    </div>
  </header>

  <main class="shell-bar py-12">
    {@render children()}
  </main>
</div>
