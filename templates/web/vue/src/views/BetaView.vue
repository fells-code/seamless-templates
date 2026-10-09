<script setup lang="ts">
import { useSeamlessAuth } from "@seamless-auth/vue";
import { computed, ref, watchEffect } from "vue";

const auth = useSeamlessAuth();

const hasBetaRole = computed(() => auth.hasScopedRole("betaUser") === true);
const betaUsers = ref<unknown>(null);
const error = ref<string | null>(null);
const loading = ref(false);

// authorizedFetch sends the session cookies to the API origin and nowhere else.
// The API checks the role again: hiding the call here is for display only.
watchEffect(async () => {
  if (!hasBetaRole.value || betaUsers.value !== null) return;

  loading.value = true;
  error.value = null;
  try {
    const res = await auth.authorizedFetch("/beta_users");
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    betaUsers.value = await res.json();
  } catch {
    error.value =
      "The API rejected this request. This usually means the user does not have the required role.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
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

    <div
      v-if="!hasBetaRole"
      class="rounded-card border border-line bg-surface-raised p-6"
    >
      <h2 class="font-semibold text-ink">Missing required role</h2>
      <p class="mt-2 text-sm text-ink-muted">
        Your account does not have the <code>betaUser</code> role, so the
        beta-only API call is not made. Grant it in the admin console.
      </p>
    </div>

    <div v-else class="space-y-4">
      <h2 class="text-xl font-semibold text-ink">Protected API call</h2>
      <p v-if="loading" class="text-ink-muted">
        Loading beta data from the API...
      </p>
      <p v-if="error" role="alert" class="text-sm text-ink">{{ error }}</p>
      <pre
        v-if="betaUsers !== null"
        class="overflow-x-auto rounded-card border border-line bg-surface-raised p-4 text-sm"
        >{{ JSON.stringify(betaUsers, null, 2) }}</pre>
    </div>
  </section>
</template>
