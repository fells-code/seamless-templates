<script lang="ts">
  import { resolve } from "$app/paths";
  import { getSeamlessAuth } from "@seamless-auth/svelte";

  const auth = getSeamlessAuth();

  const identity = $derived(
    auth.user?.email || auth.user?.phone || auth.user?.id || "your account",
  );
  const roles = $derived(auth.user?.roles ?? []);
</script>

<section class="space-y-10">
  <header class="space-y-2">
    <h1 class="font-display text-4xl tracking-display text-ink">
      You are signed in
    </h1>
    <p class="text-ink-muted">Signed in as {identity}.</p>
  </header>

  <dl class="grid gap-4 sm:grid-cols-2">
    <div class="rounded-card border border-line bg-surface-raised p-6">
      <dt class="label text-ink-muted">Roles</dt>
      <dd class="mt-2 text-2xl font-semibold text-ink">{roles.length}</dd>
    </div>
    <div class="rounded-card border border-line bg-surface-raised p-6">
      <dt class="label text-ink-muted">Account</dt>
      <dd class="mt-2 text-sm font-medium text-ink">
        {roles.length ? roles.join(", ") : "No roles yet"}
      </dd>
    </div>
  </dl>

  <div class="grid gap-4 sm:grid-cols-2">
    <a
      href={resolve("/(app)/beta")}
      class="rounded-card border border-line bg-surface-raised p-6 hover:border-accent"
    >
      <h2 class="font-semibold text-ink">A protected route</h2>
      <p class="mt-1 text-sm text-ink-muted">
        A page and an API call that both require a role.
      </p>
    </a>
    <a
      href={resolve("/(app)/about")}
      class="rounded-card border border-line bg-surface-raised p-6 hover:border-accent"
    >
      <h2 class="font-semibold text-ink">How this works</h2>
      <p class="mt-1 text-sm text-ink-muted">
        The pieces of Seamless Auth and how they fit together.
      </p>
    </a>
  </div>
</section>
