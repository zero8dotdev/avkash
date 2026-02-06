# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Avkash is an open-source HR management platform for leave, user, and policy management with Slack integration. Built with Next.js 15 (App Router), React 19, Supabase (PostgreSQL + Auth), Ant Design, and Tailwind CSS.

## Commands

```bash
# Development (HTTPS with Turbopack)
pnpm dev

# Build
pnpm build

# Lint & Format
pnpm lint              # ESLint check
pnpm lint-fix          # ESLint auto-fix
pnpm format            # Prettier check
pnpm format:fix        # Prettier auto-fix

# Database setup (requires .env.local and running Supabase)
supabase start         # Start local Supabase (Docker required)
supabase db reset      # Apply migrations and seed data
pnpm setup             # Run all DB setup scripts (tables, seeds, functions, triggers, policies)

# Individual DB scripts
pnpm tables            # Create tables only
pnpm seeds             # Seed data only
pnpm functions         # DB functions only
pnpm triggers          # DB triggers only
pnpm policies          # RLS policies only
```

## Architecture

### Routing & Layout Groups

Next.js App Router at `src/app/`. Routes are organized into layout groups:

- `(authenticated)/` - Protected routes requiring login (dashboard, initialsetup)
- `(public)/` - Public routes (login, pricing, connect-to-slack)
- `api/` - API route handlers (Slack webhooks, Razorpay payments, calendar feeds)

The dashboard redirects `/dashboard` to `/dashboard/timeline` via `next.config.mjs`.

### Underscore-Prefixed Directories

Private/shared code within `src/app/` uses underscore prefixes (not exposed as routes):

- `_actions/` - Server actions (`'use server'`)
- `_components/` - Shared React components
- `_context/` - React Context (ApplicationContext with useReducer)
- `_hooks/` - Custom React hooks
- `_utils/` - Utilities, including `supabase/` clients (server, client, admin, middleware)

### Authentication

Supabase Auth with SSR. `middleware.ts` refreshes sessions on every request. Three Supabase client variants:

- **Client** (`_utils/supabase/client.ts`) - Browser-side, respects RLS
- **Server** (`_utils/supabase/server.ts`) - Server components/actions, respects RLS
- **Admin** (`_utils/supabase/admin.ts`) - Service role key, bypasses RLS

### State Management

React Context via `_context/appContext.tsx` using useReducer. State holds: orgId, userId, teamId, role, user, org, team, teams.

### Database

- PostgreSQL via Supabase with Row Level Security (RLS)
- Schema defined in `db/tables/`, functions in `db/functions/`, triggers in `db/triggers/`, policies in `db/policies/`
- `database.types.ts` at project root - auto-generated Supabase types
- Prisma (`@prisma/client`) also available as an ORM layer
- Key enums: `Role` (OWNER, MANAGER, USER, ANON, ADMIN), `LeaveStatus` (PENDING, APPROVED, REJECTED, DELETED), `Visibility` (ORG, TEAM, SELF)

### Slack Integration

Comprehensive Slack integration in `src/app/api/slack/` handling slash commands, modals, block actions, home tab, view submissions, and message filtering.

### Payments

Razorpay integration for payment processing with webhook verification at `src/app/api/rpay-webhooks/`.

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Commit Conventions

Enforced by commitlint + husky. Format: `type(scope): message`

- **Types:** feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- **Scopes:** setup, config, deps, feature, bug, docs, style, refactor, test, build, ci, release, other

Pre-commit hooks run lint-staged (type-check, prettier, eslint).

## Key Configuration

- **Tailwind breakpoints:** sm=576px, md=768px, lg=1024px, xl=1440px (non-standard)
- **ESLint:** Airbnb + Next.js + Prettier with extensive rule overrides
- **Node requirement:** >= 20.0.0
- **Dev server uses HTTPS** with `NODE_TLS_REJECT_UNAUTHORIZED=0`
