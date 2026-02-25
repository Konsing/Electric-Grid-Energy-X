# @egx/api

Express + TypeScript REST API for Electric Grid Energy X.

## Setup

```bash
# From repo root
pnpm install

# Copy env file
cp .env.example .env
# Edit DATABASE_URL to point to your PostgreSQL instance

# Run migrations
pnpm --filter api exec prisma migrate dev --name init

# Seed dev data
pnpm --filter api exec prisma db seed

# Start dev server
pnpm --filter api dev
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| JWT_SECRET | Yes | - | Min 32 chars for token signing |
| PORT | No | 3001 | Server port |
| NODE_ENV | No | development | development / test / production |
| MOCK_AUTH | No | false | Use LocalJwt instead of Firebase |

## Testing

```bash
# Requires TEST_DATABASE_URL or uses DATABASE_URL
pnpm --filter api test
```

## Benchmark

```bash
# From repo root
pnpm benchmark
```
