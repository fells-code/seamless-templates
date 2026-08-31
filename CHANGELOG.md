# seamless-templates

## 0.10.0

### Minor Changes

- 43239a8: feat(templates): name auth cookies per application

  Both API starters (`express` and `fastify`) now read `AUTH_COOKIE_PREFIX` and
  derive `accessCookieName`, `refreshCookieName`, `registrationCookieName` and
  `preAuthCookieName` from it, passing all four to the auth server and the matching
  `cookieName` to `requireAuth`.

  Cookies are scoped by host and ignore the port, so two Seamless applications
  served from the same host share one cookie jar and overwrite each other's
  session. Signing into one signs you out of the other. That is invisible in
  production, where each application has its own domain, and unavoidable in
  development, where they are all on localhost.

  The guard has to be told the name as well as the server. Left on its default it
  looks for `seamless-access` while the server has issued something else, and every
  request 401s while holding a valid session.

  The default prefix is `seamless-`, which reproduces the names
  `@seamless-auth/express` already uses, so an existing project upgrades without
  logging anyone out. `.env.example` and the README table in both starters document
  the variable.

  Note for anyone scaffolding several applications on one host: the variable is
  read but not yet set by `template.json`, so a project created by the CLI still
  gets the default names and still shares a cookie jar with its neighbours. Set
  `AUTH_COOKIE_PREFIX` in the generated `.env` to separate them.

- 1dca3d9: feat(templates): give each style its own voice, and replace generated artwork

  The shared React kit gains a font token per role (`--app-font-display`,
  `--app-font-body`, `--app-font-label`), a `Vista` backdrop component, and
  full-viewport views with scroll-driven transitions. Nothing is downloaded: the
  tokens name system stacks only, so the lever is which of the faces an OS already
  ships each style reaches for.

  `Vista` is a fixed stack of four layers behind the page: two concentrated light
  sources, concentric rings, a slow conic sweep, and a ruled grid. Every layer is a
  gradient built from the application's own two colours, so one component still
  comes out looking like that application, and a style that wants no backdrop sets
  each layer to `none`. It also carries the page background, which is why the shell
  mounts it once and content above it needs `above-vista`.

  Each region a `Screen` renders is now a view. A style decides whether that means a
  block of an ordinary scrolling page or a full height of the window that the page
  settles on, so the same markup is a working tool or an experience without being
  written twice. The reveal animation is ranged over `cover` rather than `entry`,
  because a view as tall as the window never finishes entering and an entry range
  strands it part-way through with its content invisible. Both scroll-driven
  behaviours sit behind `@supports` and `prefers-reduced-motion`, and degrade to
  visible.

  This replaced the per-application SVG motif. A drawing had to be invented on every
  run, came out differently each time, and was reliably the least convincing thing
  on the screen. `Screen`, `AuthFrame` and `EmptyState` no longer accept a `motif`
  prop, and the prop is gone from `types.ts`.

  Also in this change: the `board` archetype now renders a banded header, like every
  archetype except `feed`.

  Breaking for anyone consuming the kit directly: passing `motif` to `Screen`,
  `AuthFrame` or `EmptyState` is now a type error, and the `--app-motif-*` tokens no
  longer exist. Generators that write a `Motif` component alongside a screen need
  updating in step, since the backdrop now belongs to the theme rather than to the
  subject.

- bb91642: feat(kit): give the kit rank, real type, and a vocabulary for meaning

  Three changes to the shared React kit, each of them structural rather than
  cosmetic. A screen built from this starter was reading as a populated wireframe
  rather than as a designed application, and no amount of retuning colour, radius
  or density was going to reach that.

  **Nothing on a screen outranked anything else.** Every screen was a header, then
  N equal figures, then equal cards, then a table. `StatRow` made it worse on
  purpose: past two items it shrank all of them to fit, so the number an
  application exists to show was the same size as the three supporting it. There
  was no hero-figure concept in the kit at all.

  The first stat now renders as a filled panel at half again the figure size, with
  the rest sharing the band beside it, through a new `lead-*` token family. A theme
  that wants no panel sets the fill transparent and gets the size jump alone, which
  is what the ruled and unframed themes do. A screen with genuinely equal figures
  passes `lead={false}`.

  **The kit could not say what things meant.** No badge, no chip, no status, so
  every distinction a reader most needs at a glance was prose inside a card, and
  the three things every application has to say (this went up, this failed, this is
  not settled yet) were said in literal `text-green-600` and `text-red-600`. A
  fixed Tailwind green is the one colour on a page that belongs to no palette, and
  it shows.

  `Badge` ships with five tones reading new `positive`, `negative`, `warn` and
  `accent-soft` roles. `DataTable` columns take `lead` and `quiet`, so the column
  carrying the answer outweighs the raw input beside it. `ActionCard` takes an
  icon.

  **The type was a system stack and nothing else.** The reasoning was that an
  application scaffolded from here may ship anywhere, with no font host to depend
  on, which is about third-party hosts rather than about bundling. Five variable
  families now ship in `public/fonts`, subset to Latin and Latin Extended, served
  from the application's own origin, each with its system stack still behind it. A
  browser downloads only the families it actually renders, so the cost is one or
  two files rather than five. Archivo carries a width axis and is reachable through
  the new `display-stretch` token, which is the whole distance between condensed
  capitals and expanded ones out of a single download.

  Also fixed, all of it visible on screen:

  - `numeric` forced `font-feature-settings: "zero" 1`, so every theme rendered a
    slashed zero whether or not it wanted one. It is a token now.
  - `PageHeader` laid its actions out as a flex row beside the title. At display
    size the headline wraps and the actions wrapped with it, landing under a
    headline mid-paragraph. A display header stacks and gives them their own row,
    aligned the way the theme already aligns its column.
  - A landing screen took the create rail, leaving a 20rem column empty down the
    length of the first screen anyone sees, and opened on a form rather than on the
    overview. It gets the full width now, and the form follows the content.
  - Card titles truncated at rail widths.
  - `sync-shared` compared and copied through a utf8 decode, which would have
    quietly corrupted every font binary the manifest now carries. It works in
    buffers.

  Two claims in the unreleased "give each style its own voice" entry are superseded
  by this one, and both ship in the same release. The type tokens no longer "name
  system stacks only", they name bundled faces with the system stacks behind them;
  and a region of a screen is no longer a full height of the window the page
  settles on. The view-height and snap tokens remain, and remain a theme's to set.
  Nothing sets them.

- a723535: feat(templates): give both React starters a design token layer, an app shell, and a shared UI kit

  Both React starters (`react-vite` and `react-oauth`) now take every colour, radius,
  shadow, duration and type size from custom properties declared in `src/index.css`.
  No component carries a literal colour, so the whole application rethemes from one
  block, and the tokens respond to the OS colour scheme without any `dark:` variants
  in markup.

  On top of that:

  - `layouts/Layout.tsx` and `components/Navbar.tsx` are a persistent sidebar shell
    with full-width content, replacing the centered navbar over a centered column.
    The sidebar reads its own `shell` token family, so a theme can put a deep
    sidebar against light content.
  - `src/components/kit` is a set of composable, token-styled pieces: `Screen`
    (which arranges a page by named archetype), `AuthFrame`, `StatRow`,
    `InlineCreateForm`, `RecordList`, `RecordCard`, `DataTable`, `RankedTable`,
    `ActionCard`, `EmptyState`, `Field`, `Toggle`, `PrimaryButton`, and a
    `useCollection` hook that loads a collection and creates optimistically.
    `kit/Example.tsx` is a worked screen built from them.
  - Each starter's own pages are composed from the kit and use the tokens
    throughout. The OAuth starter keeps its provider-driven sign-in, its callback
    route and its own nav entries.

  The tokens, the shell layout and the kit are identical in both starters and are
  kept that way mechanically: they are edited in `shared/react-app` and copied into
  each template by `npm run sync:shared`, and `npm run validate` fails when a copy
  has drifted. This repository is not published to npm and the CLI copies exactly one
  template directory into a new project, so each template has to carry its own copy
  rather than importing a package.

  Existing projects are unaffected until they scaffold again.

### Patch Changes

- 7512ee6: fix(templates): give both API starters a production image, and make sequelize-cli a runtime dependency

  The API starters shipped a Dockerfile that said `# NOT a production image` in its
  own second line. It ran `npm i` at build time and `tsx watch` as its command, so
  nothing scaffolded from these templates could be deployed without the adopter
  writing their own.

  Both starters now build from one multi-stage file with two targets. `dev` is what
  it always was, the whole toolchain under `tsx watch`, and `docker-compose.yml`
  asks for it by name. `runtime` compiles, installs production dependencies only,
  drops to the `node` user and runs `npm start`. One file rather than two because a
  second Dockerfile is a second thing to keep in step, and these two share every
  layer up to the dependency install.

  The second half is the reason the first half did not work on the first attempt.
  `npm start` runs `scripts/runMigrations.js` before the server listens, and that
  script shells out to `npx sequelize-cli db:migrate`. With `sequelize-cli` declared
  as a devDependency, an `npm ci --omit=dev` image does not contain it, and `npx`
  quietly downloads it from the registry at container start instead of failing:

  ```
  npm warn exec The following package was not found and will be installed: sequelize-cli@6.6.5
  ```

  That is worse than a crash, because it works in development and in any
  environment with open egress. Behind an egress allowlist, which is what a
  generated application is supposed to run behind, the same image dies at boot with
  `EAI_AGAIN registry.npmjs.org`. It also puts an unpinned registry fetch inside the
  startup path of every cold start.

  `sequelize-cli` is therefore a runtime dependency of these templates, because
  `npm start` invokes it, and it is declared as one. The fixed image resolves it
  locally and starts with no network at all.

  Verified on both starters: `dev` and `runtime` both build, the runtime image
  carries `dist/`, `sequelize-cli` and neither `tsc` nor `tsx`, and
  `npx sequelize-cli --version` answers `6.6.5` with `--network none`.

- 417d1c7: fix(kit): draw AuthFrame's band marks from the band's own pair, not the accent

  The bullet marks beside the pitch on the sign-in screen were `bg-accent`, on the
  band. The accent is picked to sit on a surface, so on the band it is whatever it
  happens to be, and a kit that chooses a deep accent loses the marks completely.

  This is not only true of a deep accent. Measured against the palette this repo
  ships, the marks are already at 2.69:1 in light and 1.97:1 in dark, because the
  default accent is a sky blue and the default band is a blue. They are
  `aria-hidden`, so no accessibility check ever failed on them; they were simply
  close to invisible, and in only one theme at a time, which is how it survived
  review.

  `bg-on-band` is the pair the kit keeps for exactly this. It is 5.75:1 and 4.21:1
  against the same two bands, and it follows the band wherever a kit takes it,
  including the styles where the band is a window onto the backdrop rather than a
  panel of colour. `PrimaryButton`'s `onBand` variant already reads from it and
  already explains why; the marks now do the same and carry the rule.

  The rest of the sweep came back clean. Only `Screen` and `AuthFrame` render
  inside `band-fill`, everything `Screen` puts there (`PageHeader`, `StatRow`)
  already takes `onBand` and reads from the band pair, and `StatRow`'s lead panel
  brings its own fill and ink together so it is self-consistent wherever it lands.

- 46bc615: fix(templates): keep `dev` the default Docker target

  The previous change gave both API starters a multi-stage Dockerfile with a `dev`
  target and a `runtime` target, and put `runtime` last. Docker's default target is
  the last stage, so `build: .` silently started producing a production image for
  every existing caller.

  That breaks anything that bind-mounts the source for reload, which is what the
  compose file `seamless-cli` generates does:

  ```yaml
  api:
    build: ./api
    volumes:
      - ./api:/app
      - /app/node_modules
  ```

  The mount lands on top of `/app` and masks the image's compiled `dist`, so the
  container runs `npm start`, finds no `dist/src/index.js`, and exits before it
  listens. The image is correct; the mount hides it. The failure reads as a broken
  build rather than a wrong target, which is what made it worth a comment in the
  file.

  `dev` is now the last stage and therefore the default, which is what every
  existing caller already assumed. Production is opt-in with
  `docker build --target runtime .`, chosen by the thing doing the deploying rather
  than inherited by anything that happens to run `docker build`.

  Nothing about the runtime image changed. It still compiles, installs production
  dependencies only, drops to the `node` user and runs `npm start`.

  One operational note for anyone who hit the broken version: the anonymous
  `/app/node_modules` volume will still hold the production-only modules from the
  failed image, and Docker reuses an existing anonymous volume rather than
  repopulating it, so `npm run dev` fails with `tsx: not found` even after a
  correct rebuild. `docker compose up --force-recreate --renew-anon-volumes api`
  clears it.

- 54affcd: feat(kit): add a seconds-based `clock` stat format

  The kit offered `currency`, `percent` and `duration`, and `duration` takes
  **minutes** and rounds to a whole one. So there was no way to render a figure
  measured in seconds, and no way to show seconds at all.

  Anything a person races, laps, lifts or cooks is measured in seconds and lives
  under an hour, and a generated application handed those numbers has only one
  duration format to reach for. A Hyrox trainer built from these templates rendered
  its predicted finish as **"44h"**: eight 1km runs at 330 seconds is 2640, and
  `formatDuration(2640)` is 44 hours 0 minutes. The same page rendered a 255 second
  SkiErg split as "4h 15m".

  That is not a mistake anyone can see in review. The value is a number, the format
  is named `duration`, and the output is a plausible-looking duration. Only the
  magnitude is wrong, and only if you know what the figure should be.

  `formatClock(seconds)` renders `4:15` and `1:17:15`, and `format: "clock"` selects
  it from `StatRow`, `DataTable` and anywhere else `formatStat` is used. Both
  functions now carry a comment naming their unit, and `StatFormat` documents the
  distinction inline, because that type is the prop surface a generator reads.

  `formatDuration` is unchanged. Minutes are still right for the things that are
  genuinely measured in minutes.

- 7b278e5: fix(templates): declare Sequelize model attributes instead of using public class fields

  The `User` model in both API starters (`express` and `fastify`) declared its
  attributes as `public id!: string`. Sequelize installs its attribute getters and
  setters on the prototype, and a public class field is emitted as an own property
  initialised to undefined, which shadows them: `user.id` reads undefined while
  `user.get("id")` returns the row's value. Sequelize warns about this at model
  init. `declare` emits no field at all, so the accessors survive.

  Whether the field is emitted depends on `useDefineForClassFields`, which follows
  `target`. Both starters compile at `target: ES2020`, where the field is erased
  and the shadowing does not occur, so this is a guard rather than a repair of
  behaviour anyone is seeing today. It matters because the guard is what keeps a
  later `target` bump from silently breaking every model: at ES2022 the same code
  returns undefined for every attribute, and the first symptom is a query built
  with an undefined parameter on a handler that filters by `req.appUser.id`.

- d6146d6: feat(kit): mark the generated sign-in screen with Seamless Auth and Seamless Idea

  Every generated application is shared with the handful of people it was made
  for, and every one of them signs in. That screen is the largest owned surface the
  company has, it grows with the fleet, it costs nothing, and it said nothing at
  all.

  `AuthFrame` now carries two lines under the form:

  - **Secured by Seamless Auth**, to `seamlessauth.com`. Most of the people
    reading it are about to use passwordless sign in for the first time, and
    naming it is the only distribution the auth product gets from the fleet.
  - **Made with Seamless Idea**, to `seamlessidea.com`.

  Restraint is the whole design. They sit under the sign-in screens rather than
  beside them, at footnote size in the muted ink role, centred, with no logo and no
  lockup. A generated application has to feel like its owner's, and a banner across
  the top would undo the thing that makes personal software worth having. Both
  links open in a new tab so that nobody mid-sign-in loses the page, and they carry
  `noopener` without `noreferrer`, because the referrer is the only way either
  product ever sees that a generated application sent someone.

  There is no switch to turn them off. The templates are copied into the owner's
  project, so the lines can always be deleted; whether a paid tier removes them is
  a decision for the CLI rather than a prop on the kit.

- 5a13319: feat(kit): add an opt-in live refresh to `useCollection`

  `useCollection` loaded once. Anything built from these templates where more than
  one person is looking at the same records went stale the moment somebody else
  posted, and the only way out was a reload button the reader had to know to press.

  The obvious fix is a socket server, and it is the wrong shape for what these
  templates generate: an Express API behind a load balancer, with the auth wiring
  off limits. A socket means a second server, a second protocol and an auth
  handshake to go with it. A poll plus a refresh on focus is the same seam at a
  fraction of the cost, and for a group of a dozen people it is not tellable from
  realtime.

  ```ts
  const { records, create } = useCollection<Message>("/messages", {
    live: 5000,
  });
  ```

  `live` is off by default, so every existing call site behaves exactly as before.
  When it is set, the collection refetches on that interval and also whenever the
  window is focused or the tab becomes visible again, which is what a phone taken
  out of a pocket needs: current on the first look, not one interval later.

  A refresh is deliberately quieter than a load:

  - it never sends the screen back to its loading skeleton, so records swap
    underneath the reader instead of flashing;
  - it never clears an error, because the reader may be part way through one, and a
    refresh that fails at all is silent and simply tried again on the next tick;
  - it keeps a record whose create is still in flight, so an optimistic row is not
    taken off the screen by a poll that answered before the post landed.

  `refresh()` joins `reload()` on the returned object for the cases a screen knows
  about a change itself. `reload()` is unchanged, loading state and all, which is
  what a retry button wants. `UseCollection<T>` only gained a member, so nothing
  that reads the hook needs touching.

- b7b9a89: feat(kit): tell somebody the API is waking up, instead of failing at them

  An application whose API scales to zero costs a fraction of one that does not,
  and the price is that the first request after an idle spell wakes the task and
  takes tens of seconds. Until now the front end had nothing to say about that. A
  sleeping API produced whatever a failed fetch produces, which to a visitor is
  indistinguishable from a broken link.

  The person who meets the cold path is never the owner. The owner's first view
  happens seconds after the build, while the task is still warm. The cold path
  belongs to somebody who was sent a link days later, has never seen the
  application before, and is deciding what they think of the whole thing in that
  one moment.

  **`apiFetch` now throws an `ApiError`** carrying the `status` and a `waking` flag.
  A 502, 503 or 504 is a load balancer with nothing healthy behind it yet. So is a
  fetch the browser rejected outright, because a load balancer's own 503 carries
  none of the API's CORS headers and therefore reaches the page as no answer at
  all rather than as a status. Being offline is ruled out, since the browser is
  sure about that one, and a missing `VITE_API_URL` is deliberately left as the
  plain configuration error it has always been: dressing that up as an API that is
  about to answer would leave the screen waiting patiently forever.

  **`useCollection` waits it out.** A first load that fails this way puts the
  collection into a new `waking` state and retries with backoff, capping at eight
  seconds and giving up after about a minute and a half, which is comfortably
  longer than a cold start. It recovers on its own with nobody pressing anything.
  Retries keep the waking state rather than flashing the skeleton, the pending
  retry is cancelled on unmount and when the path changes, and giving up resets
  the window so a retry button gets the whole wait again rather than an instant
  refusal.

  **`LoadState` gains `waking`, and `RecordList`, `DataTable` and a new
  `WakingState` render it**: a calm panel that says the application sleeps while
  nobody is using it, that this takes a few seconds, and that there is nothing to
  do. It is announced politely to assistive technology, it takes no props so that
  every generated application says it the same way, and it is neither a skeleton
  nor an error, because it is neither.

## 0.9.0

### Minor Changes

- 624e3a6: Move both API starters to PostgreSQL 18.

  `seamless-cli` now scaffolds and conformance-tests PostgreSQL 18, so a project created by
  `seamless init` was naming two different majors in the same directory: `postgres:18` in the
  CLI-generated compose file and `postgres:16-alpine` in the API starter copied in beside it. Both
  starters now pin `postgres:18-alpine`.

  The volume mount had to move with the tag. PostgreSQL 18+ images store data in a major-versioned
  subdirectory (`/var/lib/postgresql/18/docker`), so the mount is now `/var/lib/postgresql` rather than
  `/var/lib/postgresql/data`. Keeping the old path is not a cosmetic mismatch: the container treats the
  mount as unused and refuses to start with `Error: in 18+, these Docker images are configured to store
database data in a format which is compatible with "pg_ctlcluster"`. See docker-library/postgres#1259.

  This does not touch an existing project. Starter files are copied in at scaffold time, so a project
  keeps the compose file it was created with. Only newly scaffolded projects get 18, on a fresh volume.

- acedd3f: Move both React starters to `@seamless-auth/react` `^0.9.0`.

  0.9.0 makes the bundled auth screens themeable. Every colour in them now reads from a `--seamless-*`
  CSS custom property with the previous literal as its fallback, so a project can match the auth UI to
  its brand by setting those variables on `:root` or on any ancestor of `<AuthRoutes />`.

  The upgrade is additive. The public API is unchanged between 0.8.0 and 0.9.0, and a template that
  sets no variables renders exactly as it did before, so neither starter needed a source change. Both
  were installed, built, and linted against 0.9.0.

- b722574: Give every template a working test, lint, and format setup out of the box.

  All four starters (React Vite, React OAuth, Express, Fastify) now ship Vitest with tests that pass
  on a fresh `npm install`, Prettier alongside the existing ESLint config, and the same script names:
  `typecheck`, `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`, `test:coverage`,
  and a `check` that runs the whole gate in one command.

  The tests cover the configuration and startup logic that decides whether a scaffolded project runs
  at all, and need no database, auth server, or network:

  - API starters: connection-string resolution (including `sslmode` and credential escaping) and the
    boot-time environment check, including the placeholders `seamless init` writes into a managed
    `DATABASE_URL`.
  - Web starters: API origin resolution across the container-injected config and `VITE_API_URL`, URL
    joining and error handling in `apiFetch`, and a component test. The OAuth starter also covers its
    callback route with the SDK and router stubbed.

  Also in this change:

  - ESLint now covers the whole project in the API starters rather than `src` only, and uses Node
    globals instead of browser globals. That surfaced an unused catch binding in
    `scripts/runMigrations.js`, now fixed.
  - `eslint-config-prettier` is wired in so lint and format never disagree about the same line.
  - The API starters build with a `tsconfig.build.json` that keeps tests out of `dist/`, while
    `npm run typecheck` still checks them.
  - CI runs typecheck, lint, format check, tests, and build for every template on pull requests.

## 0.8.1

### Patch Changes

- 785eb7e: Fix registration failing in the Fastify API starter.

  Registering against the scaffolded API returned a 500 with
  `TypeError: option maxAge is invalid: 300`. The auth server sends the registration response's `ttl`
  as the string `"300"`, and the Fastify adapter passes it to a cookie library that requires an
  integer. The Express starter never showed this because its adapter multiplies the value into
  milliseconds, which coerces the string.

  `@seamless-auth/core` 0.12.1 parses the lifetime before it reaches an adapter, which fixes the
  starter without waiting on the auth server to send a number. It arrives here through
  `@seamless-auth/fastify` 0.3.1.

  The template's committed lockfile is what pinned the broken version, so the lockfile change is the
  functional part of this.

## 0.8.0

### Minor Changes

- 6abdb46: Move the templates onto the Seamless SDK releases that let a user finish registration without a
  passkey.

  Registration used to end on a screen with one control on it. A user who did not want a passkey, or
  whose device could not make one, had no way forward. `@seamless-auth/react` 0.8.0 offers a skip when
  the instance has a login method other than `passkey` enabled, and says plainly when it does not.

  The web and API templates have to move together for that to work. The skip is gated on reading
  `GET /system-config/public` from the auth server, and the adapters serve routes from an explicit
  list, so the React templates on 0.8.0 need an API template that proxies the new route. A web
  template upgraded on its own would read nothing, and fall back to showing no skip at all.

  - `@seamless-auth/react` 0.7.0 to 0.8.0 in both React templates
  - `@seamless-auth/express` 0.11.0 to 0.12.0
  - `@seamless-auth/fastify` 0.2.0 to 0.3.0

### Patch Changes

- 71fb00b: Fix two boot-time footguns in the Fastify API starter.

  `PORT` is read with `||` rather than `??`, so an empty `PORT=` in `.env` falls back to 3000. It
  previously reached `Number("")`, which is `0`, and Fastify binds port 0 to a random free port, so the
  API came up somewhere nobody was looking.

  `pino-pretty` moves from `devDependencies` to `dependencies`. The logger loads it for any `NODE_ENV`
  other than `production`, so an install that omitted dev dependencies, which is the usual shape of a
  staging deploy, failed to boot on a missing transport target.

## 0.7.0

### Minor Changes

- 7eb4777: Add a Fastify API starter, so the backend prompt in `seamless init` is a real choice.

  `templates/api/fastify` serves the same surface as the Express starter, on the same Postgres and
  Sequelize setup and the same environment contract: the Seamless Auth plugin at `/auth`, the admin
  console proxied at `/console` behind `SERVE_ADMIN_CONSOLE`, a local `User` resolved from the session
  and exposed as `request.appUser`, and `GET /beta_users` gated by role. It is registered as `beta` in
  the registry, which the CLI offers and labels as such.

  Where Express orders middleware, this orders Fastify scopes, and that is the whole access-control
  story. The console proxy sits on the root instance, outside the CORS scope and the session guards,
  because it serves same-origin static content that has to load for a signed-out admin. CORS, the auth
  plugin, and the guarded routes live in an encapsulated scope below it. The guarded scope registers
  `@fastify/cookie` for itself: the auth plugin registers it too, but that registration is
  encapsulated to the auth routes, so `requireAuth` and `getSeamlessUser` in a sibling scope would
  otherwise see no cookies and reject every request.

  Logging is Fastify's own pino instance rather than a second logger alongside it, so the adapter's
  diagnostics (it logs through `request.log`) land in the same stream as the application's.

  This starter's `.env.example` ships a `COOKIE_SIGNING_KEY` and `API_SERVICE_TOKEN` that are long
  enough to boot. The adapter refuses to start on a secret under 32 characters, so the documented
  `cp .env.example .env && npm run dev` path has to start from values that clear it.

  Requires `@seamless-auth/fastify` 0.2.0 or later, the first release with `seamlessConsoleProxy`.

### Patch Changes

- a5c644d: Ship secret placeholders of at least 32 characters in the Express template's
  `.env.example`.

  `@seamless-auth/express` runs `assertSecrets` from `@seamless-auth/core`, which
  throws when `cookieSecret` or `serviceSecret` is shorter than 32 characters. The
  committed defaults were `COOKIE_SIGNING_KEY=somethingSecret` (17) and
  `API_SERVICE_TOKEN=GRAB_FROM_SEAMLESS_AUTH_PORTAL` (30), so the local path the
  README documents (`cp .env.example .env && npm run dev`) died at startup with
  "cookieSecret must be at least 32 characters". A project scaffolded by
  `seamless init` was unaffected, because the CLI fills `COOKIE_SIGNING_KEY` from
  `{{secret:32}}` and only fills `API_SERVICE_TOKEN` when there is a portal token.

  Both placeholders are now long enough to boot, and the comments state the
  minimum, matching the Fastify template.

## 0.6.0

### Minor Changes

- fcee28e: Move the templates onto the current Seamless packages: `@seamless-auth/react` `^0.7.0` in both React
  templates, and `@seamless-auth/express` `^0.11.0` in the Express API template.

  React 0.7.0 sources its types from `@seamless-auth/types` rather than maintaining a parallel set, so
  the session page now shows the user's last login and each passkey's registration date, both of which
  the API already sent but the older types did not describe. Timestamps are ISO strings on the wire, so
  the page no longer has to accept a `Date` that never actually arrived, and `roles` is required rather
  than optional.

  The OAuth callback screen reads the auth server's failure code through the new `getOAuthErrorCode()`
  and gives each of `oauth_missing_email`, `oauth_email_not_verified`, and `oauth_missing_subject` its
  own message. All three are conditions at the provider that retrying cannot fix, so the previous
  "please try again" was advice that could not work. Any other failure keeps the generic message.

  Express 0.11.0 needs no template changes. Its breaking change splits `error` into `errorCode` and
  `errorBody` on the handler result types, which only affects code importing handlers from
  `@seamless-auth/core` directly; the template uses `createSeamlessAuthServer`, `requireAuth`, and
  `requireRole`, whose HTTP responses are unchanged.

  Fixes the auth route paths in the React starter README, which still listed the mixed-case spellings
  (`/passKeyLogin`, `/verifyPhoneOTP`, `/verifyEmailOTP`, `/registerPasskey`, `/magiclinks-sent`) that
  SDK 0.5.0 renamed and no longer serves.

- f53c54a: Add a session inspector page to both web templates, and fail fast on missing configuration.

  Both React templates gain a protected `/session` route that renders what the SDK actually knows
  about the current session: the issued claims, roles, organization context, step-up freshness with
  its expiry, and the registered passkeys, plus buttons to re-read the session and sign out
  everywhere. The raw `JSON.stringify(user)` dump moves off the home page into a collapsed block
  there, so the first authenticated screen reads as an app rather than a debug view.

  `RequireAuth` no longer swaps in the loading screen while an already-authenticated page re-reads
  its session, which previously unmounted the page and discarded its state.

  Missing configuration now stops the templates with a message that names the variable. The Express
  API asserts `AUTH_SERVER_URL`, `COOKIE_SIGNING_KEY`, `API_SERVICE_TOKEN`, `JWKS_KID`, and its
  database settings before the server is built, reporting every problem at once instead of failing as
  a 500 on the first authenticated request; it also catches a `DATABASE_URL` still carrying the
  placeholder credentials `seamless init` writes, and warns on an empty `UI_ORIGINS`. The web
  templates render a configuration page when `VITE_API_URL` is unset, rather than pointing every auth
  request at their own origin.

### Patch Changes

- 1e62a3d: Bump both React templates (react-vite and react-oauth) to `@seamless-auth/react`
  `^0.6.0`. The only public type change in `0.6.0` is the removal of the
  `bootstrapToken` field from `RegisterInput`, which neither template used, so no
  template source changes are required.

## 0.5.0

### Minor Changes

- b256dac: The express starter now accepts a `DATABASE_URL` connection string, and enables TLS when it carries
  `sslmode=require`. A managed Seamless database is handed out as a connection string and accepts
  external connections over TLS only, which the starter could not do: it read the discrete `DB_*`
  values and set no SSL option, so a managed database was unreachable from it.

  Resolution is shared by the runtime and the migrations, so `sequelize-cli` targets the same database
  the app does. `DATABASE_URL` wins when set; the local Docker stack keeps using the `DB_*` values.

  Certificate verification stays on. `DB_SSL_REJECT_UNAUTHORIZED=false` is available for a certificate
  that does not chain to a public CA.

  `template.json` declares a `{{databaseUrl}}` env placeholder so the CLI can populate it.

### Patch Changes

- 6277b98: Drop the dev `sendBootstrapInviteEmail` handler from the Express API template.

  The Seamless Auth API removed the admin bootstrap invite flow, so it no longer emits a
  `bootstrap_invite_email` delivery and the handler could never fire. The first admin is now granted
  through `OWNER_EMAIL` instead. Scaffolded projects keep the OTP and magic-link dev handlers, and the
  `NODE_ENV` notes in `.env.example` and the template README no longer mention bootstrap-invite links.

## 0.4.0

### Minor Changes

- 1a5bd00: Set `NODE_ENV=development` in the Express template's `.env.example`.

  The template's dev messaging handlers (which log OTP, magic-link, and
  bootstrap-invite links to the API console instead of sending real email/SMS) are
  gated on `NODE_ENV === "development"`. Without the variable set, `messaging` was
  `undefined`, so the adapter never requested external delivery and local auth
  links appeared nowhere — not in the API logs and not in the CLI. Shipping the
  flag in `.env.example` (loaded via `env_file` in Docker and by `dotenv` for
  local `npm run dev`) makes local delivery work out of the box.

## 0.3.0

### Minor Changes

- e367c56: Make the Express API template's admin-console proxy opt-in via `SERVE_ADMIN_CONSOLE`.

  The `createSeamlessConsoleProxy` mount at `/console` is now gated on
  `SERVE_ADMIN_CONSOLE=true` (the default in `.env.example`). Set it to `false`
  when the dashboard is hosted elsewhere — a standalone container or not at all —
  and the proxy is skipped. This lets a scaffold choose between serving the console
  from the API and running it as a separate service without editing source.

  `template.json` exposes the flag as `{{serveAdminConsole}}` so the CLI can
  pre-configure it, and now requires `cliMin` `0.10.0`.

- 62da514: Serve the Seamless admin dashboard from the Express API template. The template
  now mounts `createSeamlessConsoleProxy` at `/console`, so the dashboard loads
  from the API's own origin and shares the cookie scope of its `/auth` routes,
  with no separate dashboard deployment.

  The proxy is mounted ahead of the CORS allowlist and `requireAuth`. The console
  is same-origin static content rather than a cross-origin API call, so gating it
  on `UI_ORIGINS` would reject the SPA's own asset requests (its module script is
  `crossorigin`, so the browser sends an `Origin` header and the allowlist returns
  an error). It also has to load for a signed-out admin, who then signs in through
  `/auth`.

- 1ee9ce6: Log OTP and magic-link tokens to the console in the Express API template when
  running in development. The template now passes a `messaging` option to
  `createSeamlessAuthServer` with dev-only handlers, which routes delivery through
  the adapter so codes appear in the API logs without a mail or SMS provider. The
  handlers are gated on `NODE_ENV=development` and must be replaced with real
  transports before deploying.
- ee3aa99: Upgrade the Express API template to Express 5 and `@seamless-auth/express` 0.8, which requires
  `express >= 5.0.0` as a peer dependency. The template's `@types/express` was already on v5, so the
  runtime and its types are now aligned.
- 4ba52b8: Update the React OAuth template for the `@seamless-auth/react` 0.5 result-object
  API. Every SDK call now resolves to `{ data, error }` instead of returning the
  payload directly or throwing, so the login page reads providers from
  `data.providers`, the provider redirect reads `data.authorizationUrl`, and the
  OAuth callback checks `error` rather than a `.catch` that the SDK no longer
  triggers. The template now depends on `@seamless-auth/react` `^0.5.0`.
- e8a8eda: Pin the templates to the published Seamless Auth SDK releases: the Express API
  template now depends on `@seamless-auth/express` `^0.9.0`, and the basic React
  (Vite) template on `@seamless-auth/react` `^0.5.0`. The React OAuth template was
  already moved to `^0.5.0` alongside its result-object migration.

### Patch Changes

- 9d291f5: Document the admin console in the Express API template README: the `/console`
  route, why the proxy is mounted ahead of CORS and `requireAuth`, and the auth
  server requirement that comes with it. Passkey ceremonies started in the console
  carry this API's origin, and WebAuthn verification checks it, so that origin has
  to be listed in the auth server's `ORIGINS` or sign-in and step-up fail at the
  finish step while the challenge starts normally.
- 58aec6c: Fix the Express template rejecting its own same-origin requests. Now that the API
  serves the admin console at `/console`, the console calls the API from the API's
  own origin. Browsers omit `Origin` on a same-origin GET but send it on
  POST/PATCH/DELETE, so with only `UI_ORIGINS` allowed the console's reads
  succeeded while every write was refused. Requests whose `Origin` matches the
  server's own host are now treated as same-origin and allowed.

  Disallowed origins are also refused by withholding the CORS headers instead of
  passing an error to the `cors` callback, which previously answered them with a
  500 and made the cause hard to read. Cross-origin preflights from unknown origins
  still receive no `Access-Control-Allow-Origin`, so they remain blocked.

- e8a4cd4: Drop the dead `issuer` option from the Express API template. `@seamless-auth/express` removes `issuer` from `SeamlessAuthServerOptions` (it moved the silent-refresh service token to the fixed M2M contract constants, so the adopter-supplied value reached nothing), and passing it is now a type error. The template no longer sets `issuer`, and `APP_ORIGIN`, whose only consumer was that option, is removed from `.env.example` and the README.

## 0.2.4

### Patch Changes

- 5cd6c21: Make the templates run cleanly and document the managed connect path.

  Express: fix the production `npm run start` path, which was broken two ways. Compiled ESM used extensionless relative imports that Node could not resolve at runtime, and the migration runner pointed at `dist/config/config.js`, which `tsc` never emits. Relative imports now carry `.js` extensions and the runner always uses the source `config/config.js`. Add the `docker-compose.yml` the README and `docker:*` scripts referenced but that did not exist (local Postgres plus the API), switch those scripts to `docker compose` (v2), and rewrite the README to match the actual template while documenting both the local and managed (CLI-filled) paths.

  Web (react-vite and react-oauth): drop the unused `VITE_AUTH_SERVER_URL` from each `template.json` and from the runtime config type. Both apps reach the auth server through the API, so `VITE_API_URL` (`{{apiUrl}}`) is the only value the CLI fills. Both READMEs now document the local and managed paths.

## 0.2.3

### Patch Changes

- f84a69c: Bump the bundled Seamless Auth SDK versions in the templates. The React templates (react-vite and react-oauth) move to `@seamless-auth/react` `^0.4.0`, which adds TOTP (authenticator app) support, and the Express template moves to `@seamless-auth/express` `^0.7.0`, which pulls in `@seamless-auth/core` `0.7.0`. Both are additive upgrades that keep the existing public APIs, so no template source changes are required.

## 0.2.2

### Patch Changes

- 10b6c42: Rename the web templates' build file from `dockerfile` to `Dockerfile` so `docker compose build` finds it on case-sensitive filesystems (Linux/CI). Previously a scaffolded project's web build failed there while working on case-insensitive macOS. Also document the `alias`, `verify.flows`, and `setup.oauth` manifest fields, and expand the react-oauth OAuth provider setup guide (including manual Apple steps).

## 0.2.1

### Patch Changes

- 65d3b43: Publish a GitHub Release on each version. When the "version packages" PR merges, the release step now creates an official GitHub Release for the new v<version> tag, with notes drawn from the matching CHANGELOG.md section, in addition to pushing the tag. The step is idempotent: it skips tag creation and release creation when either already exists.
- a5085f5: The react-oauth template now declares `setup.oauth` in its manifest, so the Seamless CLI prompts for OIDC providers and their credentials when this template is scaffolded and wires them into the auth server.

## 0.2.0

### Minor Changes

- 2d4518e: Add a react-oauth use-case template: an OAuth-first React (Vite) starter that lists the auth server's configured OAuth providers and completes the login on a callback route. Registered with alias "oauth" (for `seamless init --oauth`) and a verify block scoping its conformance to the oauth flow. Also give react-vite the alias "basic".

## 0.1.1

### Patch Changes

- 0f1fa91: Run conformance from the repo root. Add a root conformance workflow that tests the templates against the ecosystem on PRs via the seamless-cli reusable workflow, and remove the inert per-template GitHub workflow that was carried over from the standalone starter (it did nothing here and leaked into scaffolded projects).

## 0.1.0

### Minor Changes

- Initial templates release: React (Vite) and Express starters, the registry and manifest tooling, and validation plus build-smoke CI.
