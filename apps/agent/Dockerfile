# syntax=docker/dockerfile:1

# Pinned to the exact Playwright version in pnpm-lock.yaml. This image bundles
# Chromium plus every system dependency it needs, so there's no `playwright
# install` / apt wrangling. Bump this tag whenever the `playwright` dependency
# changes (it MUST match, or the bundled browser won't be found).
FROM mcr.microsoft.com/playwright:v1.60.0-noble

WORKDIR /app

# Browsers already live in the image at $PLAYWRIGHT_BROWSERS_PATH — never redownload.
# NODE_ENV is intentionally left unset during install: the agent runs via `tsx`,
# which is a devDependency, so dev deps must NOT be pruned.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    CI=1

# pnpm via corepack; version is pinned by the root package.json "packageManager".
RUN corepack enable

# 1) Install deps first so this layer is cached until a manifest changes.
#    A --frozen-lockfile install needs every workspace manifest present.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/agent/package.json apps/agent/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter agent...

# 2) Copy the source the agent actually runs.
COPY convex ./convex
COPY apps/agent ./apps/agent

# Railway injects PORT at runtime; the agent reads process.env.PORT (default 8787).
EXPOSE 8787

CMD ["pnpm", "--filter", "agent", "start"]
