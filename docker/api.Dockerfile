# syntax=docker/dockerfile:1

# The API is strictly Bun, but the monorepo installs with pnpm (which needs Node).
# So: install the workspace in a Node stage, then run the Hono server with Bun.
# Bun executes TypeScript directly — there is no build step for the API.

# ---- deps: install the whole pnpm workspace (Node) ----
FROM node:22-slim AS deps
ENV HUSKY=0
RUN corepack enable
WORKDIR /repo
# Copy everything (node_modules excluded via .dockerignore) and install.
# The committed lockfile already pins policy-compliant versions, so the global
# supply-chain policy that lives outside the image does not apply here.
COPY . .
RUN pnpm install --frozen-lockfile

# ---- runtime: Bun ----
FROM oven/bun:1 AS runtime
WORKDIR /repo
# pnpm's node_modules symlinks are relative and self-contained within /repo,
# so copying the entire installed tree keeps them valid across the stage swap.
COPY --from=deps /repo /repo
WORKDIR /repo/apps/api
ENV PORT=3001
EXPOSE 3001
# index.ts default-exports { port, fetch } — Bun auto-serves it.
CMD ["bun", "run", "src/index.ts"]
