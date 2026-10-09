import { Component } from "@angular/core";

@Component({
  selector: "app-about",
  template: `
    <article class="max-w-3xl space-y-8 text-ink-muted">
      <header class="space-y-3">
        <h1 class="font-display text-4xl tracking-display text-ink">
          About This Example
        </h1>
        <p>
          A reference Angular app showing Seamless Auth across a frontend, an
          API and the auth server.
        </p>
      </header>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold text-ink">How it fits together</h2>
        <p>
          <code>@seamless-auth/angular</code> holds the session state and
          provides the sign-in screens. It talks only to your API's
          <code>/auth</code> routes, where the Seamless Auth adapter forwards to
          the auth server and keeps the session in httpOnly cookies. No token
          ever reaches this code.
        </p>
        <p>
          The route guards in <code>src/app/app.routes.ts</code> keep signed-out
          visitors on the sign-in screens. They are for navigation only: the API
          checks every request itself.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold text-ink">Learn more</h2>
        <p>
          <a
            class="font-medium text-ink underline"
            href="https://docs.seamlessauth.com"
            target="_blank"
            rel="noreferrer"
            >Read the Seamless Auth documentation</a
          >.
        </p>
      </section>
    </article>
  `,
})
export class About {}
