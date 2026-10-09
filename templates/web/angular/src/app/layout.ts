import { Component, computed, inject, signal } from "@angular/core";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { SeamlessAuth } from "@seamless-auth/angular";

// The account control's accessible names are a cross-repo contract: the
// conformance suite in seamless-cli signs out by clicking "Open account menu" and
// then "Logout".
@Component({
  selector: "app-layout",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen bg-surface text-ink">
      <header
        class="sticky top-0 z-30 border-b border-shell-line bg-shell text-shell-ink-muted"
      >
        <div class="shell-bar flex items-center justify-between gap-6 py-3">
          <a routerLink="/" class="flex min-w-0 items-center gap-3">
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
          </a>

          <div class="flex min-w-0 items-center gap-6">
            <nav aria-label="Main" class="hidden sm:block">
              <ul class="flex items-center gap-1">
                @for (link of links; track link.to) {
                  <li>
                    <a
                      [routerLink]="link.to"
                      class="nav-item"
                      routerLinkActive="nav-item-active"
                      [routerLinkActiveOptions]="{ exact: true }"
                    >
                      {{ link.label }}
                    </a>
                  </li>
                }
              </ul>
            </nav>

            @if (auth.isAuthenticated()) {
              <div class="relative shrink-0">
                <button
                  type="button"
                  aria-label="Open account menu"
                  [attr.aria-expanded]="accountOpen()"
                  class="grid h-8 w-8 place-items-center rounded-full bg-shell-active text-xs font-semibold text-shell-ink"
                  (click)="accountOpen.set(!accountOpen())"
                >
                  {{ initial() }}
                </button>
                @if (accountOpen()) {
                  <div
                    class="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-control border border-shell-line bg-shell shadow-lifted"
                  >
                    <p
                      class="truncate border-b border-shell-line px-3 py-2 text-xs text-shell-ink-muted"
                    >
                      {{ identity() }}
                    </p>
                    <button
                      type="button"
                      class="w-full px-3 py-2 text-left text-sm text-shell-ink hover:bg-shell-active"
                      (click)="logout()"
                    >
                      Logout
                    </button>
                  </div>
                }
              </div>
            } @else {
              <a
                routerLink="/login"
                class="rounded-control bg-accent px-3 py-2 text-sm font-medium text-accent-ink"
              >
                Sign in
              </a>
            }
          </div>
        </div>
      </header>

      <main class="shell-bar py-12">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Layout {
  protected readonly auth = inject(SeamlessAuth);
  private readonly router = inject(Router);

  protected readonly accountOpen = signal(false);
  protected readonly appName = "Seamless Auth - Template";
  protected readonly links = [
    { label: "Home", to: "/" },
    { label: "Beta Access", to: "/beta" },
    { label: "About", to: "/about" },
  ];

  protected readonly identity = computed(() => {
    const user = this.auth.user();
    return user?.email || user?.phone || user?.id || "";
  });
  protected readonly initial = computed(
    () => (this.identity() || this.appName).trim()[0]?.toUpperCase() ?? "A",
  );

  async logout() {
    this.accountOpen.set(false);
    await this.auth.logout();
    await this.router.navigateByUrl("/login");
  }
}
