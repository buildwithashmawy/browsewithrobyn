# syntax=docker/dockerfile:1
FROM node:20-slim

WORKDIR /app

# pnpm via corepack; version is pinned by the root package.json "packageManager".
RUN corepack enable

# 1) Install deps first so this layer is cached until a manifest changes.
#    Dev deps (typescript, tailwind, etc.) are required for `next build`, so we
#    do NOT prune them here.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/agent/package.json apps/agent/package.json
RUN pnpm install --frozen-lockfile --filter web...

# 2) Convex generated client + schema — `next build` imports convex/_generated/api.
COPY convex ./convex
COPY apps/web ./apps/web

# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time, so the
# Convex URL must be present now. Railway feeds the matching service variable
# into this ARG automatically.
ARG NEXT_PUBLIC_CONVEX_URL
ENV NEXT_PUBLIC_CONVEX_URL=$NEXT_PUBLIC_CONVEX_URL
RUN pnpm --filter web build

ENV NODE_ENV=production
# Railway injects PORT; `next start` honors it.
EXPOSE 3000

CMD ["pnpm", "--filter", "web", "start"]
