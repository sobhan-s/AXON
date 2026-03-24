FROM node:20-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# RUN pnpm --filter @dam/postgresql_db exec prisma generate

RUN pnpm --filter @dam/gatewayApi build

FROM node:20-slim AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/apps/gatewayApi ./apps/gatewayApi
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

EXPOSE 8001
CMD ["pnpm", "--filter", "@dam/gatewayApi", "start"]