# 06 — Deployment Strategy

Three deployment modes: Hosted SaaS (default), Self-Hosted Docker, Self-Hosted Kubernetes.

---

## Mode 1: Hosted SaaS (Cloud)

The primary business model. We host, customer uses.

### Infrastructure Stack

| Service          | Provider          | Reason                                           |
| ---------------- | ----------------- | ------------------------------------------------ |
| Next.js frontend | Vercel            | Zero-config, CDN, edge functions                 |
| Bun API          | Fly.io or Railway | Bun-compatible, cheap, auto-scaling              |
| PostgreSQL       | Neon (serverless) | Pay per compute, auto-pause, Postgres-compatible |
| Redis            | Upstash           | Serverless Redis, pay per request                |
| File Storage     | Cloudflare R2     | Zero egress fees                                 |
| CDN              | Cloudflare        | Free tier, DDoS protection                       |
| Email            | Resend            | Reliable transactional email                     |
| SMS/WhatsApp     | MSG91             | Indian provider                                  |
| Monitoring       | Sentry            | Error tracking                                   |

### Environments

```
production    → main branch → auto-deploy
staging       → staging branch → auto-deploy
preview       → PR branches → Vercel preview URLs
```

### Scaling Plan

| Scale                 | Setup                                                |
| --------------------- | ---------------------------------------------------- |
| 0–1,000 companies     | Single Fly.io app (2 CPUs, 1GB RAM) + Neon free tier |
| 1,000–5,000 companies | 2 API replicas, Neon paid, Upstash paid              |
| 5,000+ companies      | Multiple regions, read replicas, Redis cluster       |

### Data Isolation (SaaS Multi-tenancy)

- Single database, single schema
- Every table has `orgId` column
- All queries scoped: `WHERE "orgId" = $orgId`
- Application-level isolation (no Supabase RLS — enforced in service layer)
- Critical: middleware validates that authenticated user belongs to requested org

### Backups

- Neon: automatic daily backups, 7-day point-in-time recovery
- R2 files: versioned (for document recovery)
- BullMQ jobs: Redis-persisted (survives restarts)

---

## Mode 2: Self-Hosted (Docker Compose)

For companies that won't send employee data to cloud (hospitals, law firms, govt-adjacent).
This is a key differentiator for enterprise deals.

### docker-compose.yml

```yaml
version: '3.9'
services:
  web:
    image: ghcr.io/avkash/web:latest
    ports: ['3000:3000']
    env_file: .env
    depends_on: [api]

  api:
    image: ghcr.io/avkash/api:latest
    ports: ['4000:4000']
    env_file: .env
    depends_on: [postgres, redis]

  postgres:
    image: postgres:16-alpine
    volumes: ['pg_data:/var/lib/postgresql/data']
    environment:
      POSTGRES_DB: avkash
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes: ['redis_data:/data']

  minio:
    image: minio/minio
    command: server /data
    volumes: ['minio_data:/data']
    ports: ['9000:9000', '9001:9001']
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}

volumes:
  pg_data:
  redis_data:
  minio_data:
```

### One-Command Setup

```bash
curl -fsSL https://get.avkash.io | bash
# OR
git clone https://github.com/zero8dotdev/avkash
cp .env.example .env
# edit .env with DB password, domain, SMTP, etc.
docker compose up -d
docker compose exec api bun run db:migrate
docker compose exec api bun run db:seed
```

### Minimum Server Requirements

| Employees | RAM  | CPU    | Disk   |
| --------- | ---- | ------ | ------ |
| ≤ 100     | 2 GB | 2 vCPU | 20 GB  |
| 100–500   | 4 GB | 2 vCPU | 50 GB  |
| 500–2000  | 8 GB | 4 vCPU | 100 GB |

Works on: DigitalOcean droplet, AWS EC2 t3.small, Azure B2s, any VPS.

### Updates

```bash
docker compose pull
docker compose up -d
docker compose exec api bun run db:migrate
```

### SSL / HTTPS

- Default: Caddy as reverse proxy (auto HTTPS via Let's Encrypt)
- Or: nginx-proxy + acme-companion
- Custom domain configured in `.env`

---

## Mode 3: Self-Hosted (Kubernetes / Helm)

For larger installs (500+ employees, multi-org, enterprise IT teams).

### Helm Chart

```bash
helm repo add avkash https://charts.avkash.io
helm install avkash avkash/avkash \
  --set postgresql.enabled=true \
  --set redis.enabled=true \
  --set ingress.host=hr.company.com \
  --values values.yaml
```

### What's in the Helm Chart

- Deployment: web, api, worker (BullMQ)
- StatefulSets: PostgreSQL (bitnami), Redis (bitnami)
- PersistentVolumeClaims for all stateful data
- Ingress with TLS
- ConfigMap + Secrets management
- HorizontalPodAutoscaler for api + worker
- Liveness + readiness probes

---

## CI/CD Pipeline

```
git push main
  → GitHub Actions:
    1. pnpm lint + type-check
    2. Run tests (unit + integration)
    3. Build Docker images (web + api)
    4. Push to ghcr.io
    5. Deploy to Fly.io (api) + Vercel (web)
    6. Run DB migrations on production
    7. Sentry release notification
```

### Docker Images

```
ghcr.io/avkash/web:latest    # Next.js (Alpine, ~200MB)
ghcr.io/avkash/api:latest    # Bun + Hono (Alpine, ~100MB)
ghcr.io/avkash/worker:latest # BullMQ workers (same as api image)
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth (Better Auth)
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://api.avkash.io

# OAuth
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=avkash-files
# For self-hosted:
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...

# Email
RESEND_API_KEY=...
FROM_EMAIL=noreply@avkash.io

# SMS / WhatsApp
MSG91_AUTH_KEY=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...

# Payments
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...

# App
NEXT_PUBLIC_API_URL=https://api.avkash.io
APP_URL=https://app.avkash.io
```

---

## Monitoring & Observability

### Error Tracking: Sentry

- Frontend: `@sentry/nextjs`
- Backend: `@sentry/bun`
- All unhandled errors captured
- Performance monitoring (TTFB, API latency)
- Alert on error spike

### Logs: Pino → Loki + Grafana (self-hosted)

- Structured JSON logs
- API request logs (method, path, status, duration)
- Job queue logs (job name, duration, success/fail)
- Grafana dashboard for real-time view

### Uptime: Better Stack (betteruptime.com)

- Free tier: 3-minute checks
- Status page: status.avkash.io
- Alert via email + WhatsApp if down

### Database: pganalyze or pg_stat_statements

- Slow query detection
- Index usage stats
- Connection pool monitoring (PgBouncer in front of Postgres for self-hosted)

---

## Disaster Recovery

| Scenario           | Recovery                                   |
| ------------------ | ------------------------------------------ |
| API pod crash      | Auto-restart (Fly.io / K8s)                |
| DB corruption      | Restore from Neon point-in-time / pg_dump  |
| Redis loss         | BullMQ jobs replay from pending state      |
| R2 file loss       | Versioning enabled on bucket               |
| Full region outage | DNS failover to secondary region (Phase 2) |

RPO (Recovery Point Objective): < 24 hours
RTO (Recovery Time Objective): < 1 hour
