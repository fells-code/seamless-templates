import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

import { getApiUrl, MISSING_API_URL_MESSAGE } from "./runtime-config";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: `
    @if (configured) {
      <router-outlet />
    } @else {
      <div
        class="flex min-h-screen items-center justify-center bg-surface px-6"
      >
        <div
          class="max-w-lg rounded-card border border-line bg-surface-raised p-8"
          role="alert"
        >
          <h1 class="text-xl font-semibold text-ink">
            This app is not configured
          </h1>
          <p class="mt-3 text-sm text-ink-muted">{{ message }}</p>
        </div>
      </div>
    }
  `,
})
export class App {
  protected readonly configured = getApiUrl() !== null;
  protected readonly message = MISSING_API_URL_MESSAGE;
}
