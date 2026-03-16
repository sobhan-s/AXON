FROM node:20-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY .env .env

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# ENV DATABASE_URL="postgresql://sobhan:dampostgres123@postgres:5432/dampostgres?schema=public"

RUN pnpm --filter @dam/postgresql_db exec prisma generate

RUN pnpm --filter @dam/worker build

FROM node:20-slim AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/apps/worker ./apps/worker
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

EXPOSE 8006
CMD ["pnpm", "--filter", "@dam/worker", "start"]