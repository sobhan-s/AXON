FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

COPY packages ./packages
COPY apps ./apps

RUN pnpm install --frozen-lockfile

RUN pnpm --filter web build

FROM nginx:alpine

COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]