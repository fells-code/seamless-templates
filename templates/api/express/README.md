# Seamless Auth — Express Starter API

A production-grade **Express + TypeScript + Sequelize** API starter designed to work beautifully with **Seamless Auth** using **server-mode authentication**.

This template is perfect for **founders, indie builders, and engineering teams** who want a secure, scalable backend with minimal setup and a frictionless developer experience.

Everything included in this template is optimized for:

- **DX (Developer Experience)**
- **Security**
- **Scalability**
- **Infrastructure readiness (Terraform, ECS, RDS)**
- **Local + Production clarity**

---

## Features

This starter is packed with modern API features that make building secure SaaS apps easier and faster.

### Seamless Auth (Server Mode)

- Zero-redirect, passwordless authentication
- Cookie-based session validation
- OAuth, magic-link, OTP, WebAuthn, logout, session, organization, and step-up routes mounted under `/auth`
- Role-based access (`requireRole("beta_user")`)
- Automatic user resolution (`req.user`)

### Sequelize ORM

- Postgres integration
- Auto-database creation on boot
- Auto-migration execution in dev & prod
- `User` model keyed by the Seamless Auth user id with nullable `email` and `phone` contact fields

### Beta-Only API

- `GET /beta_users`
- Only users with `"beta_user"` role can access it

### Docker-Ready

- Multi-stage Dockerfile (distroless runtime)
- docker-compose for local PG + API
- Auto-start database
- Auto-run migrations

### DX Enhancements

- Nodemon + ts-node/esm dev experience
- Automatic environment loading
- Automatic database creation
- Automatic migrations
- Clean modular architecture

### Tooling

- ESLint + Prettier
- Husky pre-commit hooks
- lint-staged
- Type-safe directory structure

---

## Directory Structure

```
your-api/
│
├── config/
│ └── config.js → Sequelize config (env-driven)
│
├── migrations/ → Sequelize migrations
│ └── YYYY-create-users.js
│
├── models/ → Sequelize models
│ ├── index.js → Model loader
│ └── user.js → User model
│
├── scripts/
│ ├── ensureDatabase.js → Creates DB if missing
│ └── runMigrations.js → Executes all migrations
│
├── src/
│ ├── controllers/
│ │ └── beta.controller.ts
│ │
│ ├── routes/
│ │ └── beta.ts
│ │
│ ├── middleware/
│ │ └── requireUser.ts (optional)
│ │
│ └── index.ts → Express entrypoint
│
├── Dockerfile
├── docker-compose.yml
├── tsconfig.json
├── package.json
└── .env
```

---

## Environment Variables

Generated automatically by `create-seamless`:

```env
AUTH_SERVER_URL=http://localhost:5312
APP_ORIGIN=http://localhost:3000
UI_ORIGINS=http://localhost:5173,http://localhost:5174
COOKIE_DOMAIN=
COOKIE_SIGNING_KEY=<generated>
API_SERVICE_TOKEN=GRAB_FROM_SEAMLESS_AUTH_PORTAL
JWKS_KID=dev-main

DB_HOST=localhost
DB_PORT=5432
DB_USER=myuser
DB_PASSWORD=mypassword
DB_NAME=seamless_api
DB_LOGGING=false
```

---

## Running Locally

### Install dependencies

```bash
npm install
```

### Start with:

- auto-database creation
- auto-migrations
- hot reload

```bash
npm run dev
```

API runs at:

```
http://localhost:3000
```

---

## Running via Docker

```bash
docker-compose up --build
```

Shut down:

```bash
docker-compose down -v
```

---

## API Endpoints

### Auth Adapter

The Seamless Auth Express adapter is mounted at `/auth` and exposes the 0.5.x server-mode routes, including:

| Method | Route family                       | Description                           |
| ------ | ---------------------------------- | ------------------------------------- |
| POST   | `/auth/login`                      | Starts a login flow                   |
| GET    | `/auth/oauth/providers`            | Lists configured OAuth providers      |
| POST   | `/auth/oauth/:providerId/*`        | Starts and completes OAuth login      |
| GET    | `/auth/magic-link*`                | Requests and verifies magic links     |
| POST   | `/auth/otp/*`                      | Requests and verifies OTPs            |
| POST   | `/auth/webAuthn/*`                 | Starts and completes WebAuthn flows   |
| GET    | `/auth/users/me`                   | Returns the current auth user         |
| DELETE | `/auth/logout` and `/auth/logout/all` | Ends one or all sessions           |
| GET    | `/auth/sessions`                   | Lists current-user sessions           |
| GET    | `/auth/organizations*`             | Proxies organization routes           |
| POST   | `/auth/step-up/*`                  | Runs step-up authentication flows     |

### Beta Access (Role Protected)

| Method | Route         | Description                   |
| ------ | ------------- | ----------------------------- |
| GET    | `/beta_users` | Only accessible by beta users |

Protected via:

```ts
app.use("/beta_users", requireRole("beta_user"), betaRoute);
```

---

## Developer Experience Highlights

### Auto-DB Creation

Works locally and in AWS RDS:

```bash
node scripts/ensureDatabase.js
```

### Auto-Migrations

Every dev / prod boot runs:

```bash
node scripts/runMigrations.js
```

### Modern ESM + TypeScript

- Native Node 18+ features
- ts-node/esm for dev
- First-class module support

### Sequelize ORM

Familiar API for Node developers.

### Docker + Terraform Ready

Matches the target arch for AWS ECS + RDS.

---

## Linting, Formatting & Precommit Hooks

### Install tooling:

```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-import husky lint-staged
```

---

### \`.eslintrc.json\`

```json
{
  "env": {
    "es2021": true,
    "node": true
  },
  "extends": ["eslint:recommended", "plugin:import/recommended", "prettier"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "import/order": ["error"],
    "no-unused-vars": "warn"
  }
}
```

---

### \`.prettierrc\`

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true
}
```

---

### \`package.json\` updates

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.js",
    "format": "prettier --write .",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,js,json,md}": ["prettier --write", "eslint --fix"]
  }
}
```

---

### Add Husky Hook

```bash
npx husky add .husky/pre-commit "npm run lint && npm run build"
git add .husky/pre-commit
```

This ensures:

- Code is linted
- Code is formatted
- TypeScript compiles
- Bad code never enters the repo

---

## You're Ready for Production & AWS

This starter already includes:

- Sequelize ORM
- Auto migrations
- Role-based auth
- Docker-ready builds
- Distroless images
- ESM TypeScript
- Precommit pipeline
- DX-focused architecture

It can be deployed today to:

- AWS ECS/EKS
- AWS RDS Postgres
- CloudFront + ALB
- Fly.io
- Render
- DigitalOcean Apps

Next steps (optional):

- Add Terraform modules
- Add CI/CD
- Add OpenAPI docs
- Add unit testing
- Add worker queues

Happy building with **Seamless Auth**! 🚀
