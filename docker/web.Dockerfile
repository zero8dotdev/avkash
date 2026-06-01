# syntax=docker/dockerfile:1

# Web is the Next.js app (currently at the repo root). Next.js runs best on Node,
# so this image stays on Node end-to-end. This runs the dev server for a working
# environment; for a production image, swap CMD for `next build` + `next start`.

FROM node:22-slim AS web
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
EXPOSE 3000
# Container-friendly dev command (the root `pnpm dev` uses experimental HTTPS +
# turbopack, which needs local certs). Bind to 0.0.0.0 so the port is reachable.
CMD ["pnpm", "exec", "next", "dev", "-p", "3000", "-H", "0.0.0.0"]
