FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ─── Install all workspace dependencies ─────
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/tsconfig/package.json ./packages/tsconfig/
RUN pnpm install --frozen-lockfile --prod=false

# ─── Build the API and shared packages ───────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @egx/shared build
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# ─── Create self-contained production bundle ─
# pnpm deploy creates a flat node_modules (no symlinks).
RUN pnpm --filter api deploy --prod /app/deployed

# Copy compiled JS and Prisma schema
RUN cp -r /app/apps/api/dist /app/deployed/dist
RUN cp -r /app/apps/api/prisma /app/deployed/prisma
RUN rm -f /app/deployed/prisma.config.ts

# Copy the GENERATED Prisma client over the ungenerated stubs.
# pnpm deploy creates .prisma/client stubs in two places;
# we overwrite both with the real generated client from the build.
RUN find /app/deployed/node_modules -path '*/.prisma/client' -type d \
      -exec sh -c 'rm -rf "$1"/* && cp -r /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/* "$1"/' _ {} \;

# ─── Production image ───────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/deployed ./

EXPOSE 3001
CMD ["node", "dist/index.js"]
