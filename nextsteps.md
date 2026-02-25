# Electric Grid Energy X — Project Overview & Next Steps

---

## PART 1: WHAT HAS BEEN DONE

Everything below has been implemented and committed on `main` (commit `e7e5261`). The entire project compiles with zero TypeScript errors.

---

### 1.1 Monorepo Infrastructure

| What | Details |
|------|---------|
| **Package manager** | pnpm 9.15.0 with workspaces |
| **Build orchestrator** | Turborepo 2.3.0 — `turbo.json` defines build/dev/test/lint/db pipelines |
| **Workspace layout** | `apps/*` (api, web, mobile), `packages/*` (shared, ui, tsconfig), `scripts/` |
| **TypeScript configs** | 3 shared presets in `packages/tsconfig/`: `base.json` (Node CommonJS), `nextjs.json` (ESM bundler), `react-native.json` (ESM JSX) |

**Root scripts available:**
```
pnpm build          → Build all packages via Turborepo
pnpm dev            → Start all dev servers in parallel
pnpm test           → Run all test suites
pnpm lint           → Type-check everything
pnpm benchmark      → Run performance benchmark script
pnpm db:migrate     → Run Prisma migrations
pnpm db:seed        → Seed development database
```

---

### 1.2 Shared Packages

#### `packages/shared` — Types, Validators, Utilities
Consumed by API, web, and mobile. Contains:

- **`types/models.ts`** — TypeScript interfaces for all 9 Prisma models (User, Account, Meter, MeterReading, BillingCycle, Payment, Notification, Outage, AuditLog)
- **`types/api.ts`** — `ApiSuccessResponse<T>`, `ApiErrorResponse`, `PaginatedResponse<T>`, `PaginationQuery`
- **`types/roles.ts`** — `Role` type (ADMIN, TECHNICIAN, CUSTOMER) with hierarchy constants
- **`validators/*.ts`** — Zod schemas for every request body: auth (register, login, dev-login), accounts, meters, readings (includes `idempotencyKey: z.string().uuid()`), billing (pay, generate, update status), notifications, outages
- **`errors/codes.ts`** — `ErrorCode` constants: `NOT_FOUND`, `FORBIDDEN`, `ALREADY_PAID`, `OPTIMISTIC_LOCK_FAILED`, `IDEMPOTENCY_VIOLATION`, etc.
- **`utils/calculateEnergyCost.ts`** — Pure tiered pricing function (3 tiers + base charge of $12.50)
- **`utils/formatters.ts`** — `formatCurrency()`, `formatKwh()`, `formatDate()`
- **`constants/tiers.ts`** — `ENERGY_TIERS` pricing config (Tier 1: $0.08/kWh up to 500, Tier 2: $0.12/kWh up to 1000, Tier 3: $0.15/kWh above 1000)
- **`constants/limits.ts`** — `PAGE_SIZE=20`, `MAX_RETRY_ATTEMPTS=3`, `AUTH_CACHE_TTL=30000`

#### `packages/ui` — Tailwind Component Library
4 React components: `Button`, `Card`, `Badge`, `StatCard` — used by the web portal.

---

### 1.3 API (apps/api) — The Primary Showcase

#### Database: PostgreSQL via Prisma ORM
- **9 models**, **11 enums**, **23 strategic indexes**
- Full schema at `apps/api/prisma/schema.prisma`

| Model | Key Production Pattern |
|-------|----------------------|
| **User** | Soft delete via `deletedAt` (GDPR). Indexes on `email`, `firebaseUid`, `deletedAt` |
| **Account** | 1:1 with User. Stores PII (firstName, lastName, phone, serviceAddress). FCM token for push |
| **Meter** | Many-per-account. Composite index `(accountId, status)` |
| **MeterReading** | `idempotencyKey @unique` — replay returns 200, not 409. Composite unique `(meterId, readingDate, source)` |
| **BillingCycle** | `version Int @default(1)` — optimistic locking prevents concurrent status race |
| **Payment** | `billingCycleId @unique` (1:1, DB-enforced double-payment prevention). `idempotencyKey @unique`. Retry tracking: `attempts`, `lastError`, `nextRetryAt` |
| **Notification** | `idempotencyKey @unique`. Read tracking via `readAt` |
| **Outage** | Status lifecycle: REPORTED → CONFIRMED → IN_PROGRESS → RESOLVED. Severity levels |
| **AuditLog** | Append-only. `traceId` for distributed tracing. `metadata Json` for flexible context |

#### Seed Data (`prisma/seed.ts`)
Creates 4 dev users, their accounts, 2 meters, 18 months of readings, 3 billing cycles, 2 notifications, and 2 outages:

| Email | Role | Password |
|-------|------|----------|
| admin@egx.dev | ADMIN | password123 |
| tech@egx.dev | TECHNICIAN | password123 |
| customer@egx.dev | CUSTOMER | password123 |
| customer2@egx.dev | CUSTOMER | password123 |

#### Library Layer (`src/lib/`)
- **`config.ts`** — Zod-validated environment variables. Server crashes on boot if config is invalid.
- **`errors.ts`** — `AppError` hierarchy: `NotFoundError(404)`, `ForbiddenError(403)`, `UnauthorizedError(401)`, `ValidationError(400)`, `ConflictError(409)`
- **`auth-provider.ts`** — Factory pattern: returns `LocalJwtAuthProvider` (when `MOCK_AUTH=true`) or `FirebaseAuthProvider` (production). Interface: `verifyToken(token) → { firebaseUid, email }`
- **`prisma.ts`** — Singleton Prisma client with global caching in dev
- **`pagination.ts`** — `buildCursorQuery()`, `processPaginatedResults()` (limit+1 pattern), `parsePaginationQuery()`

#### Middleware Chain (`src/middleware/`)
Every protected route passes through: `authenticate → authorize(roles) → requireAccount(ownership)`

- **`authenticate.ts`** — JWT verification via authProvider, DB user lookup with 30-second in-memory cache (`Map<firebaseUid, CachedAuth>`)
- **`authorize.ts`** — Role guard factory: `authorize('ADMIN', 'TECHNICIAN')` checks `req.user.role`
- **`requireAccount.ts`** — Ownership guard: verifies the authenticated user owns the resource. Admins skip. `requireResourceOwnership('meter'|'billingCycle'|'notification')` does a DB lookup
- **`validate.ts`** — Zod middleware: validates `req.body/params/query`, replaces with parsed values
- **`metrics.ts`** — CircularBuffer (500 measurements per route), P50/P95/P99 computation within 5-minute window
- **`errorHandler.ts`** — Single catch-all: maps `AppError` to status codes, handles Prisma errors (P2002→409, P2025→404), wraps everything in `ApiResponse` envelope

#### API Modules — 38 Endpoints Across 7 Domains

Each module follows `routes.ts → service.ts → Prisma`. Services write to AuditLog on state changes.

**Auth (5 endpoints):**
```
POST   /api/auth/register      — Create user + account, return JWT
POST   /api/auth/login         — Email/password → JWT
POST   /api/auth/dev-login     — Dev-only: email-only login (route not registered in prod)
GET    /api/auth/me            — Get authenticated user profile + account
POST   /api/auth/logout        — Audit log the logout event
```

**Accounts (5 endpoints):**
```
GET    /api/accounts           — [ADMIN] List all accounts (cursor-paginated)
GET    /api/accounts/:id       — [ADMIN or owner] Get account with meters
PATCH  /api/accounts/:id       — [ADMIN or owner] Update profile (name, phone, address)
PUT    /api/accounts/:id/status — [ADMIN] Change status (ACTIVE/SUSPENDED/INACTIVE)
DELETE /api/accounts/:id       — [ADMIN or owner] Soft-delete (sets deletedAt)
```

**Meters (4 endpoints):**
```
GET    /api/accounts/:id/meters — [ADMIN/TECH or owner] List account's meters
POST   /api/accounts/:id/meters — [ADMIN/TECH] Create meter for account
GET    /api/meters/:id          — [ADMIN/TECH or owner] Get meter details
PATCH  /api/meters/:id          — [ADMIN/TECH] Update meter (model, location, status)
```

**Readings (4 endpoints):**
```
POST   /api/meters/:id/readings        — [owner/TECH] Submit reading (idempotent via key)
GET    /api/meters/:id/readings         — [owner/TECH/ADMIN] Reading history (cursor-paginated)
GET    /api/accounts/:id/usage/summary  — [ADMIN or owner] Month-to-date kWh + cost
GET    /api/accounts/:id/usage/analytics — [ADMIN or owner] Usage trends (last 12 months)
```

**Billing (7 endpoints):**
```
GET    /api/billing/cycles             — [all] List billing cycles (paginated)
GET    /api/accounts/:id/billing       — [ADMIN or owner] Account's billing cycles
POST   /api/billing/:id/pay            — [owner] Pay bill (idempotent + optimistic lock)
POST   /api/billing/generate           — [ADMIN] Generate single billing cycle
POST   /api/billing/generate-batch     — [ADMIN] Generate for multiple accounts
PUT    /api/billing/:id/status         — [ADMIN] Change billing status
GET    /api/billing/:id                — [ADMIN or owner] Get single billing cycle
```

**Notifications (5 endpoints):**
```
GET    /api/notifications                          — [all] List own notifications
PATCH  /api/notifications/:id/read                 — [owner] Mark single as read
POST   /api/accounts/:id/notifications/read-all    — [owner] Mark all as read
POST   /api/accounts/:id/notifications/subscribe   — [owner] Register FCM token
POST   /api/accounts/:id/notifications/unsubscribe — [owner] Remove FCM token
```

**Outages (6 endpoints):**
```
GET    /api/outages         — [all authenticated] List outages (paginated, filterable)
GET    /api/outages/active  — [all authenticated] List active outages only
GET    /api/outages/:id     — [all authenticated] Get single outage
POST   /api/outages         — [ADMIN/TECH] Create outage report
PATCH  /api/outages/:id     — [ADMIN/TECH] Update outage details
PUT    /api/outages/:id/resolve — [ADMIN/TECH] Mark as resolved
```

**Health & Metrics (3 endpoints — no auth):**
```
GET    /api/health        — Status, uptime, version
GET    /api/health/ready  — Database connectivity probe
GET    /api/metrics       — Per-route P50/P95/P99 latencies (last 5 minutes)
```

#### Entry Point (`src/index.ts`)
Composes Express app: CORS, compression, JSON parsing, metrics middleware, all routers mounted at correct paths, dev router conditionally registered, error handler last.

---

### 1.4 Testing — 166 Tests Across 10 Files

| File | Tests | What It Covers |
|------|-------|---------------|
| `tests/unit/calculateEnergyCost.test.ts` | 8 | Tiered pricing: boundaries, zero, fractional, all tiers |
| `tests/rbac/permissions.test.ts` | 71 | Systematic role x endpoint x ownership matrix (ADMIN/TECH/CUSTOMER x [self]/[other]) |
| `tests/integration/auth.test.ts` | 14 | Register, login, dev-login, me, logout, duplicate email, bad credentials |
| `tests/integration/accounts.test.ts` | 12 | CRUD, status changes, soft-delete, pagination |
| `tests/integration/meters.test.ts` | 10 | List, create, get, update, validation errors |
| `tests/integration/readings.test.ts` | 11 | Submit, history, summary, analytics, **idempotency (200 on replay, not 201/409)** |
| `tests/integration/billing.test.ts` | 16 | Pay, generate, batch, **optimistic lock**, **double-pay prevention**, status guards |
| `tests/integration/notifications.test.ts` | 9 | List, mark-read, mark-all-read, subscribe, unsubscribe |
| `tests/integration/outages.test.ts` | 10 | CRUD, resolve, already-resolved 409, filter by status |
| `tests/integration/health.test.ts` | 5 | Health, readiness, metrics endpoint |

**Test infrastructure:**
- `tests/helpers/setup.ts` — Connects to test DB, provides `getApp()` and `getPrisma()`, cleans between runs with `TRUNCATE CASCADE`
- `tests/helpers/seed.ts` — `seedTestData()` creates admin/tech/customer/customer2 fixtures, returns IDs
- `tests/helpers/auth.ts` — `getTokenForRole()`, `getCustomer2Token()`, `getTokenForUser()`
- Tests use **real PostgreSQL** via Supertest — no mocking

---

### 1.5 Performance Benchmark (`scripts/benchmark.ts`)

- Seeds 10,000 meter readings across 5 meters
- Runs 3 heavy queries 100x each: usage history range scan, billing by status, unread notifications
- Drops strategic indexes, runs same queries again
- Prints comparison table: median (no index) vs median (indexed) vs P95 (indexed) vs speedup factor
- Run with `pnpm benchmark`

---

### 1.6 Web Portal (apps/web) — Next.js 14 App Router

| Page | Route | What It Does |
|------|-------|-------------|
| Login | `/login` | Email/password form + dev quick-login buttons |
| Register | `/register` | Full registration form |
| Dashboard | `/dashboard` | Stats cards, usage chart (Recharts), recent bills, active outages |
| Billing | `/billing` | Bill list with status badges, pay button |
| Notifications | `/notifications` | Notification list, mark-read, mark-all-read |
| Outages | `/outages` | Active and past outage list |
| Account | `/account` | Profile info, meter list |
| Admin Accounts | `/admin/accounts` | Account management table |
| Admin Outages | `/admin/outages` | Create/manage outages form |

**Key files:**
- `src/lib/api.ts` — API client with `apiFetch()` helper, all endpoint functions
- `src/lib/auth-context.tsx` — React context, localStorage token persistence
- `src/components/Navigation.tsx` — Responsive nav with role-based admin links
- `src/app/(authenticated)/layout.tsx` — Auth guard: redirects to `/login` if no token

**Stack:** Next.js 14.2, React 18.3, Tailwind CSS 3.4, Recharts 2.12

---

### 1.7 Mobile App (apps/mobile) — Expo + React Native

| Screen | Route | What It Does |
|--------|-------|-------------|
| Splash | `/` | Checks auth, redirects to login or tabs |
| Login | `/login` | Email/password + dev shortcuts |
| Dashboard | `/(tabs)/dashboard` | Stats cards, active outages |
| Billing | `/(tabs)/billing` | Bill cards with status badges |
| Notifications | `/(tabs)/notifications` | Notification list, mark-all-read |
| Outages | `/(tabs)/outages` | Active outages list |
| Profile | `/(tabs)/profile` | Account info, meters, logout |

**Key files:**
- `src/lib/api.ts` — API client using `EXPO_PUBLIC_API_URL`
- `src/lib/auth-context.tsx` — Auth context with `expo-secure-store` persistence
- `app/(tabs)/_layout.tsx` — 5-tab navigator (Dashboard, Billing, Alerts, Outages, Profile)

**Stack:** Expo 52.0, React Native 0.76, Expo Router 4.0, expo-secure-store 14.0

---

### 1.8 Deployment Configs

- **`apps/api/Dockerfile`** — Multi-stage Docker build (deps → builder → runner). Final image is `node:18-alpine` with only compiled `dist/`, Prisma, and `node_modules`
- **`apps/web/vercel.json`** — Vercel config: framework nextjs, uses pnpm, builds with `pnpm --filter web build`
- **`apps/mobile/eas.json`** — EAS Build profiles: development (dev client), preview (internal), production

---

## PART 2: NEXT STEPS TO GET EVERYTHING WORKING

---

### Step 1: Install Prerequisites

You need the following software installed on your machine:

| Software | Version | How to Install | Why |
|----------|---------|----------------|-----|
| **Node.js** | 18+ (recommend 20 LTS) | https://nodejs.org or `nvm install 20` | Runtime for everything |
| **pnpm** | 9.15.0 | `npm install -g pnpm@9.15.0` | Package manager (already installed in this session) |
| **PostgreSQL** | 14+ (recommend 16) | See Step 2 below | Database for API and tests |
| **Git** | Any recent | Already installed | Version control |

**Optional (for mobile development):**

| Software | Version | How to Install | Why |
|----------|---------|----------------|-----|
| **Expo CLI** | Latest | `npm install -g expo-cli` | Mobile development server |
| **EAS CLI** | 12+ | `npm install -g eas-cli` | Build and submit mobile apps |
| **Android Studio** | Latest | https://developer.android.com/studio | Android emulator |
| **Xcode** | 15+ (macOS only) | Mac App Store | iOS simulator |
| **Expo Go** | Latest | App Store / Play Store on your phone | Run dev builds on real device |

**Optional (for deployment):**

| Software | How to Get | Why |
|----------|-----------|-----|
| **Vercel CLI** | `npm install -g vercel` | Deploy web portal |
| **Docker** | https://docs.docker.com/get-docker/ | Containerize API |
| **Railway CLI** | `npm install -g @railway/cli` | One option for API hosting |

---

### Step 2: Set Up PostgreSQL

You need **two** PostgreSQL databases: one for development, one for tests.

#### Option A: Install PostgreSQL Locally (Recommended for Development)

**On Ubuntu/WSL:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Create the databases:**
```bash
sudo -u postgres psql

# Inside psql:
CREATE DATABASE egx_dev;
CREATE DATABASE egx_test;
# If you want a custom password (otherwise 'postgres' default works):
ALTER USER postgres PASSWORD 'postgres';
\q
```

**Verify connection:**
```bash
psql postgresql://postgres:postgres@localhost:5432/egx_dev
# Should connect. Type \q to exit.
```

#### Option B: Use Docker for PostgreSQL

```bash
docker run --name egx-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=egx_dev \
  -p 5432:5432 \
  -d postgres:16-alpine

# Create the test database:
docker exec -it egx-postgres psql -U postgres -c "CREATE DATABASE egx_test;"
```

#### Option C: Use a Cloud-Hosted Database

Providers that offer free PostgreSQL tiers:
- **Supabase** (https://supabase.com) — 500MB free, generous limits
- **Neon** (https://neon.tech) — 512MB free, serverless
- **Railway** (https://railway.app) — $5/mo credit free

If using a cloud DB, you'll get a connection string like:
```
postgresql://user:password@host:5432/database
```

---

### Step 3: Configure Environment Variables

#### API Environment (`apps/api/.env`)

```bash
cd /home/konsing/Electric-Grid-Energy-X
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your actual values:
```bash
# Database — use your PostgreSQL connection strings from Step 2
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/egx_dev?schema=public"
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/egx_test?schema=public"

# Auth — any string 32+ characters. This is for signing JWTs locally.
JWT_SECRET="change-this-to-something-random-at-least-32-characters"

# Keep this true for local development (skips Firebase, uses local JWT)
MOCK_AUTH=true

# Server
PORT=3001
NODE_ENV=development
```

**Important:** With `MOCK_AUTH=true`, you do NOT need a Firebase account. The API will sign and verify JWTs locally. This is the intended development mode.

#### Web Environment (`apps/web/.env.local`)

```bash
cp apps/web/.env.example apps/web/.env.local
```

Contents (usually no changes needed):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### Mobile Environment (`apps/mobile/.env`)

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Contents:
```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
```

**Note for mobile on a real device:** Replace `localhost` with your computer's local IP (e.g., `http://192.168.1.100:3001`). Find your IP with `hostname -I` on Linux or `ipconfig` on Windows.

---

### Step 4: Install Dependencies

```bash
cd /home/konsing/Electric-Grid-Energy-X
pnpm install
```

This installs dependencies for all workspaces (api, web, mobile, shared, ui, scripts). Should take 10-30 seconds.

---

### Step 5: Set Up the Database

**Make sure PostgreSQL is running first** (from Step 2).

```bash
# Generate the Prisma client (TypeScript types from your schema)
pnpm --filter api exec -- prisma generate

# Run database migrations (creates all 9 tables, indexes, enums)
pnpm db:migrate
# When prompted for a migration name, type: init

# Seed the database with development data
pnpm db:seed
```

**What the seed creates:**
- 4 users (admin, technician, 2 customers) with password `password123`
- 4 accounts with service addresses
- 2 smart meters
- 18 months of meter readings
- 3 billing cycles (2 paid, 1 current)
- 2 notifications
- 2 outages (1 active, 1 resolved)

**Optional — Explore your data visually:**
```bash
pnpm --filter api exec -- prisma studio
# Opens a web UI at http://localhost:5555 where you can browse all tables
```

---

### Step 6: Run the API

```bash
# Start the API in development mode (hot-reloading)
pnpm --filter api dev
```

You should see:
```
Electric Grid Energy X API running on port 3001
Environment: development
Mock auth: true
```

**Verify it works (in a separate terminal):**

```bash
# Health check
curl http://localhost:3001/api/health
# → {"success":true,"data":{"status":"ok","uptime":...}}

# Readiness (checks DB connection)
curl http://localhost:3001/api/health/ready
# → {"success":true,"data":{"status":"ready","checks":{"database":"connected"}}}

# Dev login (no password needed)
curl -s -X POST http://localhost:3001/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@egx.dev"}' | head -c 200
# → {"success":true,"data":{"token":"eyJ...",...}}

# Save a token for testing
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@egx.dev"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Use the token to hit protected endpoints
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/accounts | head -c 300

# View metrics
curl -s http://localhost:3001/api/metrics
```

---

### Step 7: Run the Tests

**Requires:** PostgreSQL running + `TEST_DATABASE_URL` set in `apps/api/.env`.

```bash
# Run all 166 tests
pnpm --filter api test
```

Expected output: `166 tests passing` across 10 test suites.

**If tests fail with database errors:**
1. Make sure PostgreSQL is running
2. Make sure `egx_test` database exists: `psql -U postgres -c "CREATE DATABASE egx_test;"`
3. Make sure `TEST_DATABASE_URL` is correct in `apps/api/.env`

**Run specific test files:**
```bash
# Just the RBAC matrix
pnpm --filter api exec -- jest tests/rbac/permissions.test.ts --runInBand

# Just billing tests
pnpm --filter api exec -- jest tests/integration/billing.test.ts --runInBand

# Watch mode (re-runs on file changes)
pnpm --filter api test:watch
```

---

### Step 8: Run the Benchmark

**Requires:** PostgreSQL running + `DATABASE_URL` set.

```bash
pnpm benchmark
```

This will:
1. Seed 10,000 meter readings
2. Run 3 heavy queries 100x each WITH indexes
3. Drop strategic indexes
4. Run same queries WITHOUT indexes
5. Print a comparison table showing ~10x speedup from indexing

---

### Step 9: Run the Web Portal

```bash
# In a separate terminal (API must be running on port 3001)
pnpm --filter web dev
```

Opens at **http://localhost:3000**.

**How to use:**
1. Go to http://localhost:3000/login
2. Click one of the "Dev Login" buttons (e.g., "Login as Customer")
3. You'll be redirected to the dashboard
4. Explore: Dashboard, Billing (try paying a bill), Notifications, Outages, Account
5. Log out, then dev-login as Admin to see admin pages (Admin > Accounts, Admin > Outages)

---

### Step 10: Run the Mobile App

**Requires:** Expo CLI installed, and either a physical device with Expo Go or an Android/iOS emulator.

```bash
# In a separate terminal (API must be running)
cd apps/mobile
pnpm exec expo start

# If the above doesn't work, try this
pnpm exec expo start --tunnel --go --clear
```

**On a physical device:**
1. Install "Expo Go" from App Store / Play Store
2. Scan the QR code shown in terminal
3. Make sure your phone and computer are on the same WiFi network
4. Update `apps/mobile/.env` to use your computer's IP instead of `localhost`

**On an emulator:**
- Press `a` for Android emulator (requires Android Studio)
- Press `i` for iOS simulator (requires Xcode, macOS only)

---

## PART 3: ACCOUNTS & SERVICES NEEDED FOR FULL PRODUCTION DEPLOYMENT

This section covers what you'd need to go beyond local development.

---

### 3.1 Required for Production (If You Want to Deploy)

#### PostgreSQL Hosting (Pick One)
| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Supabase** | 500MB, 2 projects | Easiest. Gives you a connection string instantly |
| **Neon** | 512MB | Serverless, scales to zero |
| **Railway** | $5/mo credit | Also hosts the API |
| **Render** | Free for 90 days | Paired with their web service |
| **AWS RDS** | 12-month free tier | More complex setup |

You just need the `DATABASE_URL` connection string from whichever provider you choose.

#### API Hosting (Pick One)
| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Railway** | $5/mo credit | Best DX. Dockerfile auto-detected. `railway up` |
| **Render** | Free (spins down) | Dockerfile or Node.js auto-detected |
| **Fly.io** | 3 shared VMs free | Good for Docker. `fly launch` |
| **Google Cloud Run** | Generous free tier | Serverless containers |
| **AWS ECS/Fargate** | 12-month free tier | More complex |

The `Dockerfile` at `apps/api/Dockerfile` is ready to use with any of these.

#### Web Hosting
| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Vercel** | Unlimited for hobby | `vercel.json` already configured. Just connect your GitHub repo |

Steps for Vercel:
1. Create account at https://vercel.com (GitHub login)
2. Import your GitHub repo
3. Set root directory to `apps/web`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-api-url.com`
5. Deploy

---

### 3.2 Required Only If You Disable MOCK_AUTH (Production Auth)

If you want real Firebase authentication instead of local JWT:

#### Firebase Account (Free)
1. Go to https://console.firebase.google.com
2. Create a new project (e.g., "electric-grid-energy-x")
3. Enable **Authentication** → **Email/Password** sign-in method
4. Go to **Project Settings** → **Service accounts** → **Generate new private key**
5. From the downloaded JSON, extract:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
6. Set `MOCK_AUTH=false` in your API `.env`
7. Update web and mobile to use Firebase client SDK for login

**You do NOT need Firebase for local development.** `MOCK_AUTH=true` handles everything.

---

### 3.3 Required Only for Mobile App Store Deployment

#### Expo Account (Free)
1. Create account at https://expo.dev
2. Run `eas login` in terminal
3. Run `eas init` in `apps/mobile/`
4. Build: `eas build --platform android` or `eas build --platform ios`

#### Apple Developer Account ($99/year) — iOS Only
- Required to publish to App Store or TestFlight
- https://developer.apple.com/programs/

#### Google Play Developer Account ($25 one-time) — Android Only
- Required to publish to Google Play Store
- https://play.google.com/console

**For portfolio purposes:** You don't need App Store accounts. Expo Go or EAS internal builds are sufficient for demos.

---

### 3.4 Optional: CI/CD

#### GitHub Actions (Free for Public Repos)
The project doesn't include a CI config yet. If you want one:

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: egx_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:5432/egx_test
      TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/egx_test
      JWT_SECRET: test-secret-key-at-least-32-characters-long
      MOCK_AUTH: true
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install
      - run: pnpm --filter @egx/shared build
      - run: pnpm --filter api exec -- prisma migrate deploy
      - run: pnpm --filter api test
```

---

## PART 4: COMPLETE COMMAND REFERENCE

### Starting Everything (Development)

```bash
# Terminal 1: Start PostgreSQL (if using Docker)
docker start egx-postgres

# Terminal 2: Start the API
cd /home/konsing/Electric-Grid-Energy-X
pnpm --filter api dev
# → http://localhost:3001

# Terminal 3: Start the web portal
pnpm --filter web dev
# → http://localhost:3000

# Terminal 4 (optional): Start the mobile app
cd apps/mobile && pnpm exec expo start
```

Or start API + web together:
```bash
pnpm dev
# Turborepo starts all apps with dev scripts in parallel
```

### Database Commands

```bash
# Run migrations (after schema changes)
pnpm db:migrate

# Re-seed database
pnpm db:seed

# Reset database completely (drops all data, re-migrates, re-seeds)
pnpm --filter api exec -- prisma migrate reset --force

# Open visual database browser
pnpm --filter api exec -- prisma studio

# Generate Prisma client (after schema changes)
pnpm --filter api exec -- prisma generate
```

### Testing Commands

```bash
# Run all tests (166 tests)
pnpm --filter api test

# Run specific test file
pnpm --filter api exec -- jest tests/integration/billing.test.ts --runInBand

# Run tests matching a pattern
pnpm --filter api exec -- jest --testPathPattern="rbac" --runInBand

# Watch mode
pnpm --filter api test:watch
```

### Build Commands

```bash
# Build everything
pnpm build

# Build just the API
pnpm --filter api build

# Type-check without building
pnpm --filter api lint

# Build Docker image
docker build -t egx-api:latest -f apps/api/Dockerfile .
```

### Useful Curl Commands for Testing the API

```bash
# Get an admin token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@egx.dev"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Get a customer token
CUST_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@egx.dev"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# List accounts (admin only)
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3001/api/accounts | python3 -m json.tool

# Get customer's own account (need the account ID from /auth/me)
curl -s -H "Authorization: Bearer $CUST_TOKEN" \
  http://localhost:3001/api/auth/me | python3 -m json.tool

# List active outages
curl -s -H "Authorization: Bearer $CUST_TOKEN" \
  http://localhost:3001/api/outages/active | python3 -m json.tool

# Create an outage (admin/tech only)
curl -s -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Outage","description":"Testing","affectedArea":"Downtown","severity":"LOW"}' \
  http://localhost:3001/api/outages | python3 -m json.tool

# View metrics
curl -s http://localhost:3001/api/metrics | python3 -m json.tool
```

---

## PART 5: TROUBLESHOOTING

### "pnpm: command not found"
```bash
npm install -g pnpm@9.15.0
```

### "prisma: command not found" or UNC path error on WSL
Don't use `npx prisma`. Use:
```bash
pnpm --filter api exec -- prisma migrate dev
pnpm --filter api exec -- prisma generate
```

### Database connection refused
1. Check PostgreSQL is running: `sudo systemctl status postgresql` or `docker ps`
2. Check the DATABASE_URL in `apps/api/.env` matches your setup
3. Make sure the database exists: `psql -U postgres -c "\l"` (should list `egx_dev` and `egx_test`)

### Tests fail with "relation does not exist"
The test database hasn't been migrated. The test setup should auto-migrate, but if it doesn't:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/egx_test" \
  pnpm --filter api exec -- prisma migrate deploy
```

### "Port 3001 already in use"
```bash
# Find and kill the process
lsof -i :3001
kill -9 <PID>
```

### Web portal shows "Network Error" or blank dashboard
1. Make sure the API is running on port 3001
2. Check `apps/web/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001`
3. Check browser console for CORS errors (shouldn't happen — API has CORS enabled)

### Mobile app can't connect to API
1. Don't use `localhost` on a real device — use your computer's IP
2. Update `apps/mobile/.env`: `EXPO_PUBLIC_API_URL=http://192.168.x.x:3001`
3. Make sure your phone and computer are on the same network
4. Make sure no firewall is blocking port 3001

---

## PART 6: WHAT THIS PROJECT DEMONSTRATES (For Interviews)

Key talking points when presenting this project:

1. **Domain-Driven API Design** — 38 endpoints organized by business domain, not technical concern
2. **Three-Layer Authorization** — authenticate (identity) → authorize (role) → requireAccount (ownership)
3. **Idempotency** — Safe retries on meter readings and payments. Replay returns 200, not 409
4. **Optimistic Locking** — `version` field prevents concurrent billing status races
5. **Soft Deletes** — GDPR compliance pattern on User model
6. **Cursor Pagination** — Stable for concurrent writes (unlike offset pagination)
7. **Strategic Indexing** — Reproducible benchmark proving ~10x query speedup
8. **Per-Route Metrics** — P50/P95/P99 latency tracking with ring buffer
9. **Monorepo Architecture** — Shared types ensure API, web, and mobile can never drift
10. **166 Tests** — Includes systematic RBAC matrix (71 role x endpoint x ownership tests)
