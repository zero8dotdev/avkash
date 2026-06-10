# syntax=docker/dockerfile:1

# Web is the SvelteKit app (apps/web) using @sveltejs/adapter-node.
# The adapter-node output runs on Node.js — build with pnpm (Node), run with Node.

# ── deps: install the whole pnpm workspace (Node) ─────────────────────────────
FROM node:22-slim AS deps
ENV HUSKY=0
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile

# ── build: produce the adapter-node bundle ─────────────────────────────────────
FROM deps AS builder
WORKDIR /repo
RUN pnpm --filter @avkash/web run build

# ── runtime: lean Node image ───────────────────────────────────────────────────
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# The adapter-node output is self-contained in build/ with a package.json that
# lists its own dependencies. Copy it out and install only production deps.
COPY --from=builder /repo/apps/web/build ./build
COPY --from=builder /repo/apps/web/package.json ./package.json
# adapter-node's build/ is self-contained — node_modules from the workspace
# install are not needed for runtime. The output bundle inlines all imports.
EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0
CMD ["node", "build/index.js"]
