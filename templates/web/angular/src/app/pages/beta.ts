import { Component, computed, effect, inject, signal } from "@angular/core";
import { SeamlessAuth } from "@seamless-auth/angular";

@Component({
  selector: "app-beta",
  template: `
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

      @if (!hasBetaRole()) {
        <div class="rounded-card border border-line bg-surface-raised p-6">
          <h2 class="font-semibold text-ink">Missing required role</h2>
          <p class="mt-2 text-sm text-ink-muted">
            Your account does not have the <code>betaUser</code> role, so the
            beta-only API call is not made. Grant it in the admin console.
          </p>
        </div>
      } @else {
        <div class="space-y-4">
          <h2 class="text-xl font-semibold text-ink">Protected API call</h2>
          @if (loading()) {
            <p class="text-ink-muted">Loading beta data from the API...</p>
          }
          @if (error()) {
            <p role="alert" class="text-sm text-ink">{{ error() }}</p>
          }
          @if (betaUsers() !== null) {
            <pre
              class="overflow-x-auto rounded-card border border-line bg-surface-raised p-4 text-sm"
              >{{ betaJson() }}</pre>
          }
        </div>
      }
    </section>
  `,
})
export class Beta {
  private readonly auth = inject(SeamlessAuth);

  protected readonly hasBetaRole = computed(
    () => this.auth.user() !== null && this.auth.hasScopedRole("betaUser"),
  );
  protected readonly betaUsers = signal<unknown>(null);
  protected readonly betaJson = computed(() =>
    JSON.stringify(this.betaUsers(), null, 2),
  );
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  constructor() {
    // authorizedFetch sends the session cookies to the API origin and nowhere
    // else. The API checks the role again: hiding the call here is for display.
    effect(() => {
      if (!this.hasBetaRole() || this.betaUsers() !== null) return;
      void this.load();
    });
  }

  private async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.auth.authorizedFetch("/beta_users");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      this.betaUsers.set(await res.json());
    } catch {
      this.error.set(
        "The API rejected this request. This usually means the user does not have the required role.",
      );
    } finally {
      this.loading.set(false);
    }
  }
}
