FROM node:20-alpine3.16 AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @dam/postgresql_db npx prisma generate

RUN pnpm --filter @dam/authService build

FROM node:20-alpine3.16 AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --from=builder /app/apps/authService ./apps/authService
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

RUN pnpm install --prod --frozen-lockfile

EXPOSE 8001
CMD ["pnpm", "--filter", "@dam/authService", "start"]