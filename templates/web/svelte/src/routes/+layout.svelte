<script lang="ts">
  import "../index.css";

  import { setAuthNavigator, setSeamlessAuth } from "@seamless-auth/svelte";
  import { createKitNavigator } from "@seamless-auth/svelte/kit";

  import { apiHost, auth } from "#lib/auth.js";
  import { MISSING_API_URL_MESSAGE } from "#lib/runtimeConfig.js";

  let { children } = $props();

  setSeamlessAuth(auth);
  setAuthNavigator(createKitNavigator(auth));
</script>

{#if apiHost}
  {@render children()}
{:else}
  <div class="flex min-h-screen items-center justify-center bg-surface px-6">
    <div
      class="max-w-lg rounded-card border border-line bg-surface-raised p-8"
      role="alert"
    >
      <h1 class="text-xl font-semibold text-ink">This app is not configured</h1>
      <p class="mt-3 text-sm text-ink-muted">{MISSING_API_URL_MESSAGE}</p>
    </div>
  </div>
{/if}
