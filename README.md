# Seamless Templates

[![License: AGPL-3.0-only](https://img.shields.io/badge/License-AGPL3-yellow.svg)](LICENSE)

The frontend and API starter templates for [Seamless Auth](https://seamlessauth.com), an open source, passwordless authentication system.

This repository is the single source of truth for the starters that [`seamless-cli`](https://github.com/fells-code/seamless-cli) scaffolds. The CLI reads [`registry.json`](registry.json), presents the available templates during `seamless init`, and copies the chosen ones into a new project already wired to the auth server.

You usually do not clone this repository directly. Run the CLI instead:

```bash
npx seamless-cli init my-app
```

---

## Repository layout

```text
seamless-templates/
├─ registry.json              # the catalog the CLI reads to build its prompts
├─ templates/
│  ├─ web/
│  │  └─ <framework>/         # one directory per web starter
│  │     ├─ template.json     # how the CLI fetches and configures this template
│  │     ├─ .env.example      # the template's environment contract
│  │     └─ ...               # the actual starter project
│  └─ api/
│     └─ <framework>/         # one directory per API starter
└─ scripts/validate-templates.mjs
```

Each template is a complete, runnable project. The CLI downloads this repository at a pinned tag, copies the selected template directories into the new project (`web/`, `api/`), and fills their `.env` files from each template's declared contract.

---

## The registry

[`registry.json`](registry.json) is the catalog. Every template the CLI can offer has one entry:

```jsonc
{
  "schemaVersion": 1,
  "templates": [
    {
      "id": "react-vite",          // unique, kebab-case
      "kind": "web",               // "web" or "api"
      "framework": "react",
      "label": "React (Vite)",     // shown in the CLI prompt
      "status": "stable",          // "stable" | "beta" | "coming-soon"
      "path": "templates/web/react-vite"
    }
  ]
}
```

`status: "coming-soon"` advertises a template in the CLI as a disabled option without requiring its content to exist yet.

## The template manifest

Each template directory carries a `template.json` that tells the CLI where to place it and how to configure its environment. This is what replaces per-framework wiring living inside the CLI:

```jsonc
{
  "id": "react-vite",
  "targetDir": "web",
  "env": {
    "fromExample": ".env.example",
    "set": {
      "VITE_AUTH_SERVER_URL": "{{authServerUrl}}",
      "VITE_API_URL": "{{apiUrl}}"
    }
  },
  "requires": { "cliMin": "0.3.0" }
}
```

The CLI computes the shared values and resolves the `{{...}}` placeholders in `env.set`. A new framework with different variable names (for example `NEXT_PUBLIC_*`) only needs a different `set` map, not a CLI change.

### Placeholder vocabulary

| Placeholder | Resolves to |
| --- | --- |
| `{{authServerUrl}}` | URL of the Seamless Auth server |
| `{{apiUrl}}` | URL of the project's API service |
| `{{apiToken}}` | Service token shared between the API and the auth server |
| `{{jwksKid}}` | JWKS key id the auth server signs with |
| `{{secret:N}}` | A freshly generated N-byte hex secret, unique per scaffold |

---

## Adding a template

1. Create `templates/<kind>/<framework>/` with a complete, runnable starter.
2. Add a committed `.env.example` describing its environment contract.
3. Add a `template.json` manifest (see above).
4. Add an entry to `registry.json`.
5. Run `npm run validate` and open a pull request.

CI validates the registry and every manifest, then installs and builds each template to confirm it works before it ships.

---

## Local development

```bash
npm install
npm run validate
```

`npm run validate` checks that `registry.json` is well-formed and that every referenced template has a valid `template.json` and `.env.example`.

---

## Versioning

Releases are managed with [Changesets](https://github.com/changesets/changesets) and published as git tags. The CLI pins a specific tag, so scaffolding is reproducible. Add a changeset with any change that affects scaffolded projects:

```bash
npm run changeset
```

---

## License

AGPL-3.0-only © 2026 Fells Code LLC

See [`LICENSE`](LICENSE) for the full text and [`LICENSE.md`](LICENSE.md) for a summary.
