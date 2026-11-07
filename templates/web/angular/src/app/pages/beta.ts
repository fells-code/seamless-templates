import { Component, computed, effect, inject, signal } from "@angular/core";
import { hasPermission, SeamlessAuth } from "@seamless-auth/angular";

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

      <div class="space-y-4">
        <h2 class="text-xl font-semibold text-ink">Permission check</h2>
        @if (!canReadReports()) {
          <p class="text-sm text-ink-muted">
            Your account does not hold the <code>reports:read</code> permission,
            so the reports call is not made. Permissions need Seamless Auth API
            v0.23 or later and a role that grants them; the README has the
            steps.
          </p>
        } @else {
          @if (reportsError()) {
            <p role="alert" class="text-sm text-ink">{{ reportsError() }}</p>
          }
          @if (reports() !== null) {
            <ul class="space-y-1">
              @for (report of reports(); track report.id) {
                <li class="text-sm text-ink">{{ report.title }}</li>
              }
            </ul>
          }
        }
      </div>
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

  // The API guards /reports with reports:read; this only decides what to show.
  protected readonly canReadReports = computed(() =>
    hasPermission(this.auth.user(), "reports:read"),
  );
  protected readonly reports = signal<{ id: string; title: string }[] | null>(
    null,
  );
  protected readonly reportsError = signal<string | null>(null);

  constructor() {
    // authorizedFetch sends the session cookies to the API origin and nowhere
    // else. The API checks the role again: hiding the call here is for display.
    effect(() => {
      if (!this.hasBetaRole() || this.betaUsers() !== null) return;
      void this.load();
    });
    effect(() => {
      if (!this.canReadReports() || this.reports() !== null) return;
      void this.loadReports();
    });
  }

  private async loadReports() {
    this.reportsError.set(null);
    try {
      const res = await this.auth.authorizedFetch("/reports");
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      this.reports.set((await res.json()).reports);
    } catch {
      this.reportsError.set(
        "The API refused the reports call. Its guard reads the permission from the access token, so sign in again after a new grant.",
      );
    }
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
