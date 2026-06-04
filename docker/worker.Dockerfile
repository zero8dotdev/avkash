# syntax=docker/dockerfile:1

# The maintenance worker is strictly Bun, but the monorepo installs with pnpm
# (which needs Node). So: install the workspace in a Node stage, then run the
# BullMQ worker with Bun. Bun executes TypeScript directly — no build step.

# ---- deps: install the whole pnpm workspace (Node) ----
FROM node:22-slim AS deps
ENV HUSKY=0
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile

# ---- runtime: Bun ----
FROM oven/bun:1 AS runtime
WORKDIR /repo
COPY --from=deps /repo /repo
WORKDIR /repo/apps/worker
CMD ["bun", "run", "src/index.ts"]
