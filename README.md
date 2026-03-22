# Electric Grid Energy X

Full-stack portfolio project for a fictional regional electricity provider. Demonstrates senior-level engineering across a TypeScript monorepo: production-pattern RESTful API, responsive web portal, cross-platform mobile app, and shared code infrastructure.

## Web App
![Admin View](docs/screenshots/login-web.png)
*Login Screen*

![Admin View](docs/screenshots/web-admin.png)
*Admin*

![Technician View](docs/screenshots/web-tech-v2.png)
*Technician*

![Customer View](docs/screenshots/web-customer-v2.png)
*Customer*

## Mobile App

<p align="center">
  <img src="docs/screenshots/mobile-login.png?v=2" alt="Mobile Login" width="19%" />
  <img src="docs/screenshots/mobile-customer-home.png?v=2" alt="Mobile Customer View 1" width="19%" />
  <img src="docs/screenshots/mobile-customer-billing.png?v=2" alt="Mobile Customer View 2" width="19%" />
  <img src="docs/screenshots/mobile-admin-outages.png?v=2" alt="Mobile Admin View 1" width="19%" />
  <img src="docs/screenshots/mobile-admin-2.png?v=2" alt="Mobile Admin View 2" width="19%" />
</p>
<p align="center">
  <em>Login (furthest left) &nbsp;&nbsp;|&nbsp;&nbsp; Customer (left two) &nbsp;&nbsp;|&nbsp;&nbsp; Admin (right two)</em>
</p>

## Dashboard

Both web and mobile dashboards display interactive charts alongside key stats:

- **Energy Usage** — 12-month area chart (web) / line chart (mobile) showing kWh consumption with seasonal patterns
- **Monthly Cost** — 12-month bar chart showing billing amounts calculated with tiered energy pricing ($0.08–$0.15/kWh across three tiers)
- **Trend Indicator** — percentage change vs last month (green = decreased, red = increased)
- **Stats Cards** — current month usage, monthly average, 12-month total, and active outage count

Charts on mobile are horizontally scrollable, showing the full 12-month history. Billing amounts are derived directly from actual meter readings using the shared `calculateEnergyCost` utility, so usage and cost charts always correlate.

## Live Data Simulation

A GitHub Actions cron job runs on the 1st of each month to generate realistic new data, keeping the live demo fresh without manual intervention:

- **Daily meter readings** — 30 readings per meter with seasonal variation (higher in summer/winter, lower in spring/fall)
- **Billing cycles** — automatically generated from that month's readings using tiered energy pricing
- **Notifications** — billing alerts sent to customer accounts when new bills are created
- **Outages** — 1–2 realistic outage events created and resolved each month from a rotating template pool

The simulation is triggered via `POST /api/simulate`, protected by a bearer token (`SIMULATION_SECRET`). It can also be triggered manually from the GitHub Actions tab via `workflow_dispatch`.

## Live Demo

| Platform | URL | Hosting |
|----------|-----|---------|
| **Web App** | [egx-web.vercel.app](https://electric-grid-energy-x-web.vercel.app/) | Vercel (Free) |
| **API** | [egx-api.onrender.com](https://egx-api.onrender.com) | Render (Free) |
| **Database** | Managed PostgreSQL | Neon (Free) |
| **Mobile App** | Available on Expo Go | Expo (Free) |

> **Note:** The Render free tier spins down after inactivity. The first request may take ~30 seconds to cold-start.

## Architecture

```
electric-grid-energy-x/
├── apps/
│   ├── api/          Express + TypeScript + Prisma (38 endpoints, 9 models)
│   ├── web/          Next.js 14 App Router + Tailwind
│   └── mobile/       Expo + React Native (Expo Router)
├── packages/
│   ├── shared/       Types, validators, error codes, utils
│   ├── ui/           Tailwind component library
│   └── tsconfig/     Shared TypeScript configs
└── scripts/
    └── benchmark.ts  Reproducible performance proof
```

### Deployment Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │────▶│    Render     │────▶│     Neon      │
│  (Next.js)   │     │  (Express)   │     │ (PostgreSQL)  │
│   Web App    │     │     API      │     │   Database    │
└─────────────┘     └──────────────┘     └──────────────┘
                           ▲
┌─────────────┐            │
│   Expo Go    │────────────┘
│ (React Native)
│  Mobile App  │
└─────────────┘
```

## Key Engineering Decisions

| Concern | Implementation |
|---------|---------------|
| **Auth** | JWT with `AuthProvider` factory — Firebase in prod, LocalJwt in dev (`MOCK_AUTH=true`) |
| **RBAC** | Three-layer middleware: `authenticate → authorize(roles) → requireAccount(ownership)` |
| **Idempotency** | `idempotencyKey @unique` on MeterReading, Payment, Notification — replay returns same result (200), not rejection (409) |
| **Optimistic Locking** | `BillingCycle.version` — `UPDATE WHERE id=x AND version=n` prevents concurrent status races |
| **Soft Deletes** | `User.deletedAt` — GDPR right-to-erasure pattern, never hard-delete |
| **Audit Trail** | `AuditLog` append-only with `traceId`, `metadata Json` — every state change logged |
| **Pagination** | Cursor-based (`WHERE id > cursor ORDER BY id LIMIT 20`) — stable for concurrent writes |
| **Performance** | Strategic PostgreSQL indexing with reproducible benchmark proof (`pnpm benchmark`) |
| **Error Handling** | Single `errorHandler` middleware → `ApiResponse` envelope (`{ success, data } | { success, error }`) |

## Quick Start

```bash
# Prerequisites: Node 18+, PostgreSQL, pnpm

# 1. Install dependencies
pnpm install

# 2. Set up environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
# Edit DATABASE_URL if needed — defaults work with local PostgreSQL

# 3. Database setup
pnpm --filter api exec prisma migrate dev --name init
pnpm --filter api exec prisma db seed

# 4. Start API
pnpm --filter api dev
# ⚡ Electric Grid Energy X API running on port 3001

# 5. Verify
curl http://localhost:3001/api/health
# → { "success": true, "data": { "status": "ok", "uptime": ... } }
```

## Local Development

Run these commands from the project root. Each app needs its own terminal.

### API (Express + Prisma)

```bash
pnpm --filter api dev
# Runs on http://localhost:3001
```

### Web App (Next.js)

```bash
pnpm --filter web dev
# Runs on http://localhost:3000
```

### Mobile App (Expo)

```bash
cd apps/mobile
pnpm exec expo start --tunnel --go --clear
# Scan the QR code with Expo Go on your phone
```

> **`--tunnel`** routes through ngrok so your phone can reach the dev server even on different networks.
> **`--go`** opens in Expo Go automatically. **`--clear`** resets the Metro bundler cache.

> **Important:** The mobile `.env` defaults to the **production** API URL (`https://egx-api.onrender.com`).
> To test against your local API, change it to your machine's local IP:
> ```
> # Update apps/mobile/.env
> EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:3001
> ```
> Then restart Expo with `--clear` to pick up the change. **Remember to switch it back** to the production URL before pushing or running `eas update`.

### Environment Variables

| App | File | Key Variable |
|-----|------|-------------|
| API | `apps/api/.env` | `DATABASE_URL`, `JWT_SECRET`, `MOCK_AUTH` |
| Web | `apps/web/.env` | `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001`) |
| Mobile | `apps/mobile/.env` | `EXPO_PUBLIC_API_URL` (default: `https://egx-api.onrender.com`) |

## CI/CD Pipeline

All deployments are automated via **git push** — no manual deploy commands needed.

```bash
git add .
git commit -m "your changes"
git push origin main
```

| Platform | Trigger | How |
|----------|---------|-----|
| **Web App** | Push to `main` | Vercel auto-builds from Git |
| **API** | Push to `main` | Render auto-builds from Dockerfile |
| **Mobile App** | Push to `main` (changes in `apps/mobile/` or `packages/shared/`) | GitHub Actions → `eas update` OTA push |
| **Database** | Push to `main` (schema changes) | Prisma migrations run on Render during build |
| **Simulation** | 1st of each month (cron) | GitHub Actions → `POST /api/simulate` generates new monthly data |

### Database Schema Changes

If you modified the Prisma schema, generate a migration before pushing:

```bash
pnpm --filter api exec prisma migrate dev --name describe_your_change
# Then commit and push — the migration runs automatically on Render
```

### Seeding the Database

Seed the local database:

```bash
cd apps/api
npx tsx prisma/seed.ts
```

Seed the production database (Neon) directly:

```bash
cd apps/api
DATABASE_URL="your-neon-database-url" npx tsx prisma/seed.ts
```

> Find your Neon URL in **Render Dashboard → API service → Environment → DATABASE_URL**.

### Mobile Native Builds

OTA updates handle JS/UI changes automatically. If you change native dependencies or `app.json`, you need a full rebuild:

```bash
cd apps/mobile
eas build --platform android --profile preview   # Android APK
eas build --platform ios --profile preview        # iOS (requires Apple Developer account)
```

## API Endpoints (38 total)

| Group | Count | Key Endpoints |
|-------|-------|--------------|
| Auth | 5 | register, login, dev-login, me, logout |
| Accounts | 5 | CRUD, status change, soft-delete |
| Meters | 4 | list, create, get, update |
| Readings | 4 | submit (idempotent), history, summary, analytics |
| Billing | 7 | cycles, pay (idempotent + optimistic lock), generate, batch generate |
| Notifications | 5 | list, mark-read, read-all, subscribe, unsubscribe |
| Outages | 6 | list, active, get, create, update, resolve |
| Health | 3 | health, readiness, metrics (P50/P95/P99) |

## Testing

```bash
# Run all tests (~166 tests)
pnpm --filter api test

# Test categories:
# - Unit tests: calculateEnergyCost (tiered pricing)
# - Integration: all 38 endpoints with real DB
# - RBAC matrix: 71 tests — every role × endpoint × ownership
# - Business rules: billing idempotency, optimistic locking, status guards
```

## Performance Benchmark

```bash
pnpm benchmark
# Seeds 10,000 readings, runs queries 100× with and without indexes
# Prints before/after comparison table showing index impact
```

## Database Schema

9 models with production concerns:
- **User** — soft-delete, auth identity
- **Account** — 1:1 with User, FCM token for push
- **Meter** — serial number, status tracking
- **MeterReading** — idempotency key, composite unique constraint
- **BillingCycle** — optimistic locking via version field
- **Payment** — retry tracking (attempts, lastError, nextRetryAt)
- **Notification** — idempotency, read tracking
- **Outage** — severity, resolution tracking
- **AuditLog** — append-only, traceId correlation

## Dev Users

| Email | Role |
|-------|------|
| admin@egx.dev | ADMIN |
| tech@egx.dev | TECHNICIAN |
| maria.santos@egx.dev | TECHNICIAN |
| customer@egx.dev | CUSTOMER |
| customer2@egx.dev | CUSTOMER |
| lisa.chen@email.com | CUSTOMER |
| marcus.johnson@email.com | CUSTOMER |
| sarah.williams@email.com | CUSTOMER (Suspended) |
| david.kim@email.com | CUSTOMER |
| rachel.torres@email.com | CUSTOMER |

## Tech Stack

- **Runtime:** Node.js 18+ / TypeScript 5
- **API:** Express 4, Prisma ORM, PostgreSQL
- **Web:** Next.js 14 (App Router), Tailwind CSS
- **Mobile:** Expo / React Native, Expo Router
- **Testing:** Jest, Supertest (real DB, no mocks)
- **Monorepo:** Turborepo + pnpm workspaces
- **Hosting:** Vercel (Web), Render (API), Neon (DB), Expo (Mobile)
