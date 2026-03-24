# FROM node:20-slim AS builder
# WORKDIR /app

# RUN corepack enable && corepack prepare pnpm@latest --activate

# COPY .env .env

# COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# COPY apps ./apps
# COPY packages ./packages

# RUN pnpm install --frozen-lockfile

# ENV DATABASE_URL="postgresql://sobhan:dampostgres123@postgres:5432/dampostgres?schema=public"

# RUN pnpm --filter @dam/postgresql_db exec prisma generate

# RUN pnpm --filter @dam/taskService build

# FROM node:20-slim AS runtime
# WORKDIR /app

# RUN corepack enable && corepack prepare pnpm@latest --activate

# COPY --from=builder /app/apps/taskService ./apps/taskService
# COPY --from=builder /app/packages ./packages
# COPY --from=builder /app/node_modules ./node_modules
# COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# EXPOSE 8003
# CMD ["pnpm", "--filter", "@dam/taskService", "start"]


FROM node:20-slim AS pruner
WORKDIR /app

RUN npm install -g turbo
COPY . .

RUN turbo prune @dam/taskService --docker

# Installation stage
FROM node:20-slim AS installer
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile --prefer-offline

# Build stage
FROM node:20-slim AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app .

COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

COPY .env .env

RUN pnpm --filter @dam/postgresql_db exec prisma generate
RUN pnpm --filter @dam/taskService build

# Runtime 
FROM node:20-slim AS runtime
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/taskService/dist ./apps/taskService/dist
COPY --from=builder /app/apps/taskService/package.json ./apps/taskService/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

EXPOSE 8003
CMD ["pnpm", "--filter", "@dam/taskService", "start"]