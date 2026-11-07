<script lang="ts">
  import { getSeamlessAuth, hasPermission } from "@seamless-auth/svelte";

  const auth = getSeamlessAuth();

  const hasBetaRole = $derived(auth.hasScopedRole("betaUser") === true);
  let betaUsers = $state<unknown>(null);
  let error = $state<string | null>(null);
  let loading = $state(false);

  // authorizedFetch sends the session cookies to the API origin and nowhere else.
  // The API checks the role again: hiding the call here is for display only.
  $effect(() => {
    if (!hasBetaRole || betaUsers !== null) return;

    loading = true;
    error = null;
    auth
      .authorizedFetch("/beta_users")
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        betaUsers = await res.json();
      })
      .catch(() => {
        error =
          "The API rejected this request. This usually means the user does not have the required role.";
      })
      .finally(() => {
        loading = false;
      });
  });

  // The API guards /reports with reports:read; this only decides what to show.
  const canReadReports = $derived(hasPermission(auth.user, "reports:read"));
  let reports = $state<{ id: string; title: string }[] | null>(null);
  let reportsError = $state<string | null>(null);

  $effect(() => {
    if (!canReadReports || reports !== null) return;

    reportsError = null;
    auth
      .authorizedFetch("/reports")
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        reports = (await res.json()).reports;
      })
      .catch(() => {
        reportsError =
          "The API refused the reports call. Its guard reads the permission from the access token, so sign in again after a new grant.";
      });
  });
</script>

<section class="max-w-3xl space-y-10">
  <header class="space-y-2">
    <h1 class="font-display text-3xl tracking-display text-ink">
      Protected Route Example
    </h1>
    <p class="text-ink-muted">
      Only a signed-in user reaches this page, and its API call needs the
      <code>betaUser</code> role.
    </p>
  </header>

  {#if !hasBetaRole}
    <div class="rounded-card border border-line bg-surface-raised p-6">
      <h2 class="font-semibold text-ink">Missing required role</h2>
      <p class="mt-2 text-sm text-ink-muted">
        Your account does not have the <code>betaUser</code> role, so the beta-only
        API call is not made. Grant it in the admin console.
      </p>
    </div>
  {:else}
    <div class="space-y-4">
      <h2 class="text-xl font-semibold text-ink">Protected API call</h2>
      {#if loading}
        <p class="text-ink-muted">Loading beta data from the API...</p>
      {/if}
      {#if error}
        <p role="alert" class="text-sm text-ink">{error}</p>
      {/if}
      {#if betaUsers !== null}
        <pre
          class="overflow-x-auto rounded-card border border-line bg-surface-raised p-4 text-sm">{JSON.stringify(
            betaUsers,
            null,
            2,
          )}</pre>
      {/if}
    </div>
  {/if}

  <div class="space-y-4">
    <h2 class="text-xl font-semibold text-ink">Permission check</h2>
    {#if !canReadReports}
      <p class="text-sm text-ink-muted">
        Your account does not hold the <code>reports:read</code> permission, so the
        reports call is not made. Permissions need Seamless Auth API v0.23 or later
        and a role that grants them; the README has the steps.
      </p>
    {:else}
      {#if reportsError}
        <p role="alert" class="text-sm text-ink">{reportsError}</p>
      {/if}
      {#if reports !== null}
        <ul class="space-y-1">
          {#each reports as report (report.id)}
            <li class="text-sm text-ink">{report.title}</li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</section>
